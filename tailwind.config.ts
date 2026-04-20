import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./src/**/*.{ts,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        bg: {
          DEFAULT: '#0b0f17',
          elevated: '#111826',
          raised: '#1a2332',
        },
        border: {
          DEFAULT: '#1f2a3d',
          strong: '#2a3a55',
        },
        text: {
          primary: '#e7ecf5',
          secondary: '#9aa7bd',
          muted: '#6b7890',
        },
        accent: {
          DEFAULT: '#3b82f6',
          hover: '#2563eb',
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
          neutral: '#6b7890',
        },
      },
      fontFamily: {
        sans: ['ui-sans-serif', 'system-ui', '-apple-system', 'Segoe UI', 'Roboto', 'sans-serif'],
        mono: ['ui-monospace', 'SFMono-Regular', 'Menlo', 'Monaco', 'monospace'],
      },
    },
  },
  plugins: [],
};

export default config;
