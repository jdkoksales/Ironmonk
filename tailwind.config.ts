import type { Config } from 'tailwindcss'

// IRON MONK — tempel-designsysteem.
// Tokens behouden hun namen (bestaande classes blijven werken) maar zijn
// hergestemd naar het premium Shaolin-palet: lampzwart, antraciet-bruin,
// diep jadegroen, goud, koper en warm fakkellicht.
const config: Config = {
  content: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}', './lib/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        bg: '#0B0907', // warm lampzwart
        panel: '#161109', // donker hout/antraciet
        panel2: '#201911', // verhoogd paneel
        line: '#332917', // umber-lijn
        ink: '#F1E8D4', // rijstpapier
        muted: '#9E8E71', // vergrijsd taupe
        neon: '#D9B36A', // ★ goud — bestaande 'neon'-classes worden goud
        gold: '#D9B36A',
        copper: '#C0794E',
        danger: '#E25A48',
        amber: '#E0873A', // fakkel-oranje
        ember: '#E0873A',
        azure: '#7FB596', // jade — adem/rust
        jade: '#7FB596',
        violet: '#C0794E', // koper — XP/level (voorheen violet)
      },
      fontFamily: {
        sans: ['var(--font-inter)', 'system-ui', 'sans-serif'],
        display: ['var(--font-cinzel)', 'var(--font-inter)', 'serif'],
      },
    },
  },
  plugins: [],
}
export default config
