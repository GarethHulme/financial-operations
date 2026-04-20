import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./src/**/*.{ts,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        bg: {
          DEFAULT: '#0a1f17',
          elevated: '#0f2b1f',
          raised: '#132f22',
        },
        border: {
          DEFAULT: '#1a3d2c',
          strong: '#245a3a',
        },
        text: {
          primary: '#e7f5ef',
          secondary: '#9abda8',
          muted: '#5a8a6e',
        },
        accent: {
          DEFAULT: '#10b981',
          hover: '#059669',
        },
        severity: {
          info: '#3b82f6',
          advisory: '#f59e0b',
          warning: '#f97316',
          critical: '#ef4444',
          blocking: '#a855f7',
        },
        status: {
          ok: '#10b981',
          pending: '#f59e0b',
          error: '#ef4444',
          neutral: '#5a8a6e',
        },
      },
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui', '-apple-system', 'Segoe UI', 'Roboto', 'sans-serif'],
        mono: ['ui-monospace', 'SFMono-Regular', 'Menlo', 'Monaco', 'monospace'],
      },
    },
  },
  plugins: [],
};

export default config;
