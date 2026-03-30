import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import {
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SKINS, type Skin } from '../../constants/skins';
import { useUserProgress } from '../../context/UserProgressContext';

function SkinCard({
  skin,
  owned,
  equipped,
  canAfford,
  onBuy,
  onEquip,
}: {
  skin: Skin;
  owned: boolean;
  equipped: boolean;
  canAfford: boolean;
  onBuy: () => void;
  onEquip: () => void;
}) {
  return (
    <View style={[styles.card, equipped && { borderColor: skin.primary, borderWidth: 2 }]}>
      <View style={[styles.swatchRow]}>
        <View style={[styles.swatch, { backgroundColor: skin.primary }]} />
        <View style={styles.swatchMini}>
          <View style={[styles.swatchDot, { backgroundColor: skin.primaryLight }]} />
          <View style={[styles.swatchDot, { backgroundColor: skin.primaryBorder }]} />
          <View style={[styles.swatchDot, { backgroundColor: skin.primaryDark }]} />
        </View>
      </View>

      <Text style={styles.skinName}>{skin.name}</Text>
      <Text style={styles.skinDesc}>{skin.description}</Text>

      {skin.cost === 0 ? (
        <Text style={styles.freeBadge}>Free</Text>
      ) : (
        <View style={styles.costRow}>
          <Ionicons name="star" size={13} color="#F59E0B" />
          <Text style={styles.costText}>{skin.cost} pts</Text>
        </View>
      )}

      {equipped ? (
        <View style={[styles.actionBtn, { backgroundColor: skin.primary }]}>
          <Ionicons name="checkmark-circle" size={15} color="white" />
          <Text style={styles.actionBtnText}>Equipped</Text>
        </View>
      ) : owned ? (
        <TouchableOpacity
          style={[styles.actionBtn, { backgroundColor: skin.primary }]}
          onPress={onEquip}
        >
          <Text style={styles.actionBtnText}>Equip</Text>
        </TouchableOpacity>
      ) : (
        <TouchableOpacity
          style={[
            styles.actionBtn,
            canAfford
              ? { backgroundColor: skin.primary }
              : { backgroundColor: '#E0E0E0' },
          ]}
          onPress={onBuy}
          disabled={!canAfford}
        >
          <Text style={[styles.actionBtnText, !canAfford && { color: '#999' }]}>
            {canAfford ? 'Buy' : 'Not enough pts'}
          </Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

export default function ShopScreen() {
  const { points, purchasedSkins, equippedSkin, activeTheme, purchaseSkin, equipSkin } =
    useUserProgress();
  const [busy, setBusy] = useState(false);

  const handleBuy = async (skin: Skin) => {
    if (busy) return;
    setBusy(true);
    try {
      const result = await purchaseSkin(skin.id);
      if (!result.success) {
        Alert.alert('Cannot buy', result.error ?? 'Something went wrong');
      }
    } finally {
      setBusy(false);
    }
  };

  const handleEquip = async (skin: Skin) => {
    if (busy) return;
    setBusy(true);
    try {
      await equipSkin(skin.id);
    } finally {
      setBusy(false);
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.headerRow}>
        <Text style={styles.heading}>Skin Shop</Text>
        <View
          style={[
            styles.pointsBadge,
            {
              backgroundColor: activeTheme.primaryLight,
              borderColor: activeTheme.primaryBorder,
            },
          ]}
        >
          <Ionicons name="star" size={16} color={activeTheme.primary} />
          <Text style={[styles.pointsText, { color: activeTheme.primary }]}>
            {points} pts
          </Text>
        </View>
      </View>

      <Text style={styles.subtitle}>
        Earn points by completing challenges, then spend them here to customize your app's look.
      </Text>

      <View style={styles.grid}>
        {SKINS.map((skin) => (
          <SkinCard
            key={skin.id}
            skin={skin}
            owned={purchasedSkins.includes(skin.id)}
            equipped={equippedSkin === skin.id}
            canAfford={points >= skin.cost}
            onBuy={() => handleBuy(skin)}
            onEquip={() => handleEquip(skin)}
          />
        ))}
      </View>
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
    marginBottom: 20,
    lineHeight: 18,
  },

  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },

  card: {
    width: '48%',
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 14,
    marginBottom: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
  },

  swatchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 10,
  },

  swatch: {
    width: 48,
    height: 48,
    borderRadius: 12,
  },

  swatchMini: {
    gap: 4,
  },

  swatchDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },

  skinName: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1A1A1A',
    marginBottom: 2,
  },

  skinDesc: {
    fontSize: 11,
    color: '#888',
    marginBottom: 8,
    lineHeight: 15,
  },

  freeBadge: {
    fontSize: 11,
    color: '#4CAF50',
    fontWeight: '700',
    marginBottom: 8,
  },

  costRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    marginBottom: 8,
  },

  costText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#F59E0B',
  },

  actionBtn: {
    borderRadius: 8,
    paddingVertical: 8,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 4,
  },

  actionBtnText: {
    color: 'white',
    fontSize: 13,
    fontWeight: '700',
  },
});
