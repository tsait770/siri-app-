import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { Crown, Zap, Star, Gift } from 'lucide-react-native';
import { useMembership, MembershipTier } from '@/hooks/use-membership';
import { useI18n } from '@/hooks/use-i18n';

function getTierName(tier: string, t: (key: string) => string): string {
  const tierKey = `membership.tier.${tier}`;
  const translated = t(tierKey);
  // If translation key not found, return the tier as fallback
  if (translated === tierKey) {
    return tier.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase());
  }
  return translated;
}

interface MembershipCardProps {
  onUpgrade?: (tier: MembershipTier) => void;
}

export function MembershipCard({ onUpgrade }: MembershipCardProps) {
  const { membershipStatus, getRemainingUsage, getMembershipLimits } = useMembership();
  const { t } = useI18n();
  const remaining = getRemainingUsage();
  const limits = getMembershipLimits();

  const getTierIcon = (tier: MembershipTier) => {
    switch (tier) {
      case 'free_trial':
        return <Gift color="#10b981" size={20} />;
      case 'free':
        return <Zap color="#6b7280" size={20} />;
      case 'basic':
        return <Star color="#f59e0b" size={20} />;
      case 'premium':
        return <Crown color="#8b5cf6" size={20} />;
    }
  };

  const getTierColor = (tier: MembershipTier) => {
    switch (tier) {
      case 'free_trial':
        return ['#10b981', '#059669'];
      case 'free':
        return ['#6b7280', '#4b5563'];
      case 'basic':
        return ['#f59e0b', '#d97706'];
      case 'premium':
        return ['#8b5cf6', '#7c3aed'];
    }
  };

  // Use the helper function instead of switch statement
  const tierName = getTierName(membershipStatus.tier, t);

  const colors = getTierColor(membershipStatus.tier);

  return (
    <View style={styles.container}>
      <BlurView intensity={20} style={styles.card}>
        <LinearGradient
          colors={[`${colors[0]}20`, `${colors[1]}10`]}
          style={styles.gradient}
        >
          <View style={styles.header}>
            <View style={styles.tierInfo}>
              {getTierIcon(membershipStatus.tier)}
              <Text style={styles.tierName}>{tierName}</Text>
            </View>
            {membershipStatus.tier === 'free_trial' && (
              <View style={[styles.badge, { backgroundColor: colors[0] }]}>
                <Text style={styles.badgeText}>TRIAL</Text>
              </View>
            )}
          </View>

          <View style={styles.usage}>
            {limits.dailyLimit > 0 && (
              <View style={styles.usageItem}>
                <Text style={styles.usageLabel}>{t('membership.dailyUsage')}</Text>
                <Text style={styles.usageValue}>
                  {remaining.dailyRemaining >= 0 ? remaining.dailyRemaining : '∞'} / {limits.dailyLimit > 0 ? limits.dailyLimit : '∞'}
                </Text>
              </View>
            )}
            
            {limits.totalLimit > 0 && (
              <View style={styles.usageItem}>
                <Text style={styles.usageLabel}>{t('membership.totalUsage')}</Text>
                <Text style={styles.usageValue}>
                  {membershipStatus.usageCount} / {limits.totalLimit}
                </Text>
              </View>
            )}

            {membershipStatus.tier === 'premium' && (
              <View style={styles.usageItem}>
                <Text style={styles.usageLabel}>{t('membership.status')}</Text>
                <Text style={[styles.usageValue, { color: colors[0] }]}>
                  {t('membership.unlimited')}
                </Text>
              </View>
            )}
          </View>

          {membershipStatus.tier !== 'premium' && (
            <View style={styles.upgradeSection}>
              <Text style={styles.upgradeText}>{t('membership.upgradePrompt')}</Text>
              <View style={styles.upgradeButtons}>
                {membershipStatus.tier !== 'basic' && (
                  <TouchableOpacity
                    style={[styles.upgradeButton, { backgroundColor: '#f59e0b' }]}
                    onPress={() => onUpgrade?.('basic')}
                  >
                    <Star color="#fff" size={16} />
                    <Text style={styles.upgradeButtonText}>{t('membership.upgradeBasic')}</Text>
                  </TouchableOpacity>
                )}
                <TouchableOpacity
                  style={[styles.upgradeButton, { backgroundColor: '#8b5cf6' }]}
                  onPress={() => onUpgrade?.('premium')}
                >
                  <Crown color="#fff" size={16} />
                  <Text style={styles.upgradeButtonText}>{t('membership.upgradePremium')}</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
        </LinearGradient>
      </BlurView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginVertical: 16,
  },
  card: {
    borderRadius: 20,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  gradient: {
    padding: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  tierInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  tierName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1f2937',
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  badgeText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  usage: {
    gap: 12,
    marginBottom: 16,
  },
  usageItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  usageLabel: {
    fontSize: 14,
    color: '#6b7280',
    fontWeight: '500',
  },
  usageValue: {
    fontSize: 14,
    color: '#1f2937',
    fontWeight: '600',
  },
  upgradeSection: {
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.2)',
    paddingTop: 16,
  },
  upgradeText: {
    fontSize: 14,
    color: '#6b7280',
    textAlign: 'center',
    marginBottom: 12,
  },
  upgradeButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  upgradeButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 12,
  },
  upgradeButtonText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
});