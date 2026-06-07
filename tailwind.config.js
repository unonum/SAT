/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          50:  '#eef4ff',
          100: '#d9e6ff',
          200: '#bcd3ff',
          300: '#8eb5ff',
          400: '#598cff',
          500: '#3563ff',
          600: '#1f40f5',
          700: '#172fe1',
          800: '#1929b6',
          900: '#1b298f',
          950: '#111b6b',
        },
        accent: {
          300: '#67e8f9',
          400: '#22d3ee',
          500: '#06b6d4',
          600: '#0891b2',
        },
        violet: {
          400: '#c084fc',
          500: '#a855f7',
          600: '#9333ea',
        },
        success: '#16a34a',
        warning: '#f59e0b',
        danger:  '#ef4444',
        neon: {
          green: '#4ade80',
          blue:  '#60a5fa',
          pink:  '#f472b6',
        },
      },
      fontFamily: {
        sans:    ['Inter', 'system-ui', 'sans-serif'],
        display: ['"Plus Jakarta Sans"', 'Inter', 'sans-serif'],
        mono:    ['"JetBrains Mono"', 'monospace'],
      },
      boxShadow: {
        soft:  '0 2px 8px -2px rgba(16,24,40,0.08), 0 4px 24px -4px rgba(16,24,40,0.06)',
        card:  '0 1px 2px rgba(16,24,40,0.05), 0 4px 16px -4px rgba(16,24,40,0.08)',
        glow:  '0 0 0 1px rgba(53,99,255,0.2), 0 8px 32px -8px rgba(53,99,255,0.4)',
        'glow-lg': '0 0 0 1px rgba(53,99,255,0.25), 0 16px 48px -8px rgba(53,99,255,0.45)',
        'glow-success': '0 0 0 1px rgba(22,163,74,0.2), 0 8px 24px -8px rgba(22,163,74,0.35)',
        'glow-violet': '0 0 0 1px rgba(168,85,247,0.2), 0 8px 24px -8px rgba(168,85,247,0.35)',
        'inner-glow': 'inset 0 1px 0 rgba(255,255,255,0.1)',
      },
      backgroundImage: {
        'gradient-brand':  'linear-gradient(135deg, #3563ff 0%, #1f40f5 50%, #06b6d4 100%)',
        'gradient-warm':   'linear-gradient(135deg, #f59e0b 0%, #ef4444 100%)',
        'gradient-violet': 'linear-gradient(135deg, #a855f7 0%, #3563ff 100%)',
        'gradient-dark':   'linear-gradient(135deg, #0f172a 0%, #1e1b4b 100%)',
        'gradient-card':   'linear-gradient(145deg, rgba(255,255,255,0.06) 0%, rgba(255,255,255,0) 100%)',
      },
      borderRadius: {
        '3xl': '1.5rem',
        '4xl': '2rem',
      },
    },
  },
  plugins: [],
};
