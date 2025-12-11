import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        void: {
          black: '#09090B', // Main background
          panel: '#18181B', // Card background
          purple: '#7C3AED', // Primary
          cyan: '#06B6D4',   // Secondary
          white: '#F4F4F5',  // Text
          ink: '#000000',    // Borders
          red: '#EF4444',    // Error
          yellow: '#EAB308', // Warning
          green: '#22C55E',  // Success
        }
      },
      fontFamily: {
        sans: ['var(--font-inter)', 'sans-serif'],
        display: ['var(--font-chakra)', 'sans-serif'],
        comic: ['var(--font-bangers)', 'cursive'],
      },
      boxShadow: {
        'comic': '4px 4px 0px #000000',
        'comic-hover': '6px 6px 0px #000000',
        'comic-active': '2px 2px 0px #000000',
      },
      backgroundImage: {
        'halftone': 'radial-gradient(circle, #7C3AED 1px, transparent 1px)',
      },
      animation: {
        'fade-in': 'fadeIn 0.5s ease-in-out',
        'slide-up': 'slideUp 0.6s ease-out',
        'float': 'float 6s ease-in-out infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { transform: 'translateY(20px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-20px)' },
        },
      },
    },
  },
  plugins: [],
}
export default config
