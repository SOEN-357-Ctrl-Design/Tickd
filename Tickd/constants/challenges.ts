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

const CHALLENGE_TIMEZONE = 'America/New_York';

const easternDateFormatter = new Intl.DateTimeFormat('en-CA', {
  timeZone: CHALLENGE_TIMEZONE,
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
});

const easternWeekdayFormatter = new Intl.DateTimeFormat('en-US', {
  timeZone: CHALLENGE_TIMEZONE,
  weekday: 'short',
});

const EASTERN_WEEKDAY_TO_OFFSET: Record<string, number> = {
  Sun: 0,
  Mon: 1,
  Tue: 2,
  Wed: 3,
  Thu: 4,
  Fri: 5,
  Sat: 6,
};

function daysInMonth(year: number, month1To12: number): number {
  return new Date(year, month1To12, 0).getDate();
}

function parseEasternYmd(date: Date): { y: number; m: number; d: number } {
  const s = easternDateFormatter.format(date);
  const [y, m, d] = s.split('-').map(Number);
  return { y, m, d };
}

function ymdToKey(y: number, m: number, d: number): string {
  return `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
}

function addDaysToEasternYmd(
  y: number,
  m: number,
  d: number,
  delta: number,
): { y: number; m: number; d: number } {
  let dd = d + delta;
  let mm = m;
  let yy = y;
  while (dd < 1) {
    mm -= 1;
    if (mm < 1) {
      mm = 12;
      yy -= 1;
    }
    dd += daysInMonth(yy, mm);
  }
  while (dd > daysInMonth(yy, mm)) {
    dd -= daysInMonth(yy, mm);
    mm += 1;
    if (mm > 12) {
      mm = 1;
      yy += 1;
    }
  }
  return { y: yy, m: mm, d: dd };
}

export function getDayKey(date: Date = new Date()): string {
  const { y, m, d } = parseEasternYmd(date);
  return ymdToKey(y, m, d);
}

// Start of week is Sunday and use YYYY-MM-DD format for the key
export function getWeekKey(date: Date = new Date()): string {
  const { y, m, d } = parseEasternYmd(date);
  const weekdayPart = easternWeekdayFormatter.formatToParts(date).find((p) => p.type === 'weekday')
    ?.value;
  const offset = weekdayPart ? EASTERN_WEEKDAY_TO_OFFSET[weekdayPart] ?? 0 : 0;
  const sun = addDaysToEasternYmd(y, m, d, -offset);
  return ymdToKey(sun.y, sun.m, sun.d);
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
