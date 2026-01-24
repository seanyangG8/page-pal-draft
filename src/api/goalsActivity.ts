import { supabase, requireUserId } from './client';
import { DbReadingGoal, DbActivityDate } from './types';

export interface ReadingGoals {
  yearlyBookTarget: number;
  year: number;
}

export async function fetchReadingGoals(): Promise<ReadingGoals> {
  const year = new Date().getFullYear();
  const userId = await requireUserId();
  const { data, error } = await supabase
    .from('reading_goals')
    .select('*')
    .eq('user_id', userId)
    .eq('year', year)
    .single();
  if (error) {
    return { yearlyBookTarget: 12, year };
  }
  const row = data as DbReadingGoal;
  return { yearlyBookTarget: row.yearly_book_target, year: row.year };
}

export async function updateReadingGoals(target: number): Promise<ReadingGoals> {
  const year = new Date().getFullYear();
  const userId = await requireUserId();
  const { data, error } = await supabase
    .from('reading_goals')
    .upsert(
      { user_id: userId, year, yearly_book_target: target },
      { onConflict: 'user_id,year' }
    )
    .select('*')
    .single();
  if (error) throw error;
  const row = data as DbReadingGoal;
  return { yearlyBookTarget: row.yearly_book_target, year: row.year };
}

export async function fetchActivityDates(): Promise<string[]> {
  const userId = await requireUserId();
  const { data, error } = await supabase
    .from('activity_dates')
    .select('*')
    .eq('user_id', userId);
  if (error) throw error;
  return (data as DbActivityDate[]).map((d) => d.activity_date);
}

export function calculateStreakFromDates(dates: string[]): { current: number; longest: number } {
  const sorted = [...dates].sort().reverse();
  if (sorted.length === 0) return { current: 0, longest: 0 };

  const today = new Date().toISOString().split('T')[0];
  const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];

  let currentStreak = 0;
  let longestStreak = 0;
  let tempStreak = 0;

  if (sorted[0] === today || sorted[0] === yesterday) {
    currentStreak = 1;
    for (let i = 1; i < sorted.length; i++) {
      const prevDate = new Date(sorted[i - 1]);
      const currDate = new Date(sorted[i]);
      const diffDays = (prevDate.getTime() - currDate.getTime()) / (1000 * 60 * 60 * 24);
      if (diffDays === 1) {
        currentStreak++;
      } else {
        break;
      }
    }
  }

  const sortedAsc = [...sorted].sort();
  tempStreak = 1;
  longestStreak = 1;
  for (let i = 1; i < sortedAsc.length; i++) {
    const prevDate = new Date(sortedAsc[i - 1]);
    const currDate = new Date(sortedAsc[i]);
    const diffDays = (currDate.getTime() - prevDate.getTime()) / (1000 * 60 * 60 * 24);
    if (diffDays === 1) {
      tempStreak++;
      longestStreak = Math.max(longestStreak, tempStreak);
    } else if (diffDays > 1) {
      tempStreak = 1;
    }
  }

  return { current: currentStreak, longest: Math.max(longestStreak, currentStreak) };
}

export async function recordActivity(): Promise<void> {
  const today = new Date().toISOString().split('T')[0];
  const userId = await requireUserId();
  const { error } = await supabase
    .from('activity_dates')
    .upsert({ user_id: userId, activity_date: today }, { onConflict: 'user_id,activity_date' });
  if (error) throw error;
}
