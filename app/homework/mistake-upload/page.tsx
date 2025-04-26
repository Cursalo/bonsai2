import DashboardLayout from '@/app/components/layouts/DashboardLayout';
import MistakeUploadForm from '@/app/components/homework/MistakeUploadForm';

export default function MistakeUploadPage() {
  return (
    <DashboardLayout>
      <div className="py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
          <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">
            Upload Missed SAT Questions
          </h1>
          <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
            Select the official practice test and enter the section and question number for each question you missed.
          </p>
          <div className="mt-6 bg-white dark:bg-gray-800 shadow px-4 py-5 sm:rounded-lg sm:p-6">
            <MistakeUploadForm />
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
} 