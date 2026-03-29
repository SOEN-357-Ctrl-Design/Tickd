export type ChallengeType = 'daily' | 'weekly';

export type Challenge = {
  id: string;
  type: ChallengeType;
  title: string;
  description: string;
  points: number;
  target: number;
  actionKey: string;
  icon: string;
};

export const CHALLENGES: Challenge[] = [
  {
    id: 'daily_complete_list',
    type: 'daily',
    title: 'Daily Doer',
    description: 'Complete 1 checklist today',
    points: 10,
    target: 1,
    actionKey: 'list_completed',
    icon: 'checkmark-circle-outline',
  },
  {
    id: 'daily_check_tasks',
    type: 'daily',
    title: 'Task Crusher',
    description: 'Check off 5 tasks today',
    points: 8,
    target: 5,
    actionKey: 'task_checked',
    icon: 'checkbox-outline',
  },
  {
    id: 'daily_create_list',
    type: 'daily',
    title: 'List Builder',
    description: 'Create a new checklist today',
    points: 5,
    target: 1,
    actionKey: 'list_created',
    icon: 'add-circle-outline',
  },
  {
    id: 'weekly_complete_3_lists',
    type: 'weekly',
    title: 'Productive Week',
    description: 'Complete 3 checklists this week',
    points: 35,
    target: 3,
    actionKey: 'list_completed',
    icon: 'trophy-outline',
  },
  {
    id: 'weekly_check_20_tasks',
    type: 'weekly',
    title: 'Heavy Lifter',
    description: 'Check off 20 tasks this week',
    points: 30,
    target: 20,
    actionKey: 'task_checked',
    icon: 'barbell-outline',
  },
  {
    id: 'weekly_create_3_lists',
    type: 'weekly',
    title: 'Organizer',
    description: 'Create 3 checklists this week',
    points: 20,
    target: 3,
    actionKey: 'list_created',
    icon: 'folder-outline',
  },
];

export function getDayKey(date: Date = new Date()): string {
  return date.toISOString().slice(0, 10);
}

export function getWeekKey(date: Date = new Date()): string {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() - d.getDay());
  return d.toISOString().slice(0, 10);
}

export function isChallengeCompleted(
  challenge: Challenge,
  completedMap: Record<string, string>,
): boolean {
  const key = completedMap[challenge.id];
  if (!key) return false;
  return challenge.type === 'daily' ? key === getDayKey() : key === getWeekKey();
}

export function getChallengeProgress(
  challenge: Challenge,
  progressOn: Record<string, { count: number; periodKey: string }>,
): number {
  const entry = progressOn[challenge.id];
  if (!entry) return 0;
  const currentPeriod =
    challenge.type === 'daily' ? getDayKey() : getWeekKey();
  return entry.periodKey === currentPeriod ? entry.count : 0;
}
