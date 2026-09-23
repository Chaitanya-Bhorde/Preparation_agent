import { describe, it, expect } from 'vitest';
import {
  buildMonthGrid,
  dayKeyUTC,
  weekdayUTC,
  daysInMonthUTC,
  formatMonthTitle,
  shiftMonth,
  toCountMap,
  intensityForCount,
} from '../utils/heatmapDate';

describe('heatmapDate utilities', () => {
  describe('buildMonthGrid', () => {
    it('should create proper calendar grid for January 2026 (31 days)', () => {
      const { weeks, totalDays } = buildMonthGrid(2026, 1);
      
      expect(totalDays).toBe(31);
      
      const allDates = [];
      weeks.forEach(week => {
        week.forEach(day => {
          if (day) allDates.push(day);
        });
      });
      
      expect(allDates.length).toBe(31);
      
      const uniqueDates = new Set(allDates);
      expect(uniqueDates.size).toBe(31);
      
      expect(allDates[0]).toBe('2026-01-01');
      expect(allDates[30]).toBe('2026-01-31');
    });

    it('should create proper calendar grid for February 2024 (29 days, leap year)', () => {
      const { weeks, totalDays } = buildMonthGrid(2024, 2);
      
      expect(totalDays).toBe(29);
      
      const allDates = [];
      weeks.forEach(week => {
        week.forEach(day => {
          if (day) allDates.push(day);
        });
      });
      
      expect(allDates.length).toBe(29);
      
      const uniqueDates = new Set(allDates);
      expect(uniqueDates.size).toBe(29);
      
      expect(allDates[0]).toBe('2024-02-01');
      expect(allDates[28]).toBe('2024-02-29');
    });

    it('should create proper calendar grid for September 2026 (30 days)', () => {
      const { weeks, totalDays } = buildMonthGrid(2026, 9);
      
      expect(totalDays).toBe(30);
      
      const allDates = [];
      weeks.forEach(week => {
        week.forEach(day => {
          if (day) allDates.push(day);
        });
      });
      
      expect(allDates.length).toBe(30);
      
      const uniqueDates = new Set(allDates);
      expect(uniqueDates.size).toBe(30);
      
      expect(allDates[0]).toBe('2026-09-01');
      expect(allDates[29]).toBe('2026-09-30');
    });

    it('should create proper calendar grid for December 2026 (31 days)', () => {
      const { weeks, totalDays } = buildMonthGrid(2026, 12);
      
      expect(totalDays).toBe(31);
      
      const allDates = [];
      weeks.forEach(week => {
        week.forEach(day => {
          if (day) allDates.push(day);
        });
      });
      
      expect(allDates.length).toBe(31);
      
      const uniqueDates = new Set(allDates);
      expect(uniqueDates.size).toBe(31);
      
      expect(allDates[0]).toBe('2026-12-01');
      expect(allDates[30]).toBe('2026-12-31');
    });

    it('should have correct weekday alignment (Sun-Sat rows)', () => {
      const { weeks } = buildMonthGrid(2026, 1);
      
      // Jan 1, 2026 is Thursday, should be at index 4
      expect(weeks[0][4]).toBe('2026-01-01');
      
      // Days before should be null
      expect(weeks[0][0]).toBeNull();
      expect(weeks[0][1]).toBeNull();
      expect(weeks[0][2]).toBeNull();
      expect(weeks[0][3]).toBeNull();
      
      weeks.forEach(week => {
        expect(week.length).toBe(7);
      });
    });

    it('should not have any fake activity in blank cells', () => {
      const { weeks } = buildMonthGrid(2026, 1);
      
      weeks.forEach(week => {
        week.forEach(day => {
          if (day === null) {
            expect(day).toBeNull();
          } else {
            expect(typeof day).toBe('string');
            expect(day).toMatch(/^\d{4}-\d{2}-\d{2}$/);
          }
        });
      });
    });
  });

  describe('shiftMonth', () => {
    it('should navigate to previous month correctly', () => {
      const prev = shiftMonth(2026, 1, -1);
      expect(prev.year).toBe(2025);
      expect(prev.month).toBe(12);
    });

    it('should navigate to next month correctly', () => {
      const next = shiftMonth(2026, 12, 1);
      expect(next.year).toBe(2027);
      expect(next.month).toBe(1);
    });

    it('should handle middle month navigation', () => {
      const next = shiftMonth(2026, 5, 1);
      expect(next.year).toBe(2026);
      expect(next.month).toBe(6);
    });
  });

  describe('formatMonthTitle', () => {
    it('should format month title correctly', () => {
      expect(formatMonthTitle(2026, 1)).toBe('January 2026');
      expect(formatMonthTitle(2026, 9)).toBe('September 2026');
      expect(formatMonthTitle(2025, 12)).toBe('December 2025');
    });
  });

  describe('toCountMap', () => {
    it('should convert array heatmap to count map', () => {
      const heatmap = [
        { date: '2026-01-01', count: 5 },
        { date: '2026-01-02', count: 3 },
        { date: '2026-01-01', count: 2 },
      ];
      
      const result = toCountMap(heatmap);
      expect(result['2026-01-01']).toBe(7);
      expect(result['2026-01-02']).toBe(3);
    });

    it('should convert object heatmap to count map', () => {
      const heatmap = {
        '2026-01-01': { count: 5 },
        '2026-01-02': { count: 3 },
      };
      
      const result = toCountMap(heatmap);
      expect(result['2026-01-01']).toBe(5);
      expect(result['2026-01-02']).toBe(3);
    });

    it('should handle empty heatmap', () => {
      expect(toCountMap(null)).toEqual({});
      expect(toCountMap(undefined)).toEqual({});
      expect(toCountMap({})).toEqual({});
    });
  });

  describe('intensityForCount', () => {
    it('should return correct intensity levels', () => {
      expect(intensityForCount(0)).toBe(0);
      expect(intensityForCount(1)).toBe(1);
      expect(intensityForCount(2)).toBe(2);
      expect(intensityForCount(3)).toBe(2);
      expect(intensityForCount(4)).toBe(3);
      expect(intensityForCount(5)).toBe(3);
      expect(intensityForCount(6)).toBe(4);
      expect(intensityForCount(10)).toBe(4);
    });
  });
});