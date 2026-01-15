
export interface Word {
  id: string;
  english: string;
  chinese: string;
  pos: string; // Part of speech: adj, n, v, etc.
  example: string;
  exampleChinese?: string; // Optional field for the Chinese translation of the example sentence
  phonetic?: string;
}

export interface User {
  userId: string;
  unlockedLevels: string[]; 
  stars: Record<string, number>; 
  mistakes: Array<{ wordId: string; type: string; timestamp: number }>;
  lastStudyTime: number;
}

export interface Level {
  id: string;
  worldId: number;
  stageNum: number;
  words: Word[];
}

export enum GameStageType {
  RECOGNITION = 'RECOGNITION', 
  CONSOLIDATION = 'CONSOLIDATION', 
  APPLICATION = 'APPLICATION' 
}

export interface LeaderboardEntry {
  userId: string;
  totalStars: number;
  lastStudyTime: number;
}

export interface Hero {
  id: string;
  name: string;
  type: string;
  color: string;
  gender: 'M' | 'F' | 'N';
  description: string;
}
