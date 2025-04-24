// app/types/mastery.ts
export enum MasteryLevel {
  NeedsPractice = 'Needs Practice',
  Proficient = 'Proficient',
  Mastered = 'Mastered',
}

export const MASTERY_LEVELS = Object.values(MasteryLevel);

// Optional: Define colors or other properties associated with each level
export const MASTERY_COLORS: Record<MasteryLevel, string> = {
  [MasteryLevel.NeedsPractice]: 'text-red-500', // Example color
  [MasteryLevel.Proficient]: 'text-yellow-500', // Example color
  [MasteryLevel.Mastered]: 'text-green-500', // Example color
};

export const MASTERY_VISUAL_INDICATOR: Record<MasteryLevel, string> = {
    [MasteryLevel.NeedsPractice]: 'filter-red', // Example class for visualization
    [MasteryLevel.Proficient]: 'filter-yellow', // Example class for visualization
    [MasteryLevel.Mastered]: 'filter-green', // Example class for visualization
};

// Add CSS filter definitions for visualization classes if needed
// This might go in globals.css or a relevant CSS module
/*
.filter-red { filter: sepia(100%) hue-rotate(-50deg) saturate(600%) brightness(0.9); }
.filter-yellow { filter: sepia(100%) hue-rotate(10deg) saturate(600%) brightness(1.1); }
.filter-green { filter: sepia(100%) hue-rotate(60deg) saturate(400%) brightness(0.9); }
*/

// Define the structure for skill mastery data
export interface SkillMastery {
  id: string;
  user_id: string;
  topic: string; // Renamed from skillName for consistency with mock data
  masteryLevel: MasteryLevel; // Renamed from mastery_level
  last_updated: string;
  isPruned: boolean;
}