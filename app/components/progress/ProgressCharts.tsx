'use client'

import { useState, useEffect } from 'react'
import { mockSupabase } from '@/app/lib/mock-supabase' // Adjust path if necessary
import { MasteryLevel, MASTERY_LEVELS, MASTERY_COLORS } from '@/app/types/mastery' // Adjust path if necessary

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

// Type for storing mastery counts
type MasteryCounts = {
  [key in MasteryLevel]?: number;
};

export default function ProgressCharts() {
  const [masteryData, setMasteryData] = useState<MasteryCounts>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [totalSkills, setTotalSkills] = useState(0);

  useEffect(() => {
    const fetchAndProcessSkills = async () => {
      setLoading(true);
      setError(null);
      try {
        const result = await mockSupabase
          .from('user_skills')
          .select()
          .eq() as MockQueryResult<UserSkill[]>;

        const { data, error: fetchError } = result;

        if (fetchError) {
          throw new Error(fetchError.message || 'Failed to fetch skills');
        }

        if (data && Array.isArray(data)) {
          const counts: MasteryCounts = {};
          MASTERY_LEVELS.forEach(level => counts[level] = 0); // Initialize counts

          data.forEach(skill => {
            if (counts[skill.mastery_level] !== undefined) {
              counts[skill.mastery_level]!++;
            }
          });
          setMasteryData(counts);
          setTotalSkills(data.length);
        } else {
          setMasteryData({});
          setTotalSkills(0);
        }

      } catch (err: any) {
        setError(err.message || 'An unexpected error occurred');
        setMasteryData({});
        setTotalSkills(0);
      } finally {
        setLoading(false);
      }
    };

    fetchAndProcessSkills();
  }, []);

  // Chart dimensions (can be adjusted)
  const chartHeight = 150;
  
  return (
    <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-lg font-medium text-gray-900 dark:text-white">Skill Mastery Distribution</h2>
        {/* Removed tabs */}
      </div>

      {loading && <div className="text-center py-8 text-gray-500 dark:text-gray-400">Loading mastery data...</div>}
      {error && <div className="text-center py-8 text-red-500 dark:text-red-400">Error: {error}</div>}

      {!loading && !error && totalSkills > 0 && (
        <div className="mt-4 space-y-3">
          {MASTERY_LEVELS.map(level => {
            const count = masteryData[level] || 0;
            const percentage = totalSkills > 0 ? (count / totalSkills) * 100 : 0;
            const colorClass = MASTERY_COLORS[level]?.replace('text-', 'bg-') || 'bg-gray-500'; // Convert text color to bg color

            return (
              <div key={level}>
                <div className="flex justify-between mb-1 text-sm">
                  <span className={`font-medium ${MASTERY_COLORS[level] || 'text-gray-500'}`}>{level}</span>
                  <span className="text-gray-600 dark:text-gray-400">{count} Skill{count !== 1 ? 's' : ''}</span>
                </div>
                <div className="w-full bg-gray-200 dark:bg-gray-600 rounded-full h-2.5">
                  <div
                    className={`${colorClass} h-2.5 rounded-full`}
                    style={{ width: `${percentage}%` }}
                  ></div>
                </div>
              </div>
            );
          })}
        </div>
      )}

       {!loading && !error && totalSkills === 0 && (
         <div className="text-center py-8 text-gray-500 dark:text-gray-400">
           No skill mastery data available.
         </div>
       )}
      
      {/* Removed old chart rendering logic */}
      
      {/* Optional: Add a summary text if needed */}
      {/*
      <div className="mt-4 text-center text-xs text-gray-500 dark:text-gray-400">
        Distribution of your {totalSkills} tracked skills.
      </div>
      */}
    </div>
  )
} 