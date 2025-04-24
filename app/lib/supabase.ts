import { createClient } from '@supabase/supabase-js'
import { mockSupabase } from './mock-supabase'

// Always use mock Supabase client for now
console.log('Using mock Supabase client for development');
export const supabase = mockSupabase;

export type Database = {
  public: {
    Tables: {
      users: {
        Row: {
          id: string
          email: string
          name: string
          created_at: string
          last_login: string
          preferred_language: string
          profile_image: string | null
        }
        Insert: {
          id?: string
          email: string
          name: string
          created_at?: string
          last_login?: string
          preferred_language?: string
          profile_image?: string | null
        }
        Update: {
          id?: string
          email?: string
          name?: string
          created_at?: string
          last_login?: string
          preferred_language?: string
          profile_image?: string | null
        }
      }
      subscriptions: {
        Row: {
          id: string
          user_id: string
          plan_id: string
          status: string
          video_credits_remaining: number
          started_at: string
          expires_at: string
          stripe_customer_id: string
          stripe_subscription_id: string
        }
        Insert: {
          id?: string
          user_id: string
          plan_id: string
          status: string
          video_credits_remaining: number
          started_at: string
          expires_at: string
          stripe_customer_id: string
          stripe_subscription_id: string
        }
        Update: {
          id?: string
          user_id?: string
          plan_id?: string
          status?: string
          video_credits_remaining?: number
          started_at?: string
          expires_at?: string
          stripe_customer_id?: string
          stripe_subscription_id?: string
        }
      }
      homework_submissions: {
        Row: {
          id: string
          user_id: string
          title: string
          description: string
          exam_type: string
          subject: string
          content: any
          attachments: string[]
          submitted_at: string
          status: string
        }
        Insert: {
          id?: string
          user_id: string
          title: string
          description: string
          exam_type: string
          subject: string
          content: any
          attachments?: string[]
          submitted_at?: string
          status?: string
        }
        Update: {
          id?: string
          user_id?: string
          title?: string
          description?: string
          exam_type?: string
          subject?: string
          content?: any
          attachments?: string[]
          submitted_at?: string
          status?: string
        }
      }
      ai_analyses: {
        Row: {
          id: string
          submission_id: string
          feedback: any
          mistakes: any[]
          concepts_to_improve: string[]
          analyzed_at: string
        }
        Insert: {
          id?: string
          submission_id: string
          feedback: any
          mistakes: any[]
          concepts_to_improve: string[]
          analyzed_at?: string
        }
        Update: {
          id?: string
          submission_id?: string
          feedback?: any
          mistakes?: any[]
          concepts_to_improve?: string[]
          analyzed_at?: string
        }
      }
      video_lessons: {
        Row: {
          id: string
          user_id: string
          submission_id: string
          analysis_id: string
          title: string
          description: string
          url: string
          thumbnail: string
          duration: number
          created_at: string
          watched: boolean
          watched_at: string | null
        }
        Insert: {
          id?: string
          user_id: string
          submission_id: string
          analysis_id: string
          title: string
          description: string
          url: string
          thumbnail: string
          duration: number
          created_at?: string
          watched?: boolean
          watched_at?: string | null
        }
        Update: {
          id?: string
          user_id?: string
          submission_id?: string
          analysis_id?: string
          title?: string
          description?: string
          url?: string
          thumbnail?: string
          duration?: number
          created_at?: string
          watched?: boolean
          watched_at?: string | null
        }
      }
      progress_metrics: {
        Row: {
          id: string
          user_id: string
          exam_type: string
          subject: string
          concept: string
          mastery_level: number
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          exam_type: string
          subject: string
          concept: string
          mastery_level: number
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          exam_type?: string
          subject?: string
          concept?: string
          mastery_level?: number
          updated_at?: string
        }
      }
      bonsai_tree_states: {
        Row: {
          id: string
          user_id: string
          tree_data: any
          last_updated: string
        }
        Insert: {
          id?: string
          user_id: string
          tree_data: any
          last_updated?: string
        }
        Update: {
          id?: string
          user_id?: string
          tree_data?: any
          last_updated?: string
        }
      }
    }
  }
} 