import type { ImageSourcePropType } from 'react-native';

export type Badge = {
  id: string;
  image: ImageSourcePropType;
  name: string;
  description: string;
  threshold: number;
};

export const BADGES: Badge[] = [
  {
    id: 'first_tick',
    image: require('../assets/images/badges/first.png'),
    name: 'First Tick',
    description: 'Complete your first checklist',
    threshold: 1,
  },
  {
    id: 'getting_started',
    image: require('../assets/images/badges/lightning.png'),
    name: 'Getting Started',
    description: 'Complete 3 checklists',
    threshold: 3,
  },
  {
    id: 'focused',
    image: require('../assets/images/badges/focused.png'),
    name: 'Focused',
    description: 'Complete 5 checklists',
    threshold: 5,
  },
  {
    id: 'on_fire',
    image: require('../assets/images/badges/fire.png'),
    name: 'On Fire',
    description: 'Complete 10 checklists',
    threshold: 10,
  },
  {
    id: 'champion',
    image: require('../assets/images/badges/champion.png'),
    name: 'Champion',
    description: 'Complete 25 checklists',
    threshold: 25,
  },
];

export function sameStringSet(a: string[], b: string[]): boolean {
  if (a.length !== b.length) return false;
  const setA = new Set(a);
  return b.every((id) => setA.has(id));
}

export function getEarnedBadgeIdsForCompletedCount(completedChecklistCount: number): string[] {
  return BADGES.filter((b) => b.threshold <= completedChecklistCount).map((b) => b.id);
}

export function getBadgesUnlockedBetweenCounts(prevCount: number, newCount: number): Badge[] {
  if (newCount <= prevCount) return [];
  return BADGES.filter(
    (b) => b.threshold <= newCount && b.threshold > prevCount
  );
}
