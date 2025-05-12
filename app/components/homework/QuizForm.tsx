'use client';

import React, { useState } from 'react';
import { useForm, Controller, SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import axios from 'axios';
import { useRouter } from 'next/navigation';
import FollowUpQuiz from './FollowUpQuiz';
import { useQueryClient } from '@tanstack/react-query';

// Define the types passed as props (matching the page component)
interface QuestionOption {
  id: string;
  text: string;
}

interface QuizQuestion {
  id: string; // This is the ID from the quiz_questions table
  order: number;
  modeled_question_id: string;
  text?: string;
  options?: QuestionOption[];
}

// Define the schema for the form values
// Use z.record to represent answers as { [quiz_question_id]: selected_option_id }
const quizAnswersSchema = z.object({
  answers: z.record(z.string(), z.string().min(1, "Please answer all questions"))
    // Add refinement to ensure all questions passed in props are answered
    // This requires passing the question IDs to the refinement context, which is complex.
    // Simple validation: Check if the number of keys matches expected number of questions later if needed.
});

type QuizFormValues = z.infer<typeof quizAnswersSchema>;

// Type for the quiz submission result
interface QuizSubmissionResult {
    totalQuestions: number;
    correctCount: number;
    score: number;
    missedModeledQuestionIds: string[]; 
}

// Type for remediation data from the API
interface FollowUpQuestion {
    id: string;
    text: string;
    options: any;
}
interface RemediationItem {
  missedModeledQuestionId: string;
  videoUrl?: string | null;
  pdfUrl?: string | null;
  followUpQuestions: FollowUpQuestion[];
}

// Type for storing follow-up results keyed by missedModeledQuestionId
interface FollowUpResults {
    [key: string]: { // Key is missedModeledQuestionId
        mastered: boolean;
        message: string;
        // Add score etc. if needed
    }
}

interface QuizFormProps {
  quizId: string; // Pass the quiz ID for submission
  questions: QuizQuestion[];
  // Add callback for successful submission later?
  // onSubmitSuccess?: (results: any) => void;
}

export default function QuizForm({ quizId, questions }: QuizFormProps) {
  const [formStep, setFormStep] = useState<'answering' | 'submitted' | 'showing_remediation'>('answering');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null); // Specific error for submission
  const [quizResults, setQuizResults] = useState<QuizSubmissionResult | null>(null);
  
  // State for remediation fetching
  const [remediationData, setRemediationData] = useState<RemediationItem[] | null>(null);
  const [remediationLoading, setRemediationLoading] = useState(false);
  const [remediationError, setRemediationError] = useState<string | null>(null);
  const [followUpResults, setFollowUpResults] = useState<FollowUpResults>({}); // Store follow-up quiz results
  
  const router = useRouter();
  const queryClient = useQueryClient();

  const {
    control,
    handleSubmit,
    formState: { errors },
    watch // To check if all questions are answered (optional)
  } = useForm<QuizFormValues>({
    resolver: zodResolver(quizAnswersSchema),
    defaultValues: {
      answers: {},
    },
    mode: 'onChange',
  });

  // Check if all questions have been answered (optional, for enabling submit button)
  // const answeredQuestions = Object.keys(watch('answers') || {}).length;
  // const allAnswered = answeredQuestions === questions.length;

  // Function to fetch remediation content
  const fetchRemediation = async (missedIds: string[]) => {
    if (missedIds.length === 0) return; // No remediation needed

    setRemediationLoading(true);
    setRemediationError(null);
    setRemediationData(null); // Clear previous data
    try {
      const response = await axios.get('/api/remediation', {
        params: { modeledQuestionIds: missedIds.join(',') }
      });
      setRemediationData(response.data);
      setFormStep('showing_remediation'); // Move to remediation step
    } catch (error) {
      console.error("Failed to fetch remediation content:", error);
      setRemediationError("Could not load remediation content. Please try refreshing.");
      // Stay in 'submitted' step if remediation fails
    } finally {
      setRemediationLoading(false);
    }
  };

  const onSubmit: SubmitHandler<QuizFormValues> = async (data) => {
    // Check if all questions are answered before submitting
    const answeredCount = Object.keys(data.answers).length;
    if (answeredCount !== questions.length) {
        setSubmitError('Please answer all questions before submitting.');
        return; 
    }

    setIsSubmitting(true);
    setSubmitError(null);
    setQuizResults(null);
    setRemediationData(null);
    setRemediationError(null);
    console.log('Submitting Quiz Answers:', data.answers);

    try {
      // Send answers to the backend API endpoint
      const response = await axios.post<{ message: string, results: QuizSubmissionResult }>(`/api/homework/quiz/${quizId}/submit`, data.answers);
      
      console.log('Submission Response:', response.data);
      setQuizResults(response.data.results); // Store the results
      setFormStep('submitted'); // Update state to show results/loading remediation

      // If there were missed questions, fetch remediation content
      if (response.data.results?.missedModeledQuestionIds?.length > 0) {
        await fetchRemediation(response.data.results.missedModeledQuestionIds);
      } else {
         // If no missed questions, maybe navigate away or show a success message without remediation
         console.log("Perfect score! No remediation needed.");
         // Optionally, navigate away after a delay
         // setTimeout(() => router.push('/dashboard'), 3000); 
      }

    } catch (error) {
      console.error('Quiz Submission Error:', error);
      let message = 'Failed to submit quiz.';
      if (axios.isAxiosError(error) && error.response?.data?.message) {
          message = error.response.data.message;
      }
      setSubmitError(message);
      setFormStep('answering'); // Stay on form if submission fails
    } finally {
      setIsSubmitting(false);
    }
  };

  // Callback function for FollowUpQuiz completion
  const handleFollowUpComplete = (missedId: string, results: any) => {
    console.log(`Follow-up complete for ${missedId}:`, results);
    const mastered = results?.mastered ?? false;
    setFollowUpResults(prev => ({
      ...prev,
      [missedId]: {
        mastered: mastered,
        message: results?.message || "Practice complete."
      }
    }));

    // If mastered, invalidate queries related to user skills/dashboard
    if (mastered) {
       console.log(`Concept related to ${missedId} mastered. Invalidating user skills query.`);
       // Replace 'userSkills' with the actual query key used for fetching skills on the dashboard
       queryClient.invalidateQueries({ queryKey: ['userSkills'] }); 
    }
    
    // Check if all remediations are now done
    const allRemediationsProcessed = remediationData?.every(
        item => !!followUpResults[item.missedModeledQuestionId] || item.followUpQuestions.length === 0
    );
    // Maybe enable a "Finish" button or auto-navigate if allRemediationsProcessed is true
  };

  // --- Conditional Rendering based on formStep --- 

  // 1. Answering Step
  if (formStep === 'answering') {
    return (
      <form onSubmit={handleSubmit(onSubmit)} className="mt-6 bg-white dark:bg-gray-800 shadow rounded-lg p-6">
        <h2 className="text-lg font-medium mb-4">Questions:</h2>
        {questions.length > 0 ? (
          <ul className="space-y-8">
            {questions
              .sort((a, b) => a.order - b.order)
              .map((q, index) => (
                <li key={q.id} className="p-4 border dark:border-gray-700 rounded-md shadow-sm">
                  <p className="font-semibold mb-2 text-gray-800 dark:text-gray-200">Question {index + 1}</p>
                  <p className="mb-4 whitespace-pre-wrap text-gray-900 dark:text-gray-100">{q.text || '[No question text found]'}</p>
                  
                  {q.options && q.options.length > 0 ? (
                    <Controller
                      name={`answers.${q.id}`}
                      control={control}
                      rules={{ required: 'Please select an answer' }} // Add basic required rule
                      render={({ field }) => (
                        <fieldset className="space-y-3">
                          {q.options!.map((opt) => (
                            <div key={opt.id} className="flex items-center">
                              <input 
                                {...field} // Spread field props (name, onChange, onBlur, value, ref)
                                id={`option-${q.id}-${opt.id}`}
                                type="radio" 
                                value={opt.id} 
                                checked={field.value === opt.id} // Ensure checked state is managed
                                disabled={isSubmitting} // Disable during submission
                                className="mr-3 h-4 w-4 text-indigo-600 border-gray-300 focus:ring-indigo-500 dark:border-gray-600 dark:bg-gray-700 dark:focus:ring-indigo-600 dark:focus:ring-offset-gray-800 disabled:opacity-70"
                              />
                              <label 
                                htmlFor={`option-${q.id}-${opt.id}`} 
                                className="text-sm text-gray-700 dark:text-gray-300 cursor-pointer"
                              >
                                {opt.text}
                              </label>
                            </div>
                          ))}
                        </fieldset>
                      )}
                    />
                  ) : (
                    <p className="text-sm text-gray-500 dark:text-gray-400">[No options found]</p>
                  )}
                  {/* Display validation error for this specific question - add optional chaining */}
                  {errors.answers?.[q.id] && (
                      <p className="mt-2 text-sm text-red-600 dark:text-red-400">{errors.answers?.[q.id]?.message}</p>
                  )}
                </li>
              ))}
          </ul>
        ) : (
          <p className="text-gray-600 dark:text-gray-400">No questions found for this quiz.</p>
        )}

        {/* Submission Error Feedback */}
        {submitError && (
          <div className="mt-6 p-3 rounded-md bg-red-100 dark:bg-red-900">
            <p className="text-sm font-medium text-red-800 dark:text-red-200">{submitError}</p>
          </div>
        )}

        <div className="mt-8 border-t dark:border-gray-700 pt-5">
          <button 
            type="submit" 
            disabled={isSubmitting}
            className="w-full btn-primary disabled:opacity-70"
          >
            {isSubmitting ? 'Submitting...' : 'Submit Quiz'}
          </button>
        </div>
      </form>
    );
  }

  // 2. Submitted Step (Showing Results / Loading Remediation)
  if (formStep === 'submitted') {
    return (
      <div className="mt-6 bg-white dark:bg-gray-800 shadow rounded-lg p-6">
        <h2 className="text-xl font-semibold mb-4 text-center">Quiz Submitted!</h2>
        {quizResults ? (
          <div className="text-center mb-6">
            <p className="text-lg">Your Score: <span className="font-bold">{quizResults.score}%</span> ({quizResults.correctCount}/{quizResults.totalQuestions})</p>
          </div>
        ) : (
          <p className="text-center text-gray-500">Processing results...</p> // Should not happen if logic is correct
        )}

        {/* Remediation Loading/Error State */}
        {remediationLoading && <p className="text-center text-indigo-600 dark:text-indigo-400">Loading remediation content...</p>}
        {remediationError && <p className="text-center text-red-600 dark:text-red-400 mt-4">{remediationError}</p>}
        {quizResults && quizResults.missedModeledQuestionIds.length === 0 && !remediationLoading &&
           <p className="text-center text-green-600 dark:text-green-400 mt-4">Great job! No concepts need review from this quiz.</p>
        }
        {/* Button to proceed or go back? */}
        <div className="mt-6 text-center">
            <button onClick={() => router.push('/dashboard')} className="btn-secondary">Back to Dashboard</button>
        </div>
      </div>
    );
  }

  // 3. Showing Remediation Step
  if (formStep === 'showing_remediation') {
    return (
      <div className="mt-6">
        <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6 mb-6">
            <h2 className="text-xl font-semibold mb-4 text-center">Quiz Results</h2>
            {quizResults && (
              <div className="text-center mb-6">
                <p className="text-lg">Your Score: <span className="font-bold">{quizResults.score}%</span> ({quizResults.correctCount}/{quizResults.totalQuestions})</p>
                <p className="text-sm text-gray-600 dark:text-gray-400">You missed {quizResults.missedModeledQuestionIds.length} question(s).</p>
              </div>
            )}
        </div>

        <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">Concepts to Review</h2>
        {remediationData && remediationData.length > 0 ? (
            <div className="space-y-6">
                {remediationData.map((item) => (
                    <div key={item.missedModeledQuestionId} className="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
                        <h3 className="text-lg font-medium mb-3">Review for Missed Question (ID: {item.missedModeledQuestionId})</h3>
                        
                        {/* Video/PDF Links */} 
                        <div className="flex space-x-4 mb-4">
                            {item.videoUrl && <a href={item.videoUrl} target="_blank" rel="noopener noreferrer" className="btn-secondary btn-sm">Watch Video Lesson</a>}
                            {item.pdfUrl && <a href={item.pdfUrl} target="_blank" rel="noopener noreferrer" className="btn-secondary btn-sm">View PDF Guide</a>}
                            {!item.videoUrl && !item.pdfUrl && <p className="text-sm text-gray-500">No specific video/PDF available for this concept.</p>}
                        </div>

                        {/* Follow-up Questions Section */}
                        {followUpResults[item.missedModeledQuestionId] ? (
                            // If follow-up is completed for this item
                            <div className={`mt-4 p-3 rounded-md ${followUpResults[item.missedModeledQuestionId].mastered ? 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200' : 'bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200'}`}>
                                <p className="text-sm font-medium">
                                    {followUpResults[item.missedModeledQuestionId].message}
                                    {followUpResults[item.missedModeledQuestionId].mastered ? " (Concept Mastered!) 🎉" : " (Needs more practice)"}
                                </p>
                            </div>
                        ) : (
                           // Render the FollowUpQuiz component if not completed
                            <FollowUpQuiz
                                missedModeledQuestionId={item.missedModeledQuestionId}
                                followUpQuestions={item.followUpQuestions}
                                onQuizComplete={handleFollowUpComplete} 
                           />
                        )}
                    </div>
                ))}
            </div>
        ) : (
            <p className="text-gray-600 dark:text-gray-400">Could not load remediation details.</p>
        )}
        <div className="mt-8 text-center">
            <button onClick={() => router.push('/dashboard')} className="btn-primary">Back to Dashboard</button>
        </div>
      </div>
    );
  }

  return null; // Should not be reached
} 