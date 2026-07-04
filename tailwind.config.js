/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        bg: '#09090B',
        surface: '#131316',
        'surface-2': '#1C1C21',
        text: '#FAFAFA',
        muted: '#A1A1AA',
        accent: '#EF4444',
        'accent-deep': '#B91C1C',
        ember: '#F97316',
        success: '#22C55E',
        warning: '#F59E0B',
      },
      borderColor: {
        DEFAULT: 'rgba(255,255,255,0.08)',
      },
      fontFamily: {
        display: ['"Space Grotesk"', 'Inter', 'system-ui', 'sans-serif'],
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      borderRadius: {
        card: '16px',
        control: '12px',
      },
      backgroundImage: {
        ember: 'linear-gradient(135deg, #F97316 0%, #EF4444 100%)',
      },
    },
  },
  plugins: [],
};
