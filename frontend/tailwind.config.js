/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#f0f4ff',
          100: '#dbe4ff',
          200: '#bac8ff',
          300: '#91a7ff',
          400: '#748ffc',
          500: '#5c7cfa',
          600: '#4c6ef5',
          700: '#4263eb',
          800: '#3b5bdb',
          900: '#364fc7',
        },
        surface: {
          0: '#ffffff',
          1: '#f8f9fc',
          2: '#f1f3f9',
          3: '#e8ecf4',
          4: '#dde2ee',
        },
        ink: {
          0: '#1a1d2d',
          1: '#2e3247',
          2: '#4a4f69',
          3: '#6b7194',
          4: '#9499b3',
        },
        accent: {
          rose: '#f43f5e',
          amber: '#f59e0b',
          emerald: '#10b981',
          sky: '#0ea5e9',
          violet: '#8b5cf6',
        },
      },
      fontFamily: {
        display: ['"DM Sans"', 'system-ui', 'sans-serif'],
        body: ['"Source Sans 3"', 'system-ui', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'monospace'],
      },
      boxShadow: {
        'card': '0 1px 3px rgba(26,29,45,0.04), 0 4px 14px rgba(26,29,45,0.06)',
        'card-hover': '0 2px 8px rgba(26,29,45,0.06), 0 8px 24px rgba(26,29,45,0.1)',
        'modal': '0 8px 40px rgba(26,29,45,0.12), 0 2px 8px rgba(26,29,45,0.06)',
      },
      borderRadius: {
        '2xl': '1rem',
        '3xl': '1.25rem',
      },
      animation: {
        'fade-in': 'fadeIn 0.4s ease-out',
        'slide-up': 'slideUp 0.4s ease-out',
        'slide-in-right': 'slideInRight 0.3s ease-out',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(12px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        slideInRight: {
          '0%': { opacity: '0', transform: 'translateX(16px)' },
          '100%': { opacity: '1', transform: 'translateX(0)' },
        },
      },
    },
  },
  plugins: [],
}
