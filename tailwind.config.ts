import type { Config } from 'tailwindcss'

const config: Config = {
  content: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}', './lib/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        bg: '#07090B',
        panel: '#0D1216',
        panel2: '#131A21',
        line: '#1D2830',
        ink: '#E8F0F2',
        muted: '#7A8B94',
        neon: '#00E5A0',
        danger: '#FF4D5E',
        amber: '#FFB020',
        azure: '#3EA6FF',
        violet: '#8B5CF6',
      },
      fontFamily: {
        sans: ['var(--font-inter)', 'system-ui', 'sans-serif'],
        display: ['var(--font-chakra)', 'var(--font-inter)', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
export default config
