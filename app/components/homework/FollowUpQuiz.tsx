'use client';

import React, { useState } from 'react';
import { useForm, Controller, SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import axios from 'axios';

// --- Types ---
interface FollowUpQuestion {
  id: string;
  text: string;
  options: { id: string; text: string }[]; // Assuming consistent option structure
}

// Schema for answers: { [modeled_question_id]: selected_option_id }
const followUpAnswersSchema = z.object({
  answers: z.record(z.string(), z.string().min(1, "Please answer all questions"))
});
type FollowUpFormValues = z.infer<typeof followUpAnswersSchema>;

interface FollowUpQuizProps {
  missedModeledQuestionId: string; // The ID of the question this set is for
  followUpQuestions: FollowUpQuestion[];
  onQuizComplete: (missedId: string, results: any) => void; // Callback with results
}
// --- End Types ---

export default function FollowUpQuiz({ missedModeledQuestionId, followUpQuestions, onQuizComplete }: FollowUpQuizProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<FollowUpFormValues>({
    resolver: zodResolver(followUpAnswersSchema),
    defaultValues: { answers: {} },
    mode: 'onChange',
  });

  const onSubmit: SubmitHandler<FollowUpFormValues> = async (data) => {
    // Simple validation: check if all questions are answered
    if (Object.keys(data.answers).length !== followUpQuestions.length) {
      setSubmitError("Please answer all practice questions.");
      return;
    }

    setIsSubmitting(true);
    setSubmitError(null);

    try {
      // POST to a new endpoint for follow-up submissions
      const response = await axios.post('/api/remediation/submit', {
        missedModeledQuestionId: missedModeledQuestionId, // Send context
        answers: data.answers, // { followUpQ_id: selectedOptionId, ... }
      });
      console.log('Follow-up submission response:', response.data);
      onQuizComplete(missedModeledQuestionId, response.data); // Pass results back up
    } catch (error) {
      console.error("Error submitting follow-up answers:", error);
      let message = 'Failed to submit practice answers.';
      if (axios.isAxiosError(error) && error.response?.data?.message) {
        message = error.response.data.message;
      }
      setSubmitError(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!followUpQuestions || followUpQuestions.length === 0) {
    return <p className="text-sm text-gray-500">No follow-up questions available.</p>;
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 border-t dark:border-gray-700 pt-4 mt-4">
      <h4 className="font-semibold mb-2 text-gray-800 dark:text-gray-200">Practice Questions:</h4>
      <ul className="space-y-6">
        {followUpQuestions.map((fq, index) => (
          <li key={fq.id}>
            <p className="font-medium text-sm mb-1 text-gray-900 dark:text-gray-100">Follow-up {index + 1}:</p>
            <p className="text-sm mb-3 whitespace-pre-wrap text-gray-800 dark:text-gray-200">{fq.text}</p>
            {fq.options && fq.options.length > 0 ? (
              <Controller
                name={`answers.${fq.id}`} // Use modeled_question_id as key
                control={control}
                rules={{ required: 'Please select an answer' }}
                render={({ field }) => (
                  <fieldset className="space-y-2 pl-2">
                    {fq.options.map((opt) => (
                      <div key={opt.id} className="flex items-center">
                        <input
                          {...field}
                          id={`followup-${missedModeledQuestionId}-${fq.id}-${opt.id}`}
                          type="radio"
                          value={opt.id}
                          checked={field.value === opt.id}
                          disabled={isSubmitting}
                          className="mr-2 h-4 w-4 text-indigo-600 border-gray-300 focus:ring-indigo-500 dark:border-gray-600 dark:bg-gray-700 dark:focus:ring-indigo-600 dark:focus:ring-offset-gray-800 disabled:opacity-70"
                        />
                        <label
                          htmlFor={`followup-${missedModeledQuestionId}-${fq.id}-${opt.id}`}
                          className="text-xs text-gray-700 dark:text-gray-300 cursor-pointer"
                        >
                          {opt.text}
                        </label>
                      </div>
                    ))}
                  </fieldset>
                )}
              />
            ) : (
              <p className="text-xs text-gray-500">[No options available]</p>
            )}
             {errors.answers?.[fq.id] && (
                <p className="mt-1 text-xs text-red-600 dark:text-red-400">{errors.answers?.[fq.id]?.message}</p>
            )}
          </li>
        ))}
      </ul>

      {submitError && (
          <div className="mt-4 p-2 rounded-md bg-red-100 dark:bg-red-900">
            <p className="text-xs font-medium text-red-800 dark:text-red-200">{submitError}</p>
          </div>
        )}

      <button 
        type="submit" 
        disabled={isSubmitting} 
        className="w-full btn-secondary btn-sm mt-4 disabled:opacity-70"
      >
        {isSubmitting ? 'Checking...' : 'Check Practice Answers'}
      </button>
    </form>
  );
} 