export const Theme = {
  colors: {
    background: '#0F172A',      // Slate 900
    card: '#1E293B',            // Slate 800
    border: '#334155',          // Slate 700
    textPrimary: '#F8FAFC',     // Slate 50
    textSecondary: '#94A3B8',   // Slate 400
    primary: '#6366F1',         // Indigo 500
    primaryLight: '#818CF8',    // Indigo 400
    success: '#10B981',         // Emerald 500
    info: '#3B82F6',            // Blue 500
    warning: '#F59E0B',         // Amber 500
    danger: '#EF4444',          // Red 500
  },
  spacing: {
    xs: 4,
    sm: 8,
    md: 12,
    lg: 16,
    xl: 24,
    xxl: 32,
  },
  typography: {
    titleLarge: {
      fontSize: 24,
      fontWeight: '700' as const,
      color: '#F8FAFC',
    },
    titleMedium: {
      fontSize: 18,
      fontWeight: '600' as const,
      color: '#F8FAFC',
    },
    bodyLarge: {
      fontSize: 16,
      fontWeight: '400' as const,
      color: '#F8FAFC',
    },
    bodyMedium: {
      fontSize: 14,
      fontWeight: '400' as const,
      color: '#94A3B8',
    },
    caption: {
      fontSize: 12,
      fontWeight: '500' as const,
      color: '#94A3B8',
    },
    badge: {
      fontSize: 11,
      fontWeight: '600' as const,
      textTransform: 'uppercase' as const,
    }
  },
  shadows: {
    sm: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.2,
      shadowRadius: 1.41,
      elevation: 2,
    },
    md: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.25,
      shadowRadius: 3.84,
      elevation: 5,
    },
  }
};
