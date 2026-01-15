
import { User, LeaderboardEntry } from '../types';

/**
 * In a real-world scenario, this service would communicate with a real backend API.
 * For this demo, we simulate persistence using a structured approach that mimics an API.
 */
const STORAGE_KEY = 'PIXEL_WORD_APP_DATA';

export const storageService = {
  async getUser(userId: string): Promise<User | null> {
    const data = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
    return data[userId] || null;
  },

  async saveUser(user: User): Promise<void> {
    const data = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
    data[user.userId] = user;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  },

  async getLeaderboard(): Promise<LeaderboardEntry[]> {
    const data = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
    // Fix: Use generic reduce<number> to ensure totalStars is correctly inferred as a number and not unknown.
    const entries: LeaderboardEntry[] = Object.values(data).map((u: any) => ({
      userId: String(u.userId || ''),
      totalStars: Object.values(u.stars || {}).reduce<number>((a: number, b: any) => a + (Number(b) || 0), 0),
      lastStudyTime: Number(u.lastStudyTime) || 0
    }));

    return entries.sort((a, b) => (b.totalStars - a.totalStars) || (b.lastStudyTime - a.lastStudyTime));
  }
};
