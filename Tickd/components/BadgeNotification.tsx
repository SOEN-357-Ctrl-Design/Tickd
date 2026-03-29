import { useEffect, useRef } from 'react';
import { Animated, Image, StyleSheet, Text, View } from 'react-native';
import type { Badge } from '../constants/badges';

type Props = {
  badge: Badge | null;
  onDismiss: () => void;
};

export default function BadgeNotification({ badge, onDismiss }: Props) {
  const translateY = useRef(new Animated.Value(-120)).current;
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!badge) return;

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
      ]).start(() => onDismiss());
    }, 3200);

    return () => clearTimeout(timer);
  }, [badge]);

  if (!badge) return null;

  return (
    <Animated.View
      style={[styles.container, { transform: [{ translateY }], opacity }]}
    >
      <Image source={badge.image} style={styles.badgeImage} resizeMode="contain" />
      <View style={styles.textBlock}>
        <Text style={styles.eyebrow}>Badge Earned!</Text>
        <Text style={styles.name}>{badge.name}</Text>
        <Text style={styles.description}>{badge.description}</Text>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 12,
    left: 16,
    right: 16,
    backgroundColor: '#1B5E20',
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
    zIndex: 999,
  },

  badgeImage: {
    width: 48,
    height: 48,
  },

  textBlock: {
    flex: 1,
  },

  eyebrow: {
    color: '#A5D6A7',
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
    color: '#C8E6C9',
    fontSize: 12,
    marginTop: 1,
  },
});
