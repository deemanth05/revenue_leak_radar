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
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'monospace'],
      },
      fontSize: {
        '2xs': ['10px', { lineHeight: '14px' }],
        xs: ['11px', { lineHeight: '16px' }],
        sm: ['13px', { lineHeight: '20px' }],
        base: ['14px', { lineHeight: '22px' }],
        lg: ['16px', { lineHeight: '24px' }],
        xl: ['18px', { lineHeight: '28px' }],
        '2xl': ['20px', { lineHeight: '32px' }],
        '3xl': ['24px', { lineHeight: '36px' }],
        '4xl': ['30px', { lineHeight: '42px' }],
      },
      spacing: {
        sidebar: '240px',
        header: '56px',
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'fade-in': 'fadeIn 0.2s ease-out',
        'slide-in': 'slideIn 0.2s ease-out',
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
      },
      borderRadius: {
        sm: '4px',
        DEFAULT: '6px',
        md: '8px',
        lg: '10px',
        xl: '14px',
      },
      boxShadow: {
        card: '0 1px 3px rgba(0, 0, 0, 0.4), 0 1px 2px rgba(0, 0, 0, 0.6)',
        'card-hover': '0 4px 12px rgba(0, 0, 0, 0.5)',
        danger: '0 0 0 1px rgba(239, 68, 68, 0.3)',
        primary: '0 0 0 1px rgba(37, 99, 235, 0.3)',
      },
    },
  },
  plugins: [],
};

export default config;
