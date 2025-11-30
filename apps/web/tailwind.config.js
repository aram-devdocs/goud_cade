/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    '../../packages/ui/src/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        arcade: {
          green: '#00ff88',
          pink: '#ff00ff',
          cyan: '#00ffff',
          yellow: '#ffff00',
        },
      },
      fontFamily: {
        arcade: ['"Press Start 2P"', 'monospace'],
      },
      screens: {
        // Orientation-based media queries
        portrait: { raw: '(max-aspect-ratio: 1/1)' },
        landscape: { raw: '(min-aspect-ratio: 1/1)' },
        // Combined device + orientation queries
        'mobile-portrait': { raw: '(max-aspect-ratio: 1/1) and (max-width: 640px)' },
        'mobile-landscape': { raw: '(min-aspect-ratio: 1/1) and (max-height: 500px)' },
        'tablet-portrait': { raw: '(max-aspect-ratio: 1/1) and (min-width: 641px) and (max-width: 1024px)' },
      },
      spacing: {
        'safe-top': 'var(--safe-area-top)',
        'safe-bottom': 'var(--safe-area-bottom)',
        'safe-left': 'var(--safe-area-left)',
        'safe-right': 'var(--safe-area-right)',
      },
      height: {
        'game-area': 'var(--game-area-height)',
        'game-area-safe': 'var(--game-area-height-with-safe)',
        'control-area': 'var(--control-area-height)',
      },
    },
  },
  plugins: [],
};

