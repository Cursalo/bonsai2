'use client'

import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { mockSupabase } from '@/app/lib/mock-supabase' // Adjust path if necessary
import { MasteryLevel, MASTERY_VISUAL_INDICATOR } from '@/app/types/mastery' // Adjust path if necessary

// Define the type for the skill data we expect
interface UserSkill {
  id: string;
  user_id: string;
  topic: string;
  mastery_level: MasteryLevel;
  last_updated: string;
  isPruned: boolean; // Added for pruning status
}

// Define the expected result structure from the mock query
type MockQueryResult<T> = { data: T | null; error: { message: string } | null };

// Define structure for concepts within tree data, now including mastery level
interface Concept {
    id: string;
    name: string; // This should match UserSkill.topic
    mastery_level?: MasteryLevel; // Added optional mastery level
    isPruned?: boolean; // Added for pruning status
}

// Define structure for branches
interface Branch {
    id: string;
    name: string;
    subject: string;
    growth: number;
    health: number;
    angle: number;
    concepts: Concept[];
}

// Define structure for the entire tree data
interface TreeData {
    trunk: { health: number; growth: number };
    branches: Branch[];
}

// Color mapping for different subjects
const subjectColors = {
  'SAT Math': '#4ade80', // green
  'SAT Reading': '#60a5fa', // blue
  'SAT Writing': '#c084fc', // purple
  'PSAT': '#f97316', // orange
}

// Base structure for the tree - concepts will be populated/updated from fetched data
// IMPORTANT: Concept names MUST match the 'topic' field in mockUserSkills for mapping
const baseTreeData: TreeData = {
  trunk: { health: 0.85, growth: 0.8 },
  branches: [
    // Branch 1: Math - Algebra/Quadratics
    {
      id: 'b1', name: 'Algebra & Equations', subject: 'SAT Math', growth: 0.9, health: 0.9, angle: -60,
      concepts: [ { id: 'c2', name: 'Quadratic Equations' } ] // Matches mockUserSkills topic
    },
    // Branch 2: Math - Geometry
    {
      id: 'b2', name: 'Geometry & Trig', subject: 'SAT Math', growth: 0.8, health: 0.85, angle: -30,
      concepts: [ { id: 'c4', name: 'Geometry and Trigonometry' } ] // Matches mockUserSkills topic
    },
    // Branch 3: Math - Data
    {
      id: 'b3', name: 'Data & Statistics', subject: 'SAT Math', growth: 0.7, health: 0.75, angle: 0,
      concepts: [ { id: 'c5', name: 'Data Analysis and Statistics' } ] // Matches mockUserSkills topic
    },
    // Branch 4: Reading - Comprehension
    {
      id: 'b4', name: 'Reading Skills', subject: 'SAT Reading', growth: 0.85, health: 0.8, angle: 30,
      concepts: [ { id: 'c8', name: 'Passage Analysis' } ] // Matches mockUserSkills topic
    },
     // Branch 5: Reading - Vocab (Placeholder - no matching skill in mock)
    {
      id: 'b5', name: 'Vocabulary', subject: 'SAT Reading', growth: 0.7, health: 0.75, angle: 60,
      concepts: [ { id: 'c9', name: 'Context Clues' } ] // No matching skill, will get default mastery
    },
    // Branch 6: Writing - Grammar
    {
      id: 'b6', name: 'Grammar & Writing', subject: 'SAT Writing', growth: 0.75, health: 0.7, angle: 90,
      concepts: [ { id: 'c11', name: 'Grammar and Punctuation' } ] // Matches mockUserSkills topic
    },
    // Branch 7: Writing - Essay (Placeholder)
    {
      id: 'b7', name: 'Essay Writing', subject: 'SAT Writing', growth: 0.65, health: 0.6, angle: 120,
      concepts: [ { id: 'c13', name: 'Thesis Development' } ] // No matching skill
    },
    // Branch 8: PSAT (Placeholder)
    {
      id: 'b8', name: 'PSAT Strategies', subject: 'PSAT', growth: 0.6, health: 0.55, angle: 150,
      concepts: [ { id: 'c15', name: 'Test Strategy' } ] // No matching skill
    },
  ],
};

// Define fill colors for different mastery levels
const masteryFillColors: Record<MasteryLevel | 'default', string> = {
  [MasteryLevel.NeedsPractice]: '#ef4444', // Red
  [MasteryLevel.Proficient]: '#f59e0b',    // Amber/Yellow
  [MasteryLevel.Mastered]: '#22c55e',      // Green
  'default': '#84cc16'                     // Default Green (Lime)
};

// Helper function to get the correct leaf fill color
const getLeafFillColor = (level: MasteryLevel | undefined): string => {
  return level ? masteryFillColors[level] : masteryFillColors['default'];
};
export default function BonsaiTreeVisualization() {
  const [processedTreeData, setProcessedTreeData] = useState<TreeData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTooltip, setActiveTooltip] = useState<string | null>(null);
  const [visibleBranches, setVisibleBranches] = useState<string[]>([]);
  const [visibleLeaves, setVisibleLeaves] = useState<string[]>([]);

  // SVG dimensions
  const svgWidth = 1020
  const svgHeight = 850
  const centerX = svgWidth / 2
  const centerY = svgHeight - 85
  const trunkHeight = 204
  const trunkWidth = 42.5

  // Fetch skill data and merge with base tree structure
  useEffect(() => {
    const fetchAndProcessData = async () => {
      setLoading(true);
      setError(null);
      setProcessedTreeData(null); // Clear previous data

      try {
        // Use the simplified mock structure call
        const result = await mockSupabase
          .from('user_skills')
          .select()
          .eq() as MockQueryResult<UserSkill[]>; // Assert type here

        const { data: skillsData, error: fetchError } = result;

        if (fetchError) {
          throw new Error(fetchError.message || 'Failed to fetch skills');
        }

        // Map topic to both mastery level and pruned status
        const skillDetailsMap = new Map<string, { mastery: MasteryLevel; pruned: boolean }>();
        if (skillsData) {
          skillsData.forEach(skill => {
            skillDetailsMap.set(skill.topic, {
                mastery: skill.mastery_level,
                pruned: skill.isPruned // Use the isPruned flag from data
            });
          });
        }

        // Create new tree data by merging mastery levels
        const newTreeData: TreeData = {
          ...baseTreeData,
          branches: baseTreeData.branches.map(branch => ({
            ...branch,
            concepts: branch.concepts.map(concept => ({
              ...concept,
              // Look up mastery level and pruned status
              mastery_level: skillDetailsMap.get(concept.name)?.mastery || MasteryLevel.NeedsPractice,
              isPruned: skillDetailsMap.get(concept.name)?.pruned || false
            }))
          }))
        };

        setProcessedTreeData(newTreeData);

      } catch (err: any) {
        setError(err.message || 'An unexpected error occurred');
      } finally {
        setLoading(false);
      }
    };

    fetchAndProcessData();
  }, []);


  // Effect for animating branches and leaves based on processedTreeData
  useEffect(() => {
    if (!processedTreeData) {
        setVisibleBranches([]);
        setVisibleLeaves([]);
        return;
    }

    // Start with no branches or leaves
    setVisibleBranches([]);
    setVisibleLeaves([]);

    // Add branches progressively
    const branchTimer = setTimeout(() => {
      const branches = processedTreeData.branches.map(branch => branch.id);
      setVisibleBranches(branches);
    }, 500); // Delay for trunk animation

    // Add leaves progressively (only if they have a mastery level)
    const leafTimer = setTimeout(() => {
      const leaves: string[] = [];
      processedTreeData.branches.forEach(branch => {
        branch.concepts.forEach(concept => {
          // Only show leaves for concepts that have mastery data
          if (concept.mastery_level) {
             leaves.push(concept.id);
          }
        });
      });
      setVisibleLeaves(leaves);
    }, 1500); // Delay after branches start appearing

    return () => {
      clearTimeout(branchTimer);
      clearTimeout(leafTimer);
    };
  }, [processedTreeData]); // Rerun when processedTreeData changes

  // Function to handle pruning a concept/leaf
  const handlePrune = (conceptId: string) => {
      if (!processedTreeData) return;

      // Create a deep copy to avoid state mutation issues
      const updatedTreeData = JSON.parse(JSON.stringify(processedTreeData)) as TreeData;

      let conceptFound = false;
      for (const branch of updatedTreeData.branches) {
          const conceptIndex = branch.concepts.findIndex(c => c.id === conceptId);
          if (conceptIndex !== -1) {
              const concept = branch.concepts[conceptIndex];
              // Only allow pruning if mastered and not already pruned
              if (concept.mastery_level === MasteryLevel.Mastered && !concept.isPruned) {
                  branch.concepts[conceptIndex].isPruned = true;
                  conceptFound = true;
                  break; // Exit inner loop once found and updated
              } else if (concept.isPruned) {
                  console.log(`Concept ${conceptId} (${concept.name}) is already pruned.`);
                  return; // Exit if already pruned
              } else {
                  console.log(`Concept ${conceptId} (${concept.name}) cannot be pruned (Mastery: ${concept.mastery_level}).`);
                  return; // Exit if not mastered
              }
          }
      }

      if (conceptFound) {
          setProcessedTreeData(updatedTreeData);
          console.log(`Pruned concept: ${conceptId}`);
          // Here you might eventually call an API to persist this change
      } else {
          console.warn(`Concept ${conceptId} not found for pruning.`);
      }
  };

  return (
    <div className="relative w-full h-full grid place-items-center overflow-hidden bg-gray-50 dark:bg-gray-900 rounded-lg shadow p-12">
      <svg
        width="100%"
        height="100%"
        viewBox={`335 450 350 400`} // Centered viewBox horizontally around drawing centerX=510
        className="block max-w-full max-h-full"
        style={{ overflow: 'visible', transform: 'scale(0.8)' }}
      >
        {/* Ground/Pot */}
        <motion.ellipse
          cx={centerX}
          cy={centerY + 10}
          rx={trunkWidth * 3}
          ry={trunkWidth / 2}
          fill="#8B4513"
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ duration: 0.5 }}
        />

        {/* Trunk */}
        <motion.path
          d={`
            M ${centerX - trunkWidth / 2} ${centerY}
            C ${centerX - trunkWidth} ${centerY - trunkHeight / 3} ${centerX - trunkWidth / 3} ${centerY - trunkHeight / 2} ${centerX - trunkWidth / 4} ${centerY - trunkHeight}
            L ${centerX + trunkWidth / 4} ${centerY - trunkHeight}
            C ${centerX + trunkWidth / 3} ${centerY - trunkHeight / 2} ${centerX + trunkWidth} ${centerY - trunkHeight / 3} ${centerX + trunkWidth / 2} ${centerY}
            Z
          `}
          fill="#8B4513"
          initial={{ pathLength: 0, opacity: 0 }}
          animate={{ pathLength: 1, opacity: 1 }}
          transition={{ duration: 1, ease: "easeOut" }}
        />

        {/* Loading/Error States */}
        {loading && <text x={centerX} y={centerY - trunkHeight - 50} textAnchor="middle" fill="currentColor" className="text-gray-500">Loading Bonsai...</text>}
        {error && <text x={centerX} y={centerY - trunkHeight - 50} textAnchor="middle" fill="currentColor" className="text-red-500">Error: {error}</text>}

        {/* Render tree only when data is processed */}
        {processedTreeData && (
          <>
            {/* Branches */}
            {processedTreeData.branches.map((branch, index) => {
              if (!visibleBranches.includes(branch.id)) return null;

              // Calculate branch parameters
              const branchLength = 102 + branch.growth * 102
              const startY = centerY - trunkHeight + 34
              const radians = (branch.angle * Math.PI) / 180
              const endX = centerX + Math.sin(radians) * branchLength
              const endY = startY - Math.cos(radians) * branchLength
              const controlX1 = centerX + Math.sin(radians) * branchLength * 0.3
              const controlY1 = startY - Math.cos(radians) * branchLength * 0.3
              const controlX2 = centerX + Math.sin(radians) * branchLength * 0.7
              const controlY2 = startY - Math.cos(radians) * branchLength * 0.7
              const branchColor = subjectColors[branch.subject as keyof typeof subjectColors] || '#6b7280'
              const branchWidth = 6.8 + branch.health * 5.1

              return (
                <g key={branch.id}>
                  {/* Branch */}
                  <motion.path
                    d={`M ${centerX} ${startY} C ${controlX1} ${controlY1}, ${controlX2} ${controlY2}, ${endX} ${endY}`}
                    stroke={branchColor}
                    strokeWidth={branchWidth}
                    fill="transparent"
                    strokeLinecap="round"
                    initial={{ pathLength: 0 }}
                    animate={{ pathLength: 1 }}
                    transition={{ duration: 1, delay: 0.8 + index * 0.1 }}
                    onMouseEnter={() => setActiveTooltip(branch.id)}
                    onMouseLeave={() => setActiveTooltip(null)}
                  />

                  {/* Leaves */}
                  {branch.concepts.map((concept, cIndex) => {
                    if (!visibleLeaves.includes(concept.id)) return null;

                    // Calculate position along the branch
                    const leafDistance = 0.6 + (cIndex * 0.2)
                    const t = leafDistance // Parameter along the curve (0 to 1)
                    const mt = 1 - t

                    // Position on the cubic Bezier curve
                    const leafX = mt*mt*mt*centerX + 3*mt*mt*t*controlX1 + 3*mt*t*t*controlX2 + t*t*t*endX
                    const leafY = mt*mt*mt*startY + 3*mt*mt*t*controlY1 + 3*mt*t*t*controlY2 + t*t*t*endY

                    // Add some randomness to leaf position
                    const offsetX = (Math.random() - 0.5) * 15
                    const offsetY = (Math.random() - 0.5) * 15

                    // Calculate leaf size based on mastery
                    const leafSize = 30; // Fixed leaf size

                    // Create a leaf shape
                    const leafPath = createLeafPath(leafX + offsetX, leafY + offsetY, leafSize, branch.angle + (cIndex % 2 ? 30 : -30))

                    return (
                      <motion.g
                        key={concept.id}
                        initial={{ opacity: 0, scale: 0 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.5, delay: 1.5 + index * 0.2 + cIndex * 0.1 }}
                        onMouseEnter={() => setActiveTooltip(concept.id)}
                        onMouseLeave={() => setActiveTooltip(null)}
                        // Add onClick handler for pruning
                        onClick={() => handlePrune(concept.id)}
                        // Add cursor pointer for mastered, non-pruned leaves
                        style={{ cursor: concept.mastery_level === MasteryLevel.Mastered && !concept.isPruned ? 'pointer' : 'default' }}
                      >
                        <motion.path
                          d={leafPath}
                          // Set fill color based on mastery level
                          fill={getLeafFillColor(concept.mastery_level)}
                          // Keep stroke related to the branch color
                          stroke={branchColor}
                          strokeWidth={1}
                          // Animate pruning effect (e.g., fade out slightly)
                          animate={{
                            opacity: concept.isPruned ? 0.5 : 0.9,
                            scale: concept.isPruned ? 0.9 : 1, // Slightly shrink when pruned
                          }}
                          transition={{ duration: 0.3 }}
                        />

                        {/* Tooltip for concept */}
                        {activeTooltip === concept.id && (
                          <foreignObject x={leafX + offsetX - 80} y={leafY + offsetY - 60} width={160} height={60}>
                            <div className="bg-white dark:bg-gray-800 p-2 rounded shadow-lg text-xs whitespace-nowrap">
                              <p className="font-bold">{concept.name}</p>
                              <p>Subject: {branch.subject}</p> {/* Corrected: Use branch.subject */}
                              <p>Mastery: {concept.mastery_level || 'N/A'} {concept.isPruned ? '(Pruned)' : ''}</p>
                            </div>
                          </foreignObject>
                        )}
                      </motion.g>
                    )
                  })}

                  {/* Tooltip for branch */}
                  {activeTooltip === branch.id && (
                    <foreignObject x={endX - 80} y={endY - 60} width={160} height={60}>
                      <div className="bg-white dark:bg-gray-800 p-2 rounded shadow-lg text-xs">
                        <p className="font-bold">{branch.name}</p>
                        <p>Subject: {branch.subject}</p>
                        <p>Mastery: {Math.round(branch.health * 100)}%</p> {/* Branch tooltip still uses health % */}
                      </div>
                    </foreignObject>
                  )}
                </g>
              )
            })}
          </>
        )}
      </svg>

      {/* Legend */}
      <div className="absolute bottom-2 right-2 bg-white dark:bg-gray-800 p-2 rounded shadow-sm text-xs">
        {Object.entries(subjectColors).map(([subject, color]) => (
          <div key={subject} className="flex items-center mt-1">
            <div className="w-3 h-3 rounded-full mr-1" style={{ backgroundColor: color }}></div>
            <span>{subject}</span>
          </div>
        ))}
         {/* Add Mastery Level Legend */}
         <div className="mt-2 pt-2 border-t border-gray-200 dark:border-gray-700">
            <p className="font-medium mb-1">Mastery:</p>
            {Object.entries(MASTERY_VISUAL_INDICATOR).map(([level, className]) => (
                 <div key={level} className="flex items-center mt-1">
                    {/* Example visual indicator - adjust as needed */}
                    <div className={`w-3 h-3 rounded-full mr-1 ${className}-legend-indicator`}></div>
                    <span>{level}</span>
                 </div>
            ))}
         </div>
      </div>
    </div>
  )
}

// Function to create a leaf path
function createLeafPath(x: number, y: number, size: number, angle: number) {
  // Convert angle to radians
  const rad = (angle * Math.PI) / 180

  // Calculate rotated control points for the leaf
  const rotate = (px: number, py: number) => {
    const rx = Math.cos(rad) * (px - x) - Math.sin(rad) * (py - y) + x
    const ry = Math.sin(rad) * (px - x) + Math.cos(rad) * (py - y) + y
    return { x: rx, y: ry }
  }

  // Leaf shape control points (unrotated)
  const tip = { x: x, y: y - size }
  const leftCtrl1 = { x: x - size * 0.5, y: y - size * 0.5 }
  const leftCtrl2 = { x: x - size * 0.8, y: y - size * 0.2 }
  const rightCtrl1 = { x: x + size * 0.5, y: y - size * 0.5 }
  const rightCtrl2 = { x: x + size * 0.8, y: y - size * 0.2 }

  // Rotate all points
  const rotTip = rotate(tip.x, tip.y)
  const rotLeftCtrl1 = rotate(leftCtrl1.x, leftCtrl1.y)
  const rotLeftCtrl2 = rotate(leftCtrl2.x, leftCtrl2.y)
  const rotRightCtrl1 = rotate(rightCtrl1.x, rightCtrl1.y)
  const rotRightCtrl2 = rotate(rightCtrl2.x, rightCtrl2.y)

  // Create the path
  return `
    M ${x} ${y}
    C ${rotLeftCtrl2.x} ${rotLeftCtrl2.y}, ${rotLeftCtrl1.x} ${rotLeftCtrl1.y}, ${rotTip.x} ${rotTip.y}
    C ${rotRightCtrl1.x} ${rotRightCtrl1.y}, ${rotRightCtrl2.x} ${rotRightCtrl2.y}, ${x} ${y}
    Z
  `
}