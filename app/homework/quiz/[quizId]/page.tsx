'use client'; // Or make it a Server Component if fetching data server-side initially

import React, { useEffect, useState } from 'react';
import { useParams } from 'next/navigation'; // Hook to get route parameters
import DashboardLayout from '@/app/components/layouts/DashboardLayout';
import axios from 'axios';
import QuizForm from '@/app/components/homework/QuizForm'; // Import the new form component

// Update types to match the processed data structure from the API
interface QuestionOption {
  // Assuming options are structured like this in your DB JSON
  // Adjust if your structure is different (e.g., array of strings)
  id: string; 
  text: string;
}

interface QuizQuestion {
  id: string; // ID from quiz_questions table
  order: number;
  modeled_question_id: string; // ID from modeled_questions table
  text?: string; // Text from modeled_questions table
  options?: QuestionOption[]; // Options from modeled_questions table
}

interface QuizData {
  id: string; // Quiz ID (from user_quizzes)
  status: string;
  created_at: string;
  source_official_test_id: string | null;
  questions: QuizQuestion[];
}

export default function QuizPage() {
  const params = useParams();
  const quizId = params.quizId as string;

  const [quizData, setQuizData] = useState<QuizData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!quizId) return;
    const fetchQuiz = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await axios.get(`/api/homework/quiz/${quizId}`);
        setQuizData(response.data);
      } catch (err) {
        console.error("Failed to fetch quiz:", err);
        setError("Failed to load the quiz. Please try again later.");
      } finally {
        setLoading(false);
      }
    };
    fetchQuiz();
  }, [quizId]);

  if (loading) {
    return (
      <DashboardLayout>
        <div className="p-6 text-center">Loading Quiz...</div>
      </DashboardLayout>
    );
  }

  if (error) {
    return (
      <DashboardLayout>
        <div className="p-6 text-center text-red-600 dark:text-red-400">{error}</div>
      </DashboardLayout>
    );
  }

  if (!quizData) {
    return (
      <DashboardLayout>
        <div className="p-6 text-center">Quiz not found.</div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
          <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">
            Personalized Quiz
            {quizData.source_official_test_id && 
              <span className="text-sm font-normal text-gray-500 dark:text-gray-400 ml-2">(Based on {quizData.source_official_test_id})</span>
            }
          </h1>
          <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
            Quiz ID: {quizData.id} | Status: {quizData.status}
          </p>

          {/* Use the new QuizForm component */}
          {quizData.questions && quizData.questions.length > 0 ? (
             <QuizForm quizId={quizData.id} questions={quizData.questions} />
          ) : (
            <div className="mt-6 bg-white dark:bg-gray-800 shadow rounded-lg p-6 text-center text-gray-500 dark:text-gray-400">
              No questions are available for this quiz.
            </div>
          )}
          
        </div>
      </div>
    </DashboardLayout>
  );
} 