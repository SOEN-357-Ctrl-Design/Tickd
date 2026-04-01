import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from 'react';
import { doc, onSnapshot, setDoc } from 'firebase/firestore';
import { db } from '../firebaseConfig';
import {
  CHALLENGES,
  getDayKey,
  getWeekKey,
  isChallengeCompleted,
  type Challenge,
} from '../constants/challenges';
import { getSkinById, DEFAULT_SKIN, type Skin } from '../constants/skins';
import { useAuth } from './AuthContext';

type ProgressEntry = { count: number; periodKey: string };

type UserProgressData = {
  points: number;
  purchasedSkins: string[];
  equippedSkin: string;
  challengeCompletedOn: Record<string, string>;
  challengeProgressOn: Record<string, ProgressEntry>;
};

type TrackResult = { completedChallenges: Challenge[]; pointsEarned: number };

type UserProgressContextType = {
  points: number;
  purchasedSkins: string[];
  equippedSkin: string;
  activeTheme: Skin;
  challengeCompletedOn: Record<string, string>;
  challengeProgressOn: Record<string, ProgressEntry>;
  loading: boolean;
  trackAction: (actionKey: string) => Promise<TrackResult>;
  purchaseSkin: (skinId: string) => Promise<{ success: boolean; error?: string }>;
  equipSkin: (skinId: string) => Promise<void>;
};

const UserProgressContext = createContext<UserProgressContextType | null>(null);

const USER_PROGRESS_REF = 'userProgress';

export function UserProgressProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const uid = user!.uid;
  const [data, setData] = useState<UserProgressData>({
    points: 0,
    purchasedSkins: ['default'],
    equippedSkin: 'default',
    challengeCompletedOn: {},
    challengeProgressOn: {},
  });
  const [loading, setLoading] = useState(true);

  // Keep a ref so callbacks always read latest data without needing re-creation
  const dataRef = useRef(data);
  useEffect(() => {
    dataRef.current = data;
  }, [data]);

  useEffect(() => {
    const ref = doc(db, USER_PROGRESS_REF, uid);
    const unsubscribe = onSnapshot(ref, (snap) => {
      if (snap.exists()) {
        const d = snap.data();
        setData({
          points: d.points ?? 0,
          purchasedSkins: d.purchasedSkins ?? ['default'],
          equippedSkin: d.equippedSkin ?? 'default',
          challengeCompletedOn: d.challengeCompletedOn ?? {},
          challengeProgressOn: d.challengeProgressOn ?? {},
        });
      }
      setLoading(false);
    });
    return () => unsubscribe();
  }, [uid]);

  const trackAction = useCallback(async (actionKey: string): Promise<TrackResult> => {
    const current = dataRef.current;
    const matching = CHALLENGES.filter(
      (c) => c.actionKey === actionKey && !isChallengeCompleted(c, current.challengeCompletedOn),
    );

    if (matching.length === 0) return { completedChallenges: [], pointsEarned: 0 };

    let pointsEarned = 0;
    const completed: Challenge[] = [];
    const newCompletedOn = { ...current.challengeCompletedOn };
    const newProgressOn = { ...current.challengeProgressOn };

    for (const challenge of matching) {
      const periodKey = challenge.type === 'daily' ? getDayKey() : getWeekKey();
      const existing = newProgressOn[challenge.id];
      const currentCount =
        existing && existing.periodKey === periodKey ? existing.count : 0;
      const newCount = currentCount + 1;

      newProgressOn[challenge.id] = { count: newCount, periodKey };

      if (newCount >= challenge.target) {
        newCompletedOn[challenge.id] = periodKey;
        pointsEarned += challenge.points;
        completed.push(challenge);
      }
    }

    const ref = doc(db, USER_PROGRESS_REF, uid);
    await setDoc(
      ref,
      {
        points: current.points + pointsEarned,
        challengeCompletedOn: newCompletedOn,
        challengeProgressOn: newProgressOn,
      },
      { merge: true },
    );

    return { completedChallenges: completed, pointsEarned };
  }, [uid]);

  const purchaseSkin = useCallback(
    async (skinId: string): Promise<{ success: boolean; error?: string }> => {
      const current = dataRef.current;
      if (current.purchasedSkins.includes(skinId)) {
        return { success: false, error: 'Already owned' };
      }
      const skin = getSkinById(skinId);
      if (current.points < skin.cost) {
        return { success: false, error: 'Not enough points' };
      }
      const ref = doc(db, USER_PROGRESS_REF, uid);
      await setDoc(
        ref,
        {
          points: current.points - skin.cost,
          purchasedSkins: [...current.purchasedSkins, skinId],
        },
        { merge: true },
      );
      return { success: true };
    },
    [uid],
  );

  const equipSkin = useCallback(async (skinId: string): Promise<void> => {
    const current = dataRef.current;
    if (!current.purchasedSkins.includes(skinId)) return;
    const ref = doc(db, USER_PROGRESS_REF, uid);
    await setDoc(ref, { equippedSkin: skinId }, { merge: true });
  }, [uid]);

  const activeTheme = getSkinById(data.equippedSkin) ?? DEFAULT_SKIN;

  return (
    <UserProgressContext.Provider
      value={{
        points: data.points,
        purchasedSkins: data.purchasedSkins,
        equippedSkin: data.equippedSkin,
        activeTheme,
        challengeCompletedOn: data.challengeCompletedOn,
        challengeProgressOn: data.challengeProgressOn,
        loading,
        trackAction,
        purchaseSkin,
        equipSkin,
      }}
    >
      {children}
    </UserProgressContext.Provider>
  );
}

const FALLBACK: UserProgressContextType = {
  points: 0,
  purchasedSkins: ['default'],
  equippedSkin: 'default',
  activeTheme: DEFAULT_SKIN,
  challengeCompletedOn: {},
  challengeProgressOn: {},
  loading: true,
  trackAction: async () => ({ completedChallenges: [], pointsEarned: 0 }),
  purchaseSkin: async () => ({ success: false, error: 'Not ready' }),
  equipSkin: async () => {},
};

export function useUserProgress(): UserProgressContextType {
  const ctx = useContext(UserProgressContext);
  return ctx ?? FALLBACK;
}
