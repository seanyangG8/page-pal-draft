/**
 * Haptic feedback utilities for mobile devices
 * Uses the Vibration API where available
 */

type HapticStyle = 'light' | 'medium' | 'heavy' | 'success' | 'warning' | 'error' | 'selection';

const hapticPatterns: Record<HapticStyle, number | number[]> = {
  light: 10,
  medium: 25,
  heavy: 50,
  success: [10, 50, 10],
  warning: [30, 50, 30],
  error: [50, 100, 50],
  selection: 5,
};

export function triggerHaptic(style: HapticStyle = 'light'): void {
  if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
    const pattern = hapticPatterns[style];
    navigator.vibrate(pattern);
  }
}

export function useHaptic() {
  const haptic = (style: HapticStyle = 'light') => {
    triggerHaptic(style);
  };

  return {
    haptic,
    light: () => haptic('light'),
    medium: () => haptic('medium'),
    heavy: () => haptic('heavy'),
    success: () => haptic('success'),
    warning: () => haptic('warning'),
    error: () => haptic('error'),
    selection: () => haptic('selection'),
  };
}
