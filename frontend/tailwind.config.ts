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
        sans: ['"Inter"', 'ui-sans-serif', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
        heading: ['"Special Gothic Expanded One"', 'ui-sans-serif', 'system-ui', 'sans-serif'],
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

      animation: {
        'float-slow': 'float 8s ease-in-out infinite',
        'float-reverse': 'float-reverse 9s ease-in-out infinite',
        'float-subtle': 'float-subtle 12s ease-in-out infinite',
        'pulse-glow': 'pulse-glow 6s ease-in-out infinite',
        'spin-very-slow': 'spin 45s linear infinite',
        'spin-reverse-slow': 'spin-reverse 50s linear infinite',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-12px)' },
        },
        'float-reverse': {
          '0%, 100%': { transform: 'translateY(0px) rotate(0deg)' },
          '50%': { transform: 'translateY(10px) rotate(1.2deg)' },
        },
        'float-subtle': {
          '0%, 100%': { transform: 'translate(0px, 0px)' },
          '50%': { transform: 'translate(-6px, 8px)' },
        },
        'pulse-glow': {
          '0%, 100%': { opacity: '0.45', transform: 'scale(1)' },
          '50%': { opacity: '0.8', transform: 'scale(1.06)' },
        },
        'spin-reverse': {
          '0%': { transform: 'rotate(360deg)' },
          '100%': { transform: 'rotate(0deg)' },
        },
      },
    },
  },
  plugins: [],
};

export default config;
