/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Theme 1: Minimalist White & Charcoal (Dominant)
        primary: {
          DEFAULT: '#222222', // Charcoal
          50: '#f6f6f6',
          100: '#e7e7e7',
          200: '#d1d1d1',
          300: '#b0b0b0',
          400: '#888888',
          500: '#6d6d6d',
          600: '#5d5d5d',
          700: '#4f4f4f',
          800: '#454545',
          900: '#3d3d3d',
          950: '#222222', 
        },
        // Theme 5: Midnight Navy & Electric Blue (Secondary/Accent)
        accent: {
          DEFAULT: '#2563EB', // Electric Blue
          hover: '#1D4ED8',   // Darker blue for active states
          light: '#DBEAFE',   // Light blue for subtle backgrounds
        },
        navy: {
          DEFAULT: '#0F172A', // Midnight Navy
          light: '#1E293B',
        },
        surface: {
          DEFAULT: '#FFFFFF', // Clean White
          muted: '#F8FAFC',   // Off-white for section backgrounds
          border: '#E2E8F0',  // Light border color
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'], // Premium typography
      },
      boxShadow: {
        'card': '0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -1px rgba(0, 0, 0, 0.03)',
        'card-hover': '0 10px 15px -3px rgba(0, 0, 0, 0.08), 0 4px 6px -2px rgba(0, 0, 0, 0.04)',
      }
    },
  },
  plugins: [],
}