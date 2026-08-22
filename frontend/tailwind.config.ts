import type { Config } from 'tailwindcss';

// Phase 5 will expand this with the full token set from docs/DESIGN-SYSTEM.md.
// For now this is the minimal config needed to confirm Tailwind is wired up.
const config: Config = {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      // Placeholder — full design system tokens added in Phase 5
    },
  },
  plugins: [],
};

export default config;
