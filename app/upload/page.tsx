'use client'

import React, { useState, useEffect } from 'react';
import { useFormState, useFormStatus } from 'react-dom';
import { analyzePracticeTest } from './actions'; // Import the server action
import DashboardLayout from '@/app/components/layouts/DashboardLayout';

// Submit Button component to use useFormStatus
function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="w-full btn-primary flex justify-center py-2 px-4 disabled:opacity-50"
    >
      {pending ? 'Uploading & Analyzing...' : 'Upload and Analyze'}
    </button>
  );
}

// Upload Form Component using useFormState
const UploadForm = () => {
  // Initial state for the form action result
  const initialState = null;
  const [state, formAction] = useFormState(analyzePracticeTest, initialState);

  const [selectedFileName, setSelectedFileName] = useState<string | null>(null);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      setSelectedFileName(event.target.files[0].name);
    } else {
      setSelectedFileName(null);
    }
  };
  
  // Effect to clear file input when form submission is successful
  useEffect(() => {
    if (state?.success) {
      const fileInput = document.getElementById('file-upload') as HTMLInputElement;
      if (fileInput) {
        fileInput.value = '';
      }
      setSelectedFileName(null);
      // Optionally clear the form state message after a delay
      // setTimeout(() => { /* logic to clear state message if needed */ }, 5000);
    }
  }, [state]);

  return (
    // Use the formAction in the form tag
    <form action={formAction} className="space-y-6 max-w-lg mx-auto p-6 bg-white dark:bg-gray-800 rounded-lg shadow-md">
      <h2 className="text-2xl font-semibold text-gray-900 dark:text-white">Upload Practice Test Results</h2>
      
      {/* Display message from server action state */}
      {state?.message && (
        <div className={`p-3 rounded-md text-sm ${
          state.success 
            ? 'bg-green-50 dark:bg-green-900/30 text-green-800 dark:text-green-200' 
            : 'bg-red-50 dark:bg-red-900/30 text-red-800 dark:text-red-200'
        }`}>
          {state.message}
        </div>
      )}
      {/* Optionally display missed skills for debugging/confirmation */}
      {state?.success && state.missedSkills && (
        <div className="mt-4 p-3 border border-blue-200 dark:border-blue-800 rounded-md text-sm bg-blue-50 dark:bg-blue-900/30 text-blue-800 dark:text-blue-200">
          <p className="font-medium mb-1">Detected Missed Skills:</p>
          <ul className="list-disc list-inside">
            {state.missedSkills.map((skill, index) => (
              <li key={index}>{skill}</li>
            ))}
          </ul>
        </div>
      )}

      <div>
        <label htmlFor="file-upload" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          Select File
        </label>
        <input 
          id="file-upload" 
          name="file-upload" // Name must match what the server action expects
          type="file"
          onChange={handleFileChange}
          required // Add basic client-side validation
          className="block w-full text-sm text-gray-500 dark:text-gray-400
            file:mr-4 file:py-2 file:px-4
            file:rounded-md file:border-0
            file:text-sm file:font-semibold
            file:bg-primary-50 file:text-primary-700 dark:file:bg-primary-900/40 dark:file:text-primary-300
            hover:file:bg-primary-100 dark:hover:file:bg-primary-900/60
            cursor-pointer dark:bg-gray-700 rounded-md" 
        />
        {selectedFileName && (
          <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">Selected: {selectedFileName}</p>
        )}
      </div>

      <SubmitButton />

      <p className="text-xs text-center text-gray-500 dark:text-gray-400">
        Upload your completed practice test answers (e.g., PDF, image). We'll analyze your missed questions. 
        Your upload is processed privately and not stored long-term.
      </p>
    </form>
  );
};

// Main Page Component remains the same
export default function UploadPage() {
  return (
    <DashboardLayout>
      <div className="py-12 px-4 sm:px-6 lg:px-8">
        <UploadForm />
      </div>
    </DashboardLayout>
  );
} 