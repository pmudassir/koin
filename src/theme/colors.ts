// Option C: Frost + Violet — the selected palette
// Primary: #7C3AED (violet), Canvas: #F5F4FF (violet-tinted white)

export const Colors = {
  // ─── Brand ───────────────────────────────────────────
  primary: '#7C3AED',
  primarySoft: 'rgba(124, 58, 237, 0.08)',
  primaryMedium: 'rgba(124, 58, 237, 0.15)',
  primaryStrong: 'rgba(124, 58, 237, 0.25)',

  // ─── Surfaces ────────────────────────────────────────
  canvas: '#F5F4FF',       // page background — violet tinted
  surface: '#FFFFFF',      // cards, list items
  elevated: '#FFFFFF',     // modals (with elevation2 shadow)

  // ─── Text ────────────────────────────────────────────
  textPrimary: '#1E1B4B',    // indigo-950 — amounts, headings
  textSecondary: '#4C4980',  // indigo-700 — labels, timestamps
  textTertiary: '#9896C8',   // indigo-400 — hints, placeholders
  textOnPrimary: '#FFFFFF',  // on primary-colored surfaces

  // ─── Borders ─────────────────────────────────────────
  borderSubtle: '#EDE9FE',   // violet-100 — card dividers
  borderMedium: '#DDD6FE',   // violet-200 — input borders

  // ─── Semantic ────────────────────────────────────────
  income: '#059669',         // emerald-600
  incomeBg: '#D1FAE5',       // emerald-100
  expense: '#DC2626',        // red-600
  expenseBg: '#FEE2E2',      // red-100
  warning: '#D97706',        // amber-600
  warningBg: '#FEF3C7',      // amber-100

  // ─── Category Colors (light theme) ───────────────────
  // bg = Tailwind 100-shade, icon = Tailwind 600-shade
  food: { bg: '#FFEDD5', icon: '#EA580C' },        // orange
  transport: { bg: '#DBEAFE', icon: '#2563EB' },   // blue
  shopping: { bg: '#F3E8FF', icon: '#9333EA' },    // purple
  bills: { bg: '#DCFCE7', icon: '#16A34A' },       // green
  health: { bg: '#FEE2E2', icon: '#DC2626' },      // red
  entertainment: { bg: '#FDF4FF', icon: '#C026D3' }, // fuchsia
  fuel: { bg: '#D1FAE5', icon: '#059669' },        // emerald
  coffee: { bg: '#FDF2F8', icon: '#DB2777' },      // pink
  groceries: { bg: '#FEF9C3', icon: '#CA8A04' },   // yellow
  rent: { bg: '#E0F2FE', icon: '#0284C7' },        // sky
  pharmacy: { bg: '#FFF7ED', icon: '#EA580C' },    // amber-tinted
  other: { bg: '#F1F5F9', icon: '#64748B' },       // slate

  // ─── Elevation shadows (light theme) ─────────────────
  // Use these as shadowColor with the elevation system
  shadowColor: '#1E1B4B',
  shadowBrand: '#7C3AED',

  // ─── Legacy / compat ─────────────────────────────────
  // Keep these so existing screens don't break during migration
  backgroundDark: '#F5F4FF',   // remapped to canvas
  backgroundLight: '#FFFFFF',  // remapped to surface
  slate100: '#F5F4FF',
  slate200: '#EDE9FE',
  slate300: '#DDD6FE',
  slate400: '#9896C8',
  slate500: '#6B6BAD',
  slate600: '#4C4980',
  slate700: '#3B3880',
  slate800: '#2D2B6B',
  slate800Half: 'rgba(30, 27, 75, 0.5)',
  slate900: '#1E1B4B',

  // Keep old category format so existing CategoryIcon doesn't break
  amber: { bg: '#FEF3C7', text: '#F59E0B', icon: '#D97706' },
  blue: { bg: '#DBEAFE', text: '#60A5FA', icon: '#2563EB' },
  green: { bg: '#DCFCE7', text: '#4ADE80', icon: '#16A34A' },
  purple: { bg: '#F3E8FF', text: '#C084FC', icon: '#9333EA' },
  pink: { bg: '#FCE7F3', text: '#F472B6', icon: '#DB2777' },
  orange: { bg: '#FFEDD5', text: '#FB923C', icon: '#EA580C' },
  cyan: { bg: '#CFFAFE', text: '#22D3EE', icon: '#0891B2' },
  emerald: { bg: '#D1FAE5', text: '#34D399', icon: '#059669' },
  red: { bg: '#FEE2E2', text: '#F87171', icon: '#DC2626' },

  white: '#FFFFFF',
  black: '#000000',
  transparent: 'transparent',
} as const;

// ─── Elevation system ─────────────────────────────────
export const Elevation = {
  // Flat — no shadow
  elevation0: {},

  // Subtle lift — list items, chips
  elevation1: {
    shadowColor: Colors.shadowColor,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 3,
    elevation: 2,
  },

  // Card — budget cards, summary cards
  elevation2: {
    shadowColor: Colors.shadowColor,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
  },

  // Floating — modals, bottom sheets
  elevation3: {
    shadowColor: Colors.shadowColor,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.12,
    shadowRadius: 24,
    elevation: 8,
  },

  // Brand accent — FAB, primary buttons
  elevationBrand: {
    shadowColor: Colors.shadowBrand,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 16,
    elevation: 8,
  },
} as const;
