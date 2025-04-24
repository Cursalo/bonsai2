// app/video/[id]/page.tsx
import React from 'react';
import { notFound } from 'next/navigation';
import { mockSupabase } from '@/app/lib/mock-supabase'; // Corrected import path

interface VideoDetailPageProps {
  params: {
    id: string;
  };
}

// Define the structure of a video lesson based on the actual mock data
interface VideoLesson {
  id: string;
  title: string;
  description: string;
  url?: string; // Field name in mock data
  video_url?: string; // Keep for potential use, map from url if needed
  duration?: string; // Duration is a string in mock data (e.g., "12:34")
  instructor?: string;
  created_at: string;
  thumbnail?: string; // Added based on mock data
  watched?: boolean; // Added based on mock data
  progress?: number; // Added based on mock data
}

// Async function to fetch video details using mockSupabase
async function getVideoDetails(id: string): Promise<VideoLesson | null> {

// Define an interface for the specific mock structure for video_lessons
interface MockVideoLessonsQueryBuilder {
  select: () => {
    eq: () => {
      order: () => {
        limit: () => Promise<{ data: VideoLesson[] | null; error: { message: string } | null }>;
      };
    };
    // Add other methods like 'then' if they exist in the mock for this table
  };
}

  try {
    // Fetch the entire list of mock videos (as per mock-supabase.ts structure)
    // Note: The arguments to eq, order, limit are ignored by the mock
    // Cast the result of from() to the specific type
    const videoLessonsBuilder = mockSupabase.from('video_lessons') as MockVideoLessonsQueryBuilder;

    // Build the query using the correctly typed builder
    const query = videoLessonsBuilder
      .select() // Mock doesn't take args here
      .eq()     // Mock takes no args here
      .order()  // Mock takes no args here
      .limit(); // Mock takes no args here, returns the promise

    const { data: allVideos, error } = await query; // Await the promise separately

    if (error) {
      console.error('Error fetching video list from mockSupabase:', error.message);
      return null; // Treat any fetch error as not found for simplicity
    }

    if (!allVideos) {
        console.error('No video data returned from mockSupabase');
        return null;
    }

    // Manually find the video by ID in the returned array
    // Ensure allVideos is treated as an array of VideoLesson
    const video = (allVideos as VideoLesson[]).find(v => v.id === id);

    // Map the 'url' from mock data to 'video_url' if needed for the component
    if (video && video.url && !video.video_url) {
      video.video_url = video.url;
    }

    // Return the found video or null if not found
    return video || null;

  } catch (err) {
    // Catch any other unexpected errors during the fetch process
    console.error('Unexpected error in getVideoDetails:', err);
    return null; // Trigger notFound() page on unexpected errors as well
  }
}

// The Page component (Server Component)
const VideoDetailPage: React.FC<VideoDetailPageProps> = async ({ params }) => {
  const videoId = params.id;

  // Fetch the video details using the ID from the route parameters
  const video = await getVideoDetails(videoId);

  // If the video is not found (getVideoDetails returned null), trigger the not-found page
  if (!video) {
    notFound();
  }

  // If video data is available, render the details
  return (
    <div className="container mx-auto px-4 py-8">
      {/* Video Title */}
      <h1 className="text-3xl font-bold mb-4 text-gray-900 dark:text-white">{video.title}</h1>

      {/* Video Description */}
      <p className="text-lg text-gray-700 dark:text-gray-300 mb-6">{video.description}</p>

      {/* Video Player Section */}
      <div className="aspect-w-16 aspect-h-9 mb-6 bg-black rounded-lg overflow-hidden shadow-lg">
        {video.video_url || video.url ? ( // Check both possible fields
          // If a video URL exists, use an iframe as a basic player
          <iframe
            src={video.video_url || video.url} // Use whichever is available
            title={video.title}
            frameBorder="0"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            className="w-full h-full"
          ></iframe>
        ) : (
          // Placeholder if no video URL is provided in mock data
          <div className="w-full h-full flex items-center justify-center bg-gray-200 dark:bg-gray-700">
            <p className="text-gray-500 dark:text-gray-400">Video player not available</p>
          </div>
        )}
      </div>

      {/* Additional Video Details */}
      <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
        <h2 className="text-xl font-semibold mb-3 text-gray-800 dark:text-gray-200">Details</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-600 dark:text-gray-400">
          <div>
            <strong>Instructor:</strong> {video.instructor || 'N/A'}
          </div>
          <div>
            <strong>Duration:</strong> {video.duration || 'N/A'} {/* Display the string duration directly */}
          </div>
          <div>
            <strong>Uploaded:</strong> {new Date(video.created_at).toLocaleDateString()}
          </div>
          {/* Add more relevant details here if available in mock data */}
        </div>
      </div>
    </div>
  );
};

export default VideoDetailPage;