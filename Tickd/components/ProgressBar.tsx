import { useEffect, useRef } from 'react';
import { View, Text, Animated, StyleSheet } from 'react-native';

type Props = {
  completed: number;
  total: number;
};

export default function ProgressBar({ completed, total }: Props) {
  const animatedWidth = useRef(new Animated.Value(0)).current;

  const progress = total > 0 ? completed / total : 0;
  const isComplete = total > 0 && completed === total;

  useEffect(() => {
    Animated.timing(animatedWidth, {
      toValue: progress,
      duration: 450,
      useNativeDriver: false,
    }).start();
  }, [progress]);

  if (total === 0) return null;

  return (
    <View style={styles.container}>
      <View style={styles.track}>
        <Animated.View
          style={[
            styles.fill,
            isComplete && styles.fillComplete,
            {
              width: animatedWidth.interpolate({
                inputRange: [0, 1],
                outputRange: ['0%', '100%'],
              }),
            },
          ]}
        />
      </View>

      <View style={styles.footer}>
        <Text style={styles.label}>
          {completed} / {total} tasks
        </Text>
        {isComplete && (
          <View style={styles.badge}>
            <Text style={styles.badgeText}>All done ✓</Text>
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginTop: 8,
    marginBottom: 4,
  },

  track: {
    height: 8,
    backgroundColor: '#E0E0E0',
    borderRadius: 4,
    overflow: 'hidden',
  },

  fill: {
    height: '100%',
    backgroundColor: '#4CAF50',
    borderRadius: 4,
  },

  fillComplete: {
    backgroundColor: '#2E7D32',
  },

  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 5,
  },

  label: {
    fontSize: 12,
    color: '#888',
  },

  badge: {
    backgroundColor: '#E8F5E9',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#4CAF50',
  },

  badgeText: {
    fontSize: 11,
    color: '#2E7D32',
    fontWeight: '600',
  },
});
