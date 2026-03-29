import { useEffect, useRef } from 'react';
import { Animated, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import type { Challenge } from '../constants/challenges';

type Props = {
  challenge: Challenge | null;
  onDismiss: () => void;
  topInset?: number;
};

export default function ChallengeNotification({ challenge, onDismiss, topInset = 12 }: Props) {
  const translateY = useRef(new Animated.Value(-120)).current;
  const opacity = useRef(new Animated.Value(0)).current;
  const onDismissRef = useRef(onDismiss);
  onDismissRef.current = onDismiss;

  useEffect(() => {
    if (!challenge) return;

    translateY.setValue(-120);
    opacity.setValue(0);

    Animated.parallel([
      Animated.spring(translateY, {
        toValue: 0,
        tension: 55,
        friction: 9,
        useNativeDriver: true,
      }),
      Animated.timing(opacity, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start();

    const timer = setTimeout(() => {
      Animated.parallel([
        Animated.timing(translateY, {
          toValue: -120,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start(() => onDismissRef.current());
    }, 3200);

    return () => clearTimeout(timer);
  }, [challenge]);

  if (!challenge) return null;

  return (
    <Animated.View
      style={[
        styles.container,
        { top: topInset, transform: [{ translateY }], opacity },
      ]}
    >
      <View style={styles.iconWrap}>
        <Ionicons name={challenge.icon as any} size={40} color="#FFFFFF" />
      </View>
      <View style={styles.textBlock}>
        <Text style={styles.eyebrow}>Challenge complete</Text>
        <Text style={styles.name}>{challenge.title}</Text>
        <Text style={styles.description}>
          +{challenge.points} pts · {challenge.description}
        </Text>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    left: 16,
    right: 16,
    backgroundColor: '#1565C0',
    borderRadius: 16,
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
    gap: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.18,
    shadowRadius: 10,
    elevation: 10,
    zIndex: 998,
  },

  iconWrap: {
    width: 48,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
  },

  textBlock: {
    flex: 1,
  },

  eyebrow: {
    color: '#90CAF9',
    fontSize: 10,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 1,
  },

  name: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },

  description: {
    color: '#BBDEFB',
    fontSize: 12,
    marginTop: 1,
  },
});
