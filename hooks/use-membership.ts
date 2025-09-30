import createContextHook from '@nkzw/create-context-hook';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useEffect, useState } from 'react';

export type MembershipTier = 'free_trial' | 'free' | 'basic' | 'premium';

export interface MembershipStatus {
  tier: MembershipTier;
  usageCount: number;
  dailyUsageCount: number;
  lastResetDate: string;
  trialUsed: boolean;
  registrationDate: string;
}

export interface MembershipLimits {
  dailyLimit: number;
  monthlyLimit: number;
  totalLimit: number;
  canAccessAllSources: boolean;
}

const MEMBERSHIP_LIMITS: Record<MembershipTier, MembershipLimits> = {
  free_trial: {
    dailyLimit: -1, // unlimited
    monthlyLimit: -1, // unlimited
    totalLimit: 2000,
    canAccessAllSources: true,
  },
  free: {
    dailyLimit: 30,
    monthlyLimit: -1, // unlimited
    totalLimit: -1, // unlimited
    canAccessAllSources: true,
  },
  basic: {
    dailyLimit: 40, // daily login bonus
    monthlyLimit: 1500,
    totalLimit: -1, // unlimited
    canAccessAllSources: true,
  },
  premium: {
    dailyLimit: -1, // unlimited
    monthlyLimit: -1, // unlimited
    totalLimit: -1, // unlimited
    canAccessAllSources: true,
  },
};

export const [MembershipProvider, useMembership] = createContextHook(() => {
  const [membershipStatus, setMembershipStatus] = useState<MembershipStatus>({
    tier: 'free_trial',
    usageCount: 0,
    dailyUsageCount: 0,
    lastResetDate: new Date().toISOString().split('T')[0],
    trialUsed: false,
    registrationDate: new Date().toISOString(),
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadMembershipStatus();
  }, []);

  const loadMembershipStatus = async () => {
    try {
      const stored = await AsyncStorage.getItem('membershipStatus');
      if (stored) {
        const status = JSON.parse(stored) as MembershipStatus;
        // Check if we need to reset daily usage
        const today = new Date().toISOString().split('T')[0];
        if (status.lastResetDate !== today) {
          status.dailyUsageCount = 0;
          status.lastResetDate = today;
          await saveMembershipStatus(status);
        }
        setMembershipStatus(status);
      } else {
        // First time user - give free trial
        const initialStatus: MembershipStatus = {
          tier: 'free_trial',
          usageCount: 0,
          dailyUsageCount: 0,
          lastResetDate: new Date().toISOString().split('T')[0],
          trialUsed: false,
          registrationDate: new Date().toISOString(),
        };
        await saveMembershipStatus(initialStatus);
        setMembershipStatus(initialStatus);
      }
    } catch (error) {
      console.error('Error loading membership status:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const saveMembershipStatus = async (status: MembershipStatus) => {
    try {
      await AsyncStorage.setItem('membershipStatus', JSON.stringify(status));
    } catch (error) {
      console.error('Error saving membership status:', error);
    }
  };

  const incrementUsage = async (): Promise<boolean> => {
    const limits = MEMBERSHIP_LIMITS[membershipStatus.tier];
    const today = new Date().toISOString().split('T')[0];
    
    // Reset daily count if needed
    let currentStatus = { ...membershipStatus };
    if (currentStatus.lastResetDate !== today) {
      currentStatus.dailyUsageCount = 0;
      currentStatus.lastResetDate = today;
    }

    // Check limits
    if (limits.dailyLimit > 0 && currentStatus.dailyUsageCount >= limits.dailyLimit) {
      return false; // Daily limit exceeded
    }
    
    if (limits.totalLimit > 0 && currentStatus.usageCount >= limits.totalLimit) {
      // Trial expired, downgrade to free
      if (currentStatus.tier === 'free_trial') {
        currentStatus.tier = 'free';
        currentStatus.trialUsed = true;
      } else {
        return false; // Total limit exceeded
      }
    }

    // Increment usage
    currentStatus.usageCount += 1;
    currentStatus.dailyUsageCount += 1;

    await saveMembershipStatus(currentStatus);
    setMembershipStatus(currentStatus);
    return true;
  };

  const upgradeMembership = async (newTier: MembershipTier) => {
    const updatedStatus = {
      ...membershipStatus,
      tier: newTier,
    };
    await saveMembershipStatus(updatedStatus);
    setMembershipStatus(updatedStatus);
  };

  const getRemainingUsage = () => {
    const limits = MEMBERSHIP_LIMITS[membershipStatus.tier];
    const today = new Date().toISOString().split('T')[0];
    
    let currentStatus = { ...membershipStatus };
    if (currentStatus.lastResetDate !== today) {
      currentStatus.dailyUsageCount = 0;
    }

    return {
      dailyRemaining: limits.dailyLimit > 0 ? Math.max(0, limits.dailyLimit - currentStatus.dailyUsageCount) : -1,
      totalRemaining: limits.totalLimit > 0 ? Math.max(0, limits.totalLimit - currentStatus.usageCount) : -1,
      canUse: (limits.dailyLimit <= 0 || currentStatus.dailyUsageCount < limits.dailyLimit) &&
              (limits.totalLimit <= 0 || currentStatus.usageCount < limits.totalLimit),
    };
  };

  const getMembershipLimits = () => MEMBERSHIP_LIMITS[membershipStatus.tier];

  return {
    membershipStatus,
    isLoading,
    incrementUsage,
    upgradeMembership,
    getRemainingUsage,
    getMembershipLimits,
    MEMBERSHIP_LIMITS,
  };
});