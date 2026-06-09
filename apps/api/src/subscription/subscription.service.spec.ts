import { getTierForStudentCount } from './subscription.service';

// Tier pricing table ($/student/month)
const TIER_PRICES: Record<'starter' | 'growth' | 'pro', number> = {
  starter: 4,
  growth: 5,
  pro: 6,
};

describe('getTierForStudentCount', () => {
  describe('starter tier (1–50 students)', () => {
    it('returns starter for 1 student at $4/student', () => {
      const tier = getTierForStudentCount(1);
      expect(tier).toBe('starter');
      expect(TIER_PRICES[tier]).toBe(4);
    });

    it('returns starter for 50 students at $4/student', () => {
      const tier = getTierForStudentCount(50);
      expect(tier).toBe('starter');
      expect(TIER_PRICES[tier]).toBe(4);
    });
  });

  describe('growth tier (51–150 students)', () => {
    it('returns growth for 51 students at $5/student', () => {
      const tier = getTierForStudentCount(51);
      expect(tier).toBe('growth');
      expect(TIER_PRICES[tier]).toBe(5);
    });

    it('returns growth for 150 students at $5/student', () => {
      const tier = getTierForStudentCount(150);
      expect(tier).toBe('growth');
      expect(TIER_PRICES[tier]).toBe(5);
    });
  });

  describe('pro tier (151+ students)', () => {
    it('returns pro for 151 students at $6/student', () => {
      const tier = getTierForStudentCount(151);
      expect(tier).toBe('pro');
      expect(TIER_PRICES[tier]).toBe(6);
    });

    it('returns pro for 300 students at $6/student', () => {
      const tier = getTierForStudentCount(300);
      expect(tier).toBe('pro');
      expect(TIER_PRICES[tier]).toBe(6);
    });
  });
});
