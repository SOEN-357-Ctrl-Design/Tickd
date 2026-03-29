import { Ionicons } from '@expo/vector-icons';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import {
  CHALLENGES,
  getChallengeProgress,
  isChallengeCompleted,
  type Challenge,
} from '../../constants/challenges';
import { useUserProgress } from '../../context/UserProgressContext';

function PointsBadge({ points, theme }: { points: number; theme: { primary: string; primaryLight: string; primaryBorder: string } }) {
  return (
    <View style={[styles.pointsBadge, { backgroundColor: theme.primaryLight, borderColor: theme.primaryBorder }]}>
      <Ionicons name="star" size={16} color={theme.primary} />
      <Text style={[styles.pointsText, { color: theme.primary }]}>{points} pts</Text>
    </View>
  );
}

function ChallengeCard({
  challenge,
  completed,
  progress,
  theme,
}: {
  challenge: Challenge;
  completed: boolean;
  progress: number;
  theme: { primary: string; primaryLight: string; primaryDark: string; primaryBorder: string };
}) {
  const pct = Math.min(progress / challenge.target, 1);

  return (
    <View style={[styles.card, completed && { borderColor: theme.primaryBorder, borderWidth: 1.5 }]}>
      <View style={[styles.iconWrap, { backgroundColor: completed ? theme.primaryLight : '#F0F0F0' }]}>
        <Ionicons
          name={challenge.icon as any}
          size={22}
          color={completed ? theme.primary : '#999'}
        />
      </View>

      <View style={styles.cardBody}>
        <View style={styles.cardHeader}>
          <Text style={styles.cardTitle}>{challenge.title}</Text>
          <View style={[styles.rewardPill, { backgroundColor: completed ? theme.primaryLight : '#F5F5F5' }]}>
            <Text style={[styles.rewardText, { color: completed ? theme.primaryDark : '#888' }]}>
              +{challenge.points} pts
            </Text>
          </View>
        </View>

        <Text style={styles.cardDesc}>{challenge.description}</Text>

        {completed ? (
          <View style={styles.completedRow}>
            <Ionicons name="checkmark-circle" size={14} color={theme.primary} />
            <Text style={[styles.completedText, { color: theme.primary }]}>Completed!</Text>
          </View>
        ) : (
          <View style={styles.progressSection}>
            <View style={styles.progressTrack}>
              <View
                style={[
                  styles.progressFill,
                  { width: `${pct * 100}%` as any, backgroundColor: theme.primary },
                ]}
              />
            </View>
            <Text style={styles.progressLabel}>
              {progress} / {challenge.target}
            </Text>
          </View>
        )}
      </View>
    </View>
  );
}

function SectionHeader({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    <View style={styles.sectionHeader}>
      <Text style={styles.sectionTitle}>{title}</Text>
      <Text style={styles.sectionSubtitle}>{subtitle}</Text>
    </View>
  );
}

export default function ChallengesScreen() {
  const { points, challengeCompletedOn, challengeProgressOn, activeTheme } = useUserProgress();

  const dailyChallenges = CHALLENGES.filter((c) => c.type === 'daily');
  const weeklyChallenges = CHALLENGES.filter((c) => c.type === 'weekly');

  const renderChallenge = (c: Challenge) => (
    <ChallengeCard
      key={c.id}
      challenge={c}
      completed={isChallengeCompleted(c, challengeCompletedOn)}
      progress={getChallengeProgress(c, challengeProgressOn)}
      theme={activeTheme}
    />
  );

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.headerRow}>
        <Text style={styles.heading}>Challenges</Text>
        <PointsBadge points={points} theme={activeTheme} />
      </View>

      <Text style={styles.subtitle}>
        Complete challenges to earn points and unlock skins in the Shop.
      </Text>

      <SectionHeader title="Daily Challenges" subtitle="Resets every day" />
      {dailyChallenges.map(renderChallenge)}

      <SectionHeader title="Weekly Challenges" subtitle="Resets every week" />
      {weeklyChallenges.map(renderChallenge)}
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

  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },

  heading: {
    fontSize: 26,
    fontWeight: 'bold',
    color: '#1A1A1A',
  },

  pointsBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
  },

  pointsText: {
    fontSize: 14,
    fontWeight: '700',
  },

  subtitle: {
    fontSize: 13,
    color: '#888',
    marginBottom: 24,
    lineHeight: 18,
  },

  sectionHeader: {
    marginBottom: 12,
    marginTop: 4,
  },

  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1A1A1A',
  },

  sectionSubtitle: {
    fontSize: 12,
    color: '#AAA',
    marginTop: 1,
  },

  card: {
    backgroundColor: 'white',
    borderRadius: 14,
    padding: 14,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.07,
    shadowRadius: 4,
  },

  iconWrap: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },

  cardBody: {
    flex: 1,
  },

  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 2,
  },

  cardTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1A1A1A',
    flex: 1,
  },

  rewardPill: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
    marginLeft: 6,
  },

  rewardText: {
    fontSize: 12,
    fontWeight: '700',
  },

  cardDesc: {
    fontSize: 12,
    color: '#666',
    marginBottom: 8,
  },

  completedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },

  completedText: {
    fontSize: 12,
    fontWeight: '700',
  },

  progressSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },

  progressTrack: {
    flex: 1,
    height: 6,
    backgroundColor: '#EEEEEE',
    borderRadius: 3,
    overflow: 'hidden',
  },

  progressFill: {
    height: '100%',
    borderRadius: 3,
  },

  progressLabel: {
    fontSize: 11,
    color: '#999',
    minWidth: 34,
    textAlign: 'right',
  },
});
