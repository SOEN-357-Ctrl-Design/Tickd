import { useEffect, useState } from 'react';
import {
  View,
  Text,
  Image,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  TouchableOpacity,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { doc, onSnapshot, setDoc } from 'firebase/firestore';
import { db } from '../../firebaseConfig';
import {
  BADGES,
  getEarnedBadgeIdsForCompletedCount,
  sameStringSet,
} from '../../constants/badges';
import { useUserProgress } from '../../context/UserProgressContext';
import { useAuth } from '../../context/AuthContext';

export default function ProfileScreen() {
  const { points, activeTheme } = useUserProgress();
  const { user, signOut } = useAuth();
  const uid = user?.uid ?? '';
  const [earnedBadgeIds, setEarnedBadgeIds] = useState<string[]>([]);
  const [completedCount, setCompletedCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!uid) return;
    const ref = doc(db, 'userProgress', uid);

    const unsubscribe = onSnapshot(ref, (snap) => {
      if (snap.exists()) {
        const data = snap.data();
        const completedListIds = data.completedListIds ?? [];
        const syncedEarned = getEarnedBadgeIdsForCompletedCount(completedListIds.length);
        const storedEarned = data.earnedBadgeIds ?? [];

        setCompletedCount(completedListIds.length);
        setEarnedBadgeIds(syncedEarned);

        if (!sameStringSet(storedEarned, syncedEarned)) {
          void setDoc(ref, { earnedBadgeIds: syncedEarned }, { merge: true });
        }
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, [uid]);

  const earnedCount = earnedBadgeIds.length;
  const nextBadge = BADGES.find((b) => !earnedBadgeIds.includes(b.id));

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.heading}>My Profile</Text>

      {/* Stats row */}
      <View style={styles.statsRow}>
        <View style={styles.statCard}>
          <Text style={[styles.statNumber, { color: activeTheme.primary }]}>{completedCount}</Text>
          <Text style={styles.statLabel}>Completed</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={[styles.statNumber, { color: activeTheme.primary }]}>{earnedCount}</Text>
          <Text style={styles.statLabel}>Badges</Text>
        </View>
        <View style={[styles.statCard, { backgroundColor: activeTheme.primaryLight, borderColor: activeTheme.primaryBorder, borderWidth: 1 }]}>
          <View style={styles.pointsRow}>
            <Ionicons name="star" size={18} color={activeTheme.primary} />
            <Text style={[styles.statNumber, { color: activeTheme.primary }]}>{points}</Text>
          </View>
          <Text style={styles.statLabel}>Points</Text>
        </View>
      </View>

      {/* Next badge hint */}
      {nextBadge && !loading && (
        <View style={[styles.nextBadgeHint, { backgroundColor: activeTheme.primaryLight, borderColor: activeTheme.primaryBorder }]}>
          <Image
            source={nextBadge.image}
            style={styles.nextBadgeImage}
            resizeMode="contain"
          />
          <View style={styles.nextBadgeText}>
            <Text style={[styles.nextBadgeLabel, { color: activeTheme.primary }]}>Next Badge</Text>
            <Text style={styles.nextBadgeName}>{nextBadge.name}</Text>
            <Text style={styles.nextBadgeDesc}>{nextBadge.description}</Text>
          </View>
        </View>
      )}

      <Text style={styles.sectionTitle}>Badge Gallery</Text>

      {loading ? (
        <ActivityIndicator color={activeTheme.primary} style={{ marginTop: 20 }} />
      ) : (
        <View style={styles.badgeGrid}>
          {BADGES.map((badge) => {
            const earned = earnedBadgeIds.includes(badge.id);
            return (
              <View
                key={badge.id}
                style={[styles.badgeCard, !earned && styles.badgeCardLocked]}
              >
                <View style={styles.badgeImageWrap}>
                  <Image
                    source={badge.image}
                    style={[styles.badgeImage, !earned && styles.badgeImageLocked]}
                    resizeMode="contain"
                  />
                </View>
                <Text style={[styles.badgeName, !earned && styles.badgeNameLocked]}>
                  {badge.name}
                </Text>
                <Text style={[styles.badgeDesc, !earned && styles.badgeDescLocked]}>
                  {badge.description}
                </Text>
                {earned && (
                  <View style={[styles.earnedPill, { backgroundColor: activeTheme.primaryLight, borderColor: activeTheme.primary }]}>
                    <Text style={[styles.earnedPillText, { color: activeTheme.primaryDark }]}>Earned</Text>
                  </View>
                )}
              </View>
            );
          })}
        </View>
      )}

      <TouchableOpacity style={styles.signOutButton} onPress={signOut}>
        <Ionicons name="log-out-outline" size={18} color="#E53935" />
        <Text style={styles.signOutText}>Sign Out</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F7F7F7',
  },

  content: {
    padding: 20,
    paddingBottom: 40,
  },

  signOutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginTop: 28,
    paddingVertical: 14,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E53935',
  },

  signOutText: {
    color: '#E53935',
    fontWeight: '600',
    fontSize: 15,
  },

  heading: {
    fontSize: 26,
    fontWeight: 'bold',
    marginBottom: 20,
    color: '#1A1A1A',
  },

  statsRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },

  statCard: {
    flex: 1,
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
  },

  statNumber: {
    fontSize: 32,
    fontWeight: 'bold',
  },

  pointsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },

  statLabel: {
    fontSize: 13,
    color: '#888',
    marginTop: 2,
  },

  nextBadgeHint: {
    backgroundColor: '#E8F5E9',
    borderRadius: 12,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#C8E6C9',
  },

  nextBadgeImage: {
    width: 44,
    height: 44,
  },

  nextBadgeText: {
    flex: 1,
  },

  nextBadgeLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: '#4CAF50',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: 1,
  },

  nextBadgeName: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#1A1A1A',
  },

  nextBadgeDesc: {
    fontSize: 12,
    color: '#666',
    marginTop: 1,
  },

  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1A1A1A',
    marginBottom: 14,
  },

  badgeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },

  badgeCard: {
    width: '48%',
    backgroundColor: 'white',
    borderRadius: 14,
    padding: 16,
    alignItems: 'center',
    marginBottom: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
  },

  badgeCardLocked: {
    backgroundColor: '#FAFAFA',
    elevation: 0,
    shadowOpacity: 0,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },

  badgeImageWrap: {
    width: 64,
    height: 64,
    marginBottom: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },

  badgeImage: {
    width: 64,
    height: 64,
  },

  badgeImageLocked: {
    opacity: 0.28,
  },

  badgeName: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1A1A1A',
    textAlign: 'center',
    marginBottom: 4,
  },

  badgeNameLocked: {
    color: '#BDBDBD',
  },

  badgeDesc: {
    fontSize: 11,
    color: '#666',
    textAlign: 'center',
  },

  badgeDescLocked: {
    color: '#C8C8C8',
  },

  earnedPill: {
    marginTop: 8,
    backgroundColor: '#E8F5E9',
    paddingHorizontal: 10,
    paddingVertical: 2,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#4CAF50',
  },

  earnedPillText: {
    fontSize: 10,
    color: '#2E7D32',
    fontWeight: '700',
  },
});
