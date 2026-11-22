export const COLORS = {
  background: '#0f172a',
  surface: '#1e293b',
  surfaceElevated: '#334155',
  border: '#334155',
  textPrimary: '#f8fafc',
  textSecondary: '#94a3b8',
  textMuted: '#64748b',
  accent: '#3b82f6',
  accentHover: '#2563eb',
  success: '#22c55e',
  warning: '#f59e0b',
  error: '#ef4444',
  overlay: 'rgba(15, 23, 42, 0.9)',
} as const;

export const SPACING = {
  xs: '0.5rem',
  sm: '0.75rem',
  md: '1rem',
  lg: '1.5rem',
  xl: '2rem',
  '2xl': '3rem',
} as const;

export const RADIUS = {
  sm: '0.375rem',
  md: '0.5rem',
  lg: '0.75rem',
  xl: '1rem',
} as const;

export const TYPOGRAPHY = {
  h1: {
    fontSize: '2.25rem',
    fontWeight: '800',
    letterSpacing: '-0.025em',
    lineHeight: '1.2',
  },
  h2: {
    fontSize: '1.875rem',
    fontWeight: '700',
    letterSpacing: '-0.025em',
    lineHeight: '1.25',
  },
  h3: {
    fontSize: '1.5rem',
    fontWeight: '600',
    lineHeight: '1.33',
  },
  h4: {
    fontSize: '1.25rem',
    fontWeight: '600',
    lineHeight: '1.4',
  },
  body: {
    fontSize: '1rem',
    lineHeight: '1.6',
  },
  small: {
    fontSize: '0.875rem',
    lineHeight: '1.5',
  },
} as const;

export const SHADOWS = {
  sm: '0 1px 2px 0 rgb(0 0 0 / 0.05)',
  md: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
  lg: '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)',
} as const;

export const FONT_FAMILY =
  '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif, "Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol"';
