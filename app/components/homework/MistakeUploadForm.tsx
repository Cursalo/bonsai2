'use client';

import React, { useState } from 'react';
import { useForm, useFieldArray, Controller, SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import axios from 'axios';
import { useRouter } from 'next/navigation';

// Allow file input - make manual entries optional if file exists?
// For simplicity, keep manual entries for now, file upload is alternative trigger
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB Example Limit
const ACCEPTED_IMAGE_TYPES = ["image/jpeg", "image/jpg", "image/png", "image/webp"];
const ACCEPTED_PDF_TYPES = ["application/pdf"];

// Define the schema for a single missed question
const missedQuestionSchema = z.object({
  section: z.string().min(1, 'Section is required'), // Keep as string for flexibility, convert later if needed
  questionNumber: z.coerce.number().min(1, 'Question number must be at least 1'),
});

// Define the main form schema
const mistakeUploadSchema = z.object({
  testId: z.string().min(1, 'Please select a test'),
  missedQuestions: z.array(missedQuestionSchema).optional(), // Manual entry optional
  file: z
    .instanceof(File, { message: 'File is required.' })
    .refine((file) => file?.size <= MAX_FILE_SIZE, `Max file size is 5MB.`)
    .refine(
      (file) => [...ACCEPTED_IMAGE_TYPES, ...ACCEPTED_PDF_TYPES].includes(file?.type),
      ".jpg, .jpeg, .png, .webp and .pdf files are accepted."
    )
    .optional(), // File input optional
}).refine(data => data.missedQuestions?.length || data.file, {
    message: "Please either enter questions manually or upload a file.",
    path: ["missedQuestions"], // Attach error to manual section or a general path
});

// Infer the type from the schema
type MistakeUploadFormValues = z.infer<typeof mistakeUploadSchema>;

// Placeholder for available tests - replace with actual data source later
const availableTests = [
  { id: 'practice-test-1', name: 'Official Practice Test 1' },
  { id: 'practice-test-2', name: 'Official Practice Test 2' },
  { id: 'practice-test-3', name: 'Official Practice Test 3' },
  { id: 'practice-test-4', name: 'Official Practice Test 4' },
  // Add more tests as needed
];

export default function MistakeUploadForm() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<{ type: 'success' | 'error', message: string } | null>(null);
  const router = useRouter();

  const {
    control,
    register,
    handleSubmit,
    formState: { errors },
    reset,
    watch, // Watch file input
  } = useForm<MistakeUploadFormValues>({
    resolver: zodResolver(mistakeUploadSchema),
    defaultValues: {
      testId: '',
      missedQuestions: [{ section: '', questionNumber: '' as any }],
      file: undefined,
    },
    mode: 'onChange',
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'missedQuestions',
  });

  const watchedFile = watch('file');

  const onSubmit: SubmitHandler<MistakeUploadFormValues> = async (data) => {
    setIsSubmitting(true);
    setSubmitStatus(null);
    console.log('Submitting Form Data (potentially with file):', data);

    // Use FormData if file exists
    const formData = new FormData();
    formData.append('testId', data.testId);
    if (data.file) {
        formData.append('file', data.file);
        console.log("File included in submission.");
    } else if (data.missedQuestions) {
        formData.append('missedQuestions', JSON.stringify(data.missedQuestions));
         console.log("Manual questions included in submission.");
    }

    try {
      const response = await axios.post<{ message: string, quizId: string, unmappedCount?: number }>
        ('/api/homework/submit-mistakes', formData, {
            headers: {
                // Important for file uploads with FormData
                'Content-Type': 'multipart/form-data',
            },
        });
      
      console.log('API Response:', response.data);
      const newQuizId = response.data.quizId;
      let successMessage = response.data.message || 'Submission successful!';
      if(response.data.unmappedCount && response.data.unmappedCount > 0) {
        successMessage += ` (${response.data.unmappedCount} question(s) could not be mapped).`
      }

      setSubmitStatus({ type: 'success', message: successMessage });
      reset();

      if (newQuizId) {
        console.log(`Redirecting to quiz: /homework/quiz/${newQuizId}`);
        router.push(`/homework/quiz/${newQuizId}`);
      } else {
         console.error("Quiz ID not found in response, cannot redirect.");
         setSubmitStatus({ type: 'error', message: 'Submission processed, but failed to get quiz link.' });
      }

    } catch (error) {
      console.error('Submission Error:', error);
      let errorMessage = 'Submission failed. Please try again.';
      if (axios.isAxiosError(error) && error.response?.data?.message) {
        errorMessage = error.response.data.message;
      }
      setSubmitStatus({ type: 'error', message: errorMessage });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {/* Test Selection */}
      <div>
        <label htmlFor="testId" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
          Official SAT Practice Test
        </label>
        <select
          id="testId"
          {...register('testId')}
          disabled={isSubmitting}
          className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md disabled:opacity-70 disabled:cursor-not-allowed"
        >
          <option value="">Select a test...</option>
          {availableTests.map((test) => (
            <option key={test.id} value={test.id}>
              {test.name}
            </option>
          ))}
        </select>
        {errors.testId && <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.testId.message}</p>}
      </div>

      {/* File Upload Input */}
      <div>
         <label htmlFor="file-upload" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            Upload Answer Sheet (Optional)
          </label>
          <div className="mt-1 flex items-center">
             <input 
                id="file-upload"
                type="file"
                {...register('file')} // Register file input
                accept=".pdf,.jpg,.jpeg,.png,.webp"
                className="block w-full text-sm text-gray-500 dark:text-gray-400 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 dark:file:bg-indigo-900 file:text-indigo-700 dark:file:text-indigo-300 hover:file:bg-indigo-100 dark:hover:file:bg-indigo-800 disabled:opacity-70"
                disabled={isSubmitting}
              />
          </div>
          {errors.file && <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.file.message}</p>}
          {watchedFile && <p className="mt-1 text-xs text-gray-500">Selected: {watchedFile.name}</p>}
      </div>

      <div className="relative">
        <div className="absolute inset-0 flex items-center" aria-hidden="true">
          <div className="w-full border-t border-gray-300 dark:border-gray-600"></div>
        </div>
        <div className="relative flex justify-center">
          <span className="px-2 bg-white dark:bg-gray-800 text-sm text-gray-500 dark:text-gray-400">Or Enter Manually</span>
        </div>
      </div>

      {/* Missed Questions Array */}
      <div className="space-y-4">
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
          Missed Questions
        </label>
        {fields.map((field, index) => (
          <div key={field.id} className="flex items-start space-x-3 p-3 border border-gray-200 dark:border-gray-700 rounded-md">
            <div className="flex-1 grid grid-cols-2 gap-3">
              <div>
                <label htmlFor={`missedQuestions.${index}.section`} className="sr-only">Section</label>
                <input
                  type="text"
                  placeholder="Section (e.g., 1, 2, Math, Reading)"
                  {...register(`missedQuestions.${index}.section`)}
                  disabled={isSubmitting}
                  id={`missedQuestions.${index}.section`}
                  className="block w-full shadow-sm sm:text-sm border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-md disabled:opacity-70 disabled:cursor-not-allowed"
                />
                {errors.missedQuestions?.[index]?.section && (
                  <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.missedQuestions[index].section.message}</p>
                )}
              </div>
              <div>
                <label htmlFor={`missedQuestions.${index}.questionNumber`} className="sr-only">Question Number</label>
                <input
                  type="number"
                  placeholder="Question #"
                  {...register(`missedQuestions.${index}.questionNumber`)}
                  disabled={isSubmitting}
                  id={`missedQuestions.${index}.questionNumber`}
                  className="block w-full shadow-sm sm:text-sm border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-md disabled:opacity-70 disabled:cursor-not-allowed"
                />
                {errors.missedQuestions?.[index]?.questionNumber && (
                  <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.missedQuestions[index].questionNumber.message}</p>
                )}
              </div>
            </div>
            <button
              type="button"
              onClick={() => remove(index)}
              disabled={fields.length <= 1 || isSubmitting}
              className="inline-flex items-center px-2.5 py-1.5 border border-transparent text-xs font-medium rounded text-red-700 bg-red-100 hover:bg-red-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50 disabled:cursor-not-allowed mt-1"
            >
              Remove
            </button>
          </div>
        ))}
        {errors.missedQuestions?.root && <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.missedQuestions.root.message}</p>}

        <button
          type="button"
          onClick={() => append({ section: '', questionNumber: '' as any })}
          disabled={isSubmitting}
          className="mt-2 inline-flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 shadow-sm text-sm font-medium rounded-md text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-70 disabled:cursor-not-allowed"
        >
          Add Another Question
        </button>
      </div>

      {/* Submission Status Feedback */}
      {submitStatus && (
        <div
          className={`p-3 rounded-md ${submitStatus.type === 'success' ? 'bg-green-100 dark:bg-green-900' : 'bg-red-100 dark:bg-red-900'
            }`}
        >
          <p
            className={`text-sm font-medium ${submitStatus.type === 'success' ? 'text-green-800 dark:text-green-200' : 'text-red-800 dark:text-red-200'
              }`}
          >
            {submitStatus.message}
          </p>
        </div>
      )}

      {/* Submit Button */}
      <div>
        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 dark:focus:ring-offset-gray-800 disabled:opacity-70 disabled:cursor-not-allowed"
        >
          {isSubmitting ? 'Submitting...' : 'Generate Personalized Quiz'}
        </button>
      </div>
    </form>
  );
} 