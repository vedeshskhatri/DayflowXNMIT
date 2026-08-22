import type { Config } from 'tailwindcss';

/**
 * Full Tailwind design system — exact token values from docs/DESIGN-SYSTEM.md.
 * No ad-hoc hex values are allowed in component files — use these tokens only.
 */
const config: Config = {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        // ── Core palette ─────────────────────────────────────────────────────
        cream: '#F3EFDF',      // Primary background — page background, card fills
        white: '#FFFFFF',      // Elevated surfaces — cards, modals, inputs

        slate: {
          brand: '#5E7892',    // Primary brand — buttons, active nav, links, focus borders
        },
        'blue-grey': '#A7B7C6', // Secondary UI — borders, dividers, inactive icons

        sage: {
          light: '#BDCFAA',   // Success/Present status, Approved badges
          deep: '#8E9E83',    // Hover states, On Leave badges, tag chips
        },

        terracotta: '#C97B63', // Absent status, Reject button, error text/border — use sparingly

        // ── Text ─────────────────────────────────────────────────────────────
        text: {
          primary: '#2E3B33',  // Main body text — dark desaturated, comfortable on cream
          muted: '#6B7A72',    // Secondary/helper text
        },
      },

      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        heading: ['"Space Grotesk"', 'ui-sans-serif', 'system-ui', 'sans-serif'],
      },

      borderRadius: {
        xl: '0.75rem',   // Cards, buttons — 12px
        '2xl': '1rem',   // Larger modals
        full: '9999px',  // Avatars, status dots
      },

      boxShadow: {
        card: '0 1px 3px 0 rgba(46, 59, 51, 0.08), 0 1px 2px -1px rgba(46, 59, 51, 0.06)',
        modal: '0 10px 25px -3px rgba(46, 59, 51, 0.12), 0 4px 6px -4px rgba(46, 59, 51, 0.08)',
      },

      maxWidth: {
        content: '80rem', // max-w-7xl equivalent
      },
    },
  },
  plugins: [],
};

export default config;
