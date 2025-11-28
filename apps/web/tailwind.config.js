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
    },
  },
  plugins: [],
};

