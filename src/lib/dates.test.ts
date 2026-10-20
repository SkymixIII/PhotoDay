import { dayKey, monthKey, monthRange, previousMonth } from './dates';

describe('dates', () => {
  it('formats local days and months', () => {
    expect(dayKey(new Date(2026, 0, 5))).toBe('2026-01-05');
    expect(monthKey(new Date(2026, 11, 31))).toBe('2026-12');
  });

  it('computes month ranges, including leap years', () => {
    expect(monthRange('2028-02')).toEqual({ from: '2028-02-01', to: '2028-02-29' });
    expect(monthRange('2026-04')).toEqual({ from: '2026-04-01', to: '2026-04-30' });
  });

  it('steps back across years', () => {
    expect(previousMonth('2026-01')).toBe('2025-12');
  });
});
