import DashboardLayout from '@/app/components/layouts/DashboardLayout';
import mockSupabase from '@/app/lib/mock-supabase'; // Import mockSupabase
import Image from 'next/image'; // Import Image for thumbnails

// Define the expected structure of a video lesson based on mock data
interface VideoLesson {
  id: string;
  title: string;
  description: string;
  duration: string;
  thumbnail: string;
  url: string; // Assuming a URL exists for linking, though not used in this card display
  watched: boolean;
  progress: number;
  instructor: string;
  created_at: string;
  subject?: string; // Add subject for grouping
}

// Function to fetch mock video data
async function getAllVideos(): Promise<VideoLesson[]> {
  // Use the 'video_lessons' table mock structure select().eq().order().limit()
  // Provide dummy args as the mock returns the full list regardless in this path
  // Use the 'video_lessons' table mock structure select().eq().order().limit()
  // Add @ts-ignore due to complex mock type inference issues
  // Assign promise to variable first, then await
  // Place @ts-ignore directly before the problematic .order() call
  const videoPromise = mockSupabase
    .from('video_lessons')
    .select()
    .eq() // Call eq as defined in mock
    // @ts-ignore - Mock structure is complex, TS struggles with inference here
    .order() // Call order as defined in mock
    .limit(); // Call limit as defined in mock

  const { data, error } = await videoPromise;

  if (error) {
    console.error('Error fetching mock videos:', error);
    return [];
  }
  // Add subject based on title prefix (e.g., "SAT Math", "SAT Reading", "PSAT Prep")
  return (data || []).map((video: any) => ({
    ...video,
    subject: video.title.split(':')[0] || 'General', // Extract subject from title
  }));
}

// Function to group videos by subject
function groupVideosBySubject(videos: VideoLesson[]): Record<string, VideoLesson[]> {
  return videos.reduce((acc, video) => {
    const subject = video.subject || 'General';
    if (!acc[subject]) {
      acc[subject] = [];
    }
    acc[subject].push(video);
    return acc;
  }, {} as Record<string, VideoLesson[]>);
}

export default async function VideoListPage() {
  const videos = await getAllVideos();
  const groupedVideos = groupVideosBySubject(videos);

  return (
    <DashboardLayout>
      <div className="py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
          <h1 className="text-2xl font-semibold text-gray-900 dark:text-white mb-2">
            SAT/PSAT Video Library (Mock Data)
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mb-8">
            Browse our collection of SAT and PSAT preparation videos taught by expert instructors. (Using local mock data)
          </p>

          {Object.entries(groupedVideos).map(([subject, subjectVideos]) => (
            <div key={subject} className="mb-10">
              <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-200 mb-4 border-b border-gray-300 dark:border-gray-700 pb-2">
                {subject}
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {subjectVideos.map((video) => (
                  <div key={video.id} className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden transform transition duration-300 hover:scale-105">
                    <div className="relative h-40 w-full">
                      <Image
                        src={video.thumbnail}
                        alt={`Thumbnail for ${video.title}`}
                        layout="fill"
                        objectFit="cover"
                        unoptimized // If using external URLs like unsplash
                      />
                      <div className="absolute top-2 right-2 bg-black bg-opacity-60 text-white text-xs px-2 py-1 rounded">
                        {video.duration}
                      </div>
                    </div>
                    <div className="p-4">
                      <h3 className="text-md font-semibold text-gray-900 dark:text-white mb-1 truncate" title={video.title}>
                        {video.title}
                      </h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mb-2 line-clamp-2" title={video.description}>
                        {video.description}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-500">
                        Instructor: {video.instructor}
                      </p>
                      {/* Optional: Add progress bar or watched status */}
                      {/* <div className="mt-2 h-1 w-full bg-gray-200 dark:bg-gray-700 rounded">
                        <div
                          className="h-1 bg-blue-500 rounded"
                          style={{ width: `${video.progress}%` }}
                        ></div>
                      </div> */}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </DashboardLayout>
  );
}