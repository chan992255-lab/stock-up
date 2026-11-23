/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: [
          'Pretendard',
          'Pretendard Variable',
          '-apple-system',
          'BlinkMacSystemFont',
          'system-ui',
          'Apple SD Gothic Neo',
          'Malgun Gothic',
          'sans-serif',
        ],
      },
      colors: {
        bg: '#101014',
        surface: '#17171C',
        raised: '#1C1C22',
        line: '#222229',
        chip: '#222229',
        ink: '#F2F4F6',
        sub: '#8B95A1',
        up: '#F04452',
        down: '#3182F6',
        mint: '#00C471',
      },
      boxShadow: {
        sheet: '0 -12px 40px -18px rgba(0,0,0,0.9)',
        card: '0 1px 0 rgba(255,255,255,0.03) inset',
      },
      borderRadius: {
        '2.5xl': '1.25rem',
      },
      keyframes: {
        'fade-in': { from: { opacity: '0' }, to: { opacity: '1' } },
        'sheet-in': {
          from: { transform: 'translateY(100%)' },
          to: { transform: 'translateY(0)' },
        },
        'pop-in': {
          from: { opacity: '0', transform: 'translateY(10px) scale(0.98)' },
          to: { opacity: '1', transform: 'translateY(0) scale(1)' },
        },
        'toast-in': {
          from: { opacity: '0', transform: 'translateY(14px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
        'pulse-soft': {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.35' },
        },
      },
      animation: {
        'fade-in': 'fade-in 160ms ease-out',
        'sheet-in': 'sheet-in 260ms cubic-bezier(0.22, 1, 0.36, 1)',
        'pop-in': 'pop-in 220ms cubic-bezier(0.22, 1, 0.36, 1)',
        'toast-in': 'toast-in 200ms cubic-bezier(0.22, 1, 0.36, 1)',
        'pulse-soft': 'pulse-soft 1.4s ease-in-out infinite',
      },
    },
  },
  plugins: [],
};
