'use client'

import { useState, useEffect } from 'react'
import { mockSupabase } from '@/app/lib/mock-supabase' // Adjust path if necessary
import { MasteryLevel, MASTERY_COLORS } from '@/app/types/mastery' // Adjust path if necessary

// Define the type for the skill data we expect
interface UserSkill {
  id: string;
  user_id: string;
  topic: string;
  mastery_level: MasteryLevel;
  last_updated: string;
}

// Define the expected result structure from the mock query
type MockQueryResult<T> = { data: T | null; error: { message: string } | null };

export default function SkillBreakdown() {
  const [skills, setSkills] = useState<UserSkill[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchSkills = async () => {
      setLoading(true)
      setError(null)
      try {
        // Adjusting call to match the specific structure in mockSupabase.ts for 'user_skills'
        // Call the simplified mock structure: from -> select -> eq
        // Assert the result type since inference is still struggling
        const result = await mockSupabase
          .from('user_skills')
          .select()
          .eq() as MockQueryResult<UserSkill[]>; // Assert the type here

        const { data, error: fetchError } = result; // Destructure after assertion

        if (fetchError) {
          throw new Error(fetchError.message || 'Failed to fetch skills')
        }
        
        // Ensure data is not null and is an array before setting state
        if (data && Array.isArray(data)) {
           // Explicitly cast data to UserSkill[] if needed, or ensure mock returns correct type
           setSkills(data as UserSkill[]);
        } else {
           setSkills([]); // Set to empty array if data is null or not an array
        }

      } catch (err: any) {
        setError(err.message || 'An unexpected error occurred')
        setSkills([]) // Clear skills on error
      } finally {
        setLoading(false)
      }
    }

    fetchSkills()
  }, [])
  
  return (
    <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
      <h2 className="text-lg font-medium text-gray-900 dark:text-white mb-6">Skill Breakdown</h2>
      
      {loading && <div className="text-center py-8 text-gray-500 dark:text-gray-400">Loading skills...</div>}
      {error && <div className="text-center py-8 text-red-500 dark:text-red-400">Error: {error}</div>}
      
      {!loading && !error && (
        <div className="space-y-4">
          {skills.map(skill => (
            <div key={skill.id} className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg flex justify-between items-center">
              <span className="text-sm font-medium text-gray-900 dark:text-white">{skill.topic}</span>
              <span className={`text-sm font-semibold ${MASTERY_COLORS[skill.mastery_level] || 'text-gray-500'}`}>
                {skill.mastery_level}
              </span>
            </div>
          ))}
        </div>
      )}
      
      {!loading && !error && skills.length === 0 && (
        <div className="text-center py-8 text-gray-500 dark:text-gray-400">
          No skills data available.
        </div>
      )}
    </div>
  )
} 