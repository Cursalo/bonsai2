/**
 * Mock Supabase client for development
 * This provides fake data and responses when the real Supabase client is not available
 */

import { MasteryLevel } from '../types/mastery';

// Mock user data
const mockUser = {
  id: 'mock-user-id',
  email: 'user@example.com',
  user_metadata: {
    full_name: 'Demo User',
  },
  created_at: new Date().toISOString(),
};

// Mock subscription data
const mockSubscription = {
  id: 'mock-subscription-id',
  user_id: mockUser.id,
  plan_id: 'monthly',
  status: 'active',
  video_credits_remaining: 42,
  started_at: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString(), // 15 days ago
  expires_at: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString(), // 15 days from now
};

// Mock homework data
const mockHomework = [
  {
    id: 'hw-1',
    user_id: mockUser.id,
    title: 'SAT Math: Quadratic Equations',
    description: 'Complete problems 1-10 on quadratic equations from the SAT practice test',
    status: 'completed',
    feedback: 'Great work! You have mastered the quadratic formula. This will help you on the SAT Math section.',
    submitted_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
    grade: 'A',
  },
  {
    id: 'hw-2',
    user_id: mockUser.id,
    title: 'SAT Reading: Passage Analysis',
    description: 'Read the historical passage and answer the evidence-based questions',
    status: 'pending',
    submitted_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'hw-3',
    user_id: mockUser.id,
    title: 'PSAT Writing: Grammar and Punctuation',
    description: 'Complete the grammar and punctuation exercises to prepare for the PSAT Writing section',
    status: 'assigned',
    due_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
  },
];

// Mock video lessons data
const mockVideoLessons = [
  {
    id: 'video-1',
    title: 'SAT Math: Mastering Quadratic Equations',
    description: 'Learn how to solve any quadratic equation on the SAT Math section with confidence.',
    duration: '12:34',
    thumbnail: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?ixlib=rb-1.2.1&auto=format&fit=crop&w=300&q=80',
    url: 'https://example.com/videos/sat-algebra',
    watched: true,
    progress: 100,
    instructor: 'Dr. Sarah Chen',
    created_at: '2023-06-15T10:30:00Z',
  },
  {
    id: 'video-2',
    title: 'SAT Reading: Evidence-Based Questions',
    description: 'Master the technique for answering evidence-based questions in the SAT Reading section.',
    duration: '15:21',
    thumbnail: 'https://images.unsplash.com/photo-1544717305-2782549b5136?ixlib=rb-1.2.1&auto=format&fit=crop&w=300&q=80',
    url: 'https://example.com/videos/sat-reading',
    watched: false,
    progress: 45,
    instructor: 'Prof. Michael Johnson',
    created_at: '2023-06-14T14:45:00Z',
  },
  {
    id: 'video-3',
    title: 'SAT Writing: Grammar Rules You Must Know',
    description: 'Essential grammar rules that appear frequently on the SAT Writing section.',
    duration: '08:45',
    thumbnail: 'https://images.unsplash.com/photo-1580894732444-8ecded7900cd?ixlib=rb-1.2.1&auto=format&fit=crop&w=300&q=80',
    url: 'https://example.com/videos/sat-writing',
    watched: false,
    progress: 0,
    instructor: 'Ms. Emily Rodriguez',
    created_at: '2023-06-13T09:15:00Z',
  },
  {
    id: 'video-4',
    title: 'PSAT Prep: Math Problem Solving Strategies',
    description: 'Effective strategies for tackling math problems on the PSAT.',
    duration: '14:22',
    thumbnail: 'https://images.unsplash.com/photo-1601935111741-ae98b2b230b0?ixlib=rb-1.2.1&auto=format&fit=crop&w=300&q=80',
    url: 'https://example.com/videos/psat-math',
    watched: false,
    progress: 0,
    instructor: 'Dr. James Wilson',
    created_at: '2023-06-12T11:30:00Z',
  },
  {
    id: 'video-5',
    title: 'SAT Math: Geometry and Trigonometry',
    description: 'Comprehensive review of geometry and trigonometry concepts tested on the SAT.',
    duration: '17:45',
    thumbnail: 'https://images.unsplash.com/photo-1551836022-d5d88e9218df?ixlib=rb-1.2.1&auto=format&fit=crop&w=300&q=80',
    url: 'https://example.com/videos/sat-geometry',
    watched: false,
    progress: 0,
    instructor: 'Prof. David Kim',
    created_at: '2023-06-10T15:20:00Z',
  },
  {
    id: 'video-6',
    title: 'SAT Reading: Analyzing Complex Passages',
    description: 'Techniques for understanding and analyzing complex reading passages on the SAT.',
    duration: '19:18',
    thumbnail: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?ixlib=rb-1.2.1&auto=format&fit=crop&w=300&q=80',
    url: 'https://example.com/videos/sat-reading-complex',
    watched: false,
    progress: 0,
    instructor: 'Dr. Lisa Thompson',
    created_at: '2023-06-08T13:45:00Z',
  },
  {
    id: 'video-7',
    title: 'PSAT Writing: Sentence Structure',
    description: 'Learn how to identify and correct sentence structure issues on the PSAT Writing section.',
    duration: '11:52',
    thumbnail: 'https://images.unsplash.com/photo-1560250097-0b93528c311a?ixlib=rb-1.2.1&auto=format&fit=crop&w=300&q=80',
    url: 'https://example.com/videos/psat-writing',
    watched: false,
    progress: 0,
    instructor: 'Prof. Robert Garcia',
    created_at: '2023-06-06T09:30:00Z',
  },
  {
    id: 'video-8',
    title: 'SAT Math: Data Analysis and Statistics',
    description: 'Master data analysis and statistics problems that appear on the SAT Math section.',
    duration: '13:27',
    thumbnail: 'https://images.unsplash.com/photo-1629425733761-caae3b5f2e50?ixlib=rb-1.2.1&auto=format&fit=crop&w=300&q=80',
    url: 'https://example.com/videos/sat-statistics',
    watched: false,
    progress: 0,
    instructor: 'Dr. Olivia Martinez',
    created_at: '2023-06-04T16:15:00Z',
  },
  {
    id: 'video-9',
    title: 'SAT Reading: Vocabulary in Context',
    description: 'Strategies for determining the meaning of vocabulary words in context on the SAT.',
    duration: '10:39',
    thumbnail: 'https://images.unsplash.com/photo-1568602471122-7832951cc4c5?ixlib=rb-1.2.1&auto=format&fit=crop&w=300&q=80',
    url: 'https://example.com/videos/sat-vocabulary',
    watched: false,
    progress: 0,
    instructor: 'Prof. Thomas Lee',
    created_at: '2023-06-02T11:20:00Z',
  },
  {
    id: 'video-10',
    title: 'PSAT Overview: Test Structure and Strategy',
    description: 'A comprehensive overview of the PSAT structure and general test-taking strategies.',
    duration: '16:05',
    thumbnail: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?ixlib=rb-1.2.1&auto=format&fit=crop&w=300&q=80',
    url: 'https://example.com/videos/psat-overview',
    watched: false,
    progress: 0,
    instructor: 'Ms. Jennifer Adams',
    created_at: '2023-05-30T14:10:00Z',
  },
  {
    id: 'video-11',
    title: 'PSAT Prep: Reading Comprehension Techniques',
    description: 'Essential techniques to improve your reading comprehension skills for the PSAT.',
    duration: '14:38',
    thumbnail: 'https://images.unsplash.com/photo-1517486808906-6ca8b3f8e1c1?ixlib=rb-1.2.1&auto=format&fit=crop&w=300&q=80',
    url: 'https://example.com/videos/psat-reading-comprehension',
    watched: false,
    progress: 0,
    instructor: 'Dr. Amanda Parker',
    created_at: '2023-05-28T10:15:00Z',
  },
  {
    id: 'video-12',
    title: 'PSAT Overview: Scoring and National Merit Scholarship',
    description: 'Learn how PSAT scoring works and what it takes to qualify for the National Merit Scholarship.',
    duration: '18:22',
    thumbnail: 'https://images.unsplash.com/photo-1543269865-cbf427effbad?ixlib=rb-1.2.1&auto=format&fit=crop&w=300&q=80',
    url: 'https://example.com/videos/psat-scoring',
    watched: false,
    progress: 0,
    instructor: 'Prof. Daniel Wright',
    created_at: '2023-05-25T13:45:00Z',
  },
];

// Mock user skills/topics data
const mockUserSkills = [
  {
    id: 'skill-1',
    user_id: mockUser.id,
    topic: 'Quadratic Equations',
    mastery_level: MasteryLevel.Mastered,
    last_updated: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
    isPruned: false,
  },
  {
    id: 'skill-2',
    user_id: mockUser.id,
    topic: 'Passage Analysis',
    mastery_level: MasteryLevel.Proficient,
    last_updated: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
    isPruned: false,
  },
  {
    id: 'skill-3',
    user_id: mockUser.id,
    topic: 'Grammar and Punctuation',
    mastery_level: MasteryLevel.NeedsPractice,
    last_updated: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
    isPruned: false,
  },
    {
    id: 'skill-4',
    user_id: mockUser.id,
    topic: 'Geometry and Trigonometry',
    mastery_level: MasteryLevel.Proficient,
    last_updated: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
    isPruned: false,
  },
  {
    id: 'skill-5',
    user_id: mockUser.id,
    topic: 'Data Analysis and Statistics',
    mastery_level: MasteryLevel.NeedsPractice,
    last_updated: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    isPruned: false,
  },
];

// Define a standard error type for the mock client
interface MockError {
  message: string;
  code?: string;
}

// Create a mock Supabase client
export const mockSupabase = {
  auth: {
    getUser: async () => {
      return { data: { user: mockUser }, error: null as MockError | null }
    },
    signOut: async () => {
      return { error: null as MockError | null }
    },
    signInWithPassword: async (credentials: { email: string; password: string }) => {
      // Simple mock implementation - always succeeds for demo user
      if (credentials.email === "user@example.com" && credentials.password === "password") {
        return { data: { user: mockUser }, error: null as MockError | null };
      } else {
        return { data: null, error: { message: "Invalid login credentials" } as MockError };
      }
    },
    signUp: async (credentials: { email: string; password: string; options?: any }) => {
      // Mock implementation that always succeeds
      return { data: { user: { ...mockUser, email: credentials.email } }, error: null as MockError | null };
    }
  },
  
  storage: {
    from: (bucket: string) => {
      return {
        upload: async (path: string, file: File) => {
          console.log(`Mock storage: Uploading ${file.name} to ${bucket}/${path}`);
          return { data: { path }, error: null as MockError | null };
        },
        getPublicUrl: (path: string) => {
          const publicUrl = `https://example.com/storage/${bucket}/${path}`;
          return { data: { publicUrl } };
        }
      };
    }
  },

  from: (table: string) => {
    if (table === 'subscriptions') {
      return {
        select: () => {
          // Direct return for simple implementation
          return { data: mockSubscription, error: null as MockError | null };
        },
        insert: async (data: any) => ({ data: null, error: null as MockError | null }),
        update: async (data: any) => {
          // Update the mock subscription data
          if (data.video_credits_remaining) {
            mockSubscription.video_credits_remaining = data.video_credits_remaining;
          }
          return { data: mockSubscription, error: null as MockError | null };
        }
      };
    }

    if (table === 'homework_submissions') {
      return {
        select: () => ({
          eq: () => ({
            order: () => ({
              limit: async () => ({ data: mockHomework, error: null as MockError | null })
            })
          })
        }),
        insert: async (data: any) => ({ data: null, error: null as MockError | null }),
        update: async (data: any) => ({ data: null, error: null as MockError | null })
      };
    }

    if (table === 'video_lessons') {
      // Provide the structure used by components (assuming eq/order/limit)
      return {
        select: () => ({
          eq: () => ({
            order: () => ({
              limit: async () => ({ data: mockVideoLessons, error: null as MockError | null })
            })
          }),
          // Include 'then' if specifically used elsewhere for this table
          // then: async () => ({ data: mockVideoLessons, error: null })
        }),
        insert: async (data: any) => ({ data: null, error: null as MockError | null }),
        update: async (data: any) => ({ data: null, error: null as MockError | null })
      };
    }

    if (table === 'user_skills') {
      // This is the structure needed by SkillBreakdown.tsx
      return {
        select: () => ({
          eq: async () => ({ data: mockUserSkills, error: null as MockError | null })
        }),
        insert: async (data: any) => ({ data: null, error: null as MockError | null }),
        update: async (data: any) => ({ data: null, error: null as MockError | null })
      };
    }

    if (table === 'videos') {
       // Provide the structure used by components (assuming 'then')
       return {
         select: () => ({
            // Add a default eq if needed, otherwise just then
            eq: async () => ({ data: null, error: { message: 'videos.eq not implemented in mock' } as MockError }), // Default eq
            then: async () => ({ data: mockVideoLessons, error: null as MockError | null })
         }),
         insert: async (data: any) => ({ data: null, error: null as MockError | null }),
         update: async (data: any) => ({ data: null, error: null as MockError | null })
       };
    }

    // Fallback for any other table
    console.warn(`MockSupabase: Unhandled table "${table}"`);
    return {
      select: () => ({
        eq: async () => ({ data: null, error: { message: `Table ${table} not handled in mock` } as MockError }),
        // Add other default methods if necessary based on potential usage
        single: async () => ({ data: null, error: { message: `Table ${table} not handled in mock` } as MockError }),
        order: () => ({ limit: async () => ({ data: [], error: { message: `Table ${table} not handled in mock` } as MockError }) }),
        limit: async () => ({ data: [], error: { message: `Table ${table} not handled in mock` } as MockError }),
        then: async () => ({ data: null, error: { message: `Table ${table} not handled in mock` } as MockError })
      }),
      insert: async (data: any) => {
        if (table === 'users') {
          return { data: data, error: null as MockError | null };
        }
        return { data: null, error: { message: `Unable to insert into ${table} table in mock` } as MockError };
      },
      update: async (data: any) => ({ data: null, error: { message: `Unable to update ${table} table in mock` } as MockError })
    };
  },
  rpc: (func: string, params: any) => {
    // Mock RPC functions
    if (func === 'increment_credits') {
      return mockSubscription.video_credits_remaining + (params?.credit_amount || 0);
    }
    return null;
  },
};

export default mockSupabase; 