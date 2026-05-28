import type { Config } from 'tailwindcss';

const config: Config = {
  darkMode: ['class'],
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // Enterprise dark theme palette
        background: {
          DEFAULT: '#0A0F1E',
          secondary: '#0D1526',
          tertiary: '#111827',
        },
        surface: {
          DEFAULT: '#111827',
          elevated: '#1A2335',
          border: '#1E2D45',
        },
        primary: {
          DEFAULT: '#2563EB',
          hover: '#1D4ED8',
          muted: '#1E3A6E',
          foreground: '#FFFFFF',
        },
        danger: {
          DEFAULT: '#EF4444',
          hover: '#DC2626',
          muted: '#450A0A',
          foreground: '#FFFFFF',
        },
        warning: {
          DEFAULT: '#F59E0B',
          hover: '#D97706',
          muted: '#451A03',
          foreground: '#FFFFFF',
        },
        success: {
          DEFAULT: '#10B981',
          hover: '#059669',
          muted: '#022C22',
          foreground: '#FFFFFF',
        },
        revenue: {
          DEFAULT: '#8B5CF6',
          hover: '#7C3AED',
          muted: '#2E1065',
        },
        coral: {
          DEFAULT: '#06B6D4',
          hover: '#0891B2',
          muted: '#0A2535',
        },
        text: {
          primary: '#F1F5F9',
          secondary: '#94A3B8',
          muted: '#475569',
          accent: '#2563EB',
        },
        border: {
          DEFAULT: '#1E2D45',
          muted: '#0F172A',
          accent: '#2563EB',
        },
      },
      fontFamily: {
        sans: ['Inter', 'Outfit', 'system-ui', '-apple-system', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'monospace'],
      },
      fontSize: {
        '3xs': ['8px', { lineHeight: '12px' }],
        '2xs': ['10px', { lineHeight: '14px' }],
        xs: ['11px', { lineHeight: '16px' }],
        sm: ['13px', { lineHeight: '20px' }],
        base: ['14px', { lineHeight: '22px' }],
        lg: ['16px', { lineHeight: '24px' }],
        xl: ['18px', { lineHeight: '28px' }],
        '2xl': ['20px', { lineHeight: '32px' }],
        '3xl': ['24px', { lineHeight: '36px' }],
        '4xl': ['30px', { lineHeight: '42px' }],
        '5xl': ['36px', { lineHeight: '44px' }],
      },
      spacing: {
        sidebar: '240px',
        header: '56px',
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'fade-in': 'fadeIn 0.2s ease-out',
        'slide-in': 'slideIn 0.2s ease-out',
        'slide-up': 'slideUp 0.25s ease-out',
        'ring-pulse': 'ringPulse 2s ease-in-out infinite',
        'border-pulse': 'borderPulse 2s ease-in-out infinite',
        'shimmer': 'shimmer 2s linear infinite',
        'count-up': 'countUp 0.4s ease-out',
        'scan-line': 'scanLine 4s linear infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0', transform: 'translateY(-4px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        slideIn: {
          '0%': { opacity: '0', transform: 'translateX(-8px)' },
          '100%': { opacity: '1', transform: 'translateX(0)' },
        },
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(8px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        ringPulse: {
          '0%, 100%': { opacity: '0.3' },
          '50%': { opacity: '1' },
        },
        borderPulse: {
          '0%, 100%': { borderColor: 'rgba(239, 68, 68, 0.3)' },
          '50%': { borderColor: 'rgba(239, 68, 68, 0.8)' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
        countUp: {
          '0%': { opacity: '0', transform: 'translateY(4px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        scanLine: {
          '0%': { transform: 'translateY(-100%)' },
          '100%': { transform: 'translateY(100vh)' },
        },
      },
      borderRadius: {
        sm: '4px',
        DEFAULT: '6px',
        md: '8px',
        lg: '10px',
        xl: '14px',
        '2xl': '18px',
      },
      boxShadow: {
        card: '0 1px 3px rgba(0, 0, 0, 0.4), 0 1px 2px rgba(0, 0, 0, 0.6)',
        'card-hover': '0 4px 16px rgba(0, 0, 0, 0.5), 0 1px 4px rgba(0,0,0,0.3)',
        danger: '0 0 0 1px rgba(239, 68, 68, 0.3)',
        primary: '0 0 0 1px rgba(37, 99, 235, 0.3)',
        'glow-danger': '0 0 16px rgba(239, 68, 68, 0.25), 0 0 1px rgba(239, 68, 68, 0.5)',
        'glow-primary': '0 0 16px rgba(37, 99, 235, 0.25), 0 0 1px rgba(37, 99, 235, 0.5)',
        'glow-success': '0 0 16px rgba(16, 185, 129, 0.25), 0 0 1px rgba(16, 185, 129, 0.5)',
        'glow-warning': '0 0 16px rgba(245, 158, 11, 0.25), 0 0 1px rgba(245, 158, 11, 0.5)',
        'glow-revenue': '0 0 16px rgba(139, 92, 246, 0.25), 0 0 1px rgba(139, 92, 246, 0.5)',
        'glow-coral': '0 0 16px rgba(6, 182, 212, 0.25), 0 0 1px rgba(6, 182, 212, 0.5)',
        'inner-sm': 'inset 0 1px 3px rgba(0, 0, 0, 0.3)',
      },
    },
  },
  plugins: [],
};

export default config;
