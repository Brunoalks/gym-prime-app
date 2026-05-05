const tokenColor = (token) => `rgb(var(${token}) / <alpha-value>)`;

/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Poppins', 'sans-serif'],
      },
      colors: {
        gp: {
          bg: {
            main: tokenColor('--gp-bg-main-rgb'),
            panel: tokenColor('--gp-bg-panel-rgb'),
            card: tokenColor('--gp-bg-card-rgb'),
            field: tokenColor('--gp-bg-field-rgb'),
          },
          border: {
            DEFAULT: 'var(--gp-border)',
            inverse: 'var(--gp-border-inverse)',
          },
          text: {
            primary: tokenColor('--gp-text-primary-rgb'),
            secondary: tokenColor('--gp-text-secondary-rgb'),
            muted: tokenColor('--gp-text-muted-rgb'),
            inverse: tokenColor('--gp-text-inverse-rgb'),
          },
          lime: tokenColor('--gp-lime-rgb'),
          'lime-soft': 'var(--gp-lime-soft)',
          danger: tokenColor('--gp-danger-rgb'),
          'danger-soft': 'var(--gp-danger-soft)',
          warning: tokenColor('--gp-warning-rgb'),
          'warning-soft': 'var(--gp-warning-soft)',
          success: tokenColor('--gp-success-rgb'),
          'success-soft': 'var(--gp-success-soft)',
        },
        gymGreen: '#10B981',
        gymPurple: '#8A2BE2',
        gymDark: '#111827',
      },
      borderRadius: {
        gp: 'var(--gp-radius)',
        'gp-sm': 'var(--gp-radius-sm)',
        'gp-lg': 'var(--gp-radius-lg)',
        'gp-pill': 'var(--gp-radius-pill)',
      },
      boxShadow: {
        'gp-sm': 'var(--gp-shadow-sm)',
        'gp-card': 'var(--gp-shadow-card)',
        'gp-panel': 'var(--gp-shadow-panel)',
        'gp-modal': 'var(--gp-shadow-modal)',
        'gp-glow': 'var(--gp-shadow-glow)',
      },
      fontSize: {
        'gp-xs': ['var(--gp-font-xs)', { lineHeight: 'var(--gp-line-normal)' }],
        'gp-sm': ['var(--gp-font-sm)', { lineHeight: 'var(--gp-line-normal)' }],
        'gp-base': ['var(--gp-font-base)', { lineHeight: 'var(--gp-line-normal)' }],
        'gp-lg': ['var(--gp-font-lg)', { lineHeight: 'var(--gp-line-normal)' }],
        'gp-xl': ['var(--gp-font-xl)', { lineHeight: 'var(--gp-line-tight)' }],
        'gp-2xl': ['var(--gp-font-2xl)', { lineHeight: 'var(--gp-line-tight)' }],
        'gp-3xl': ['var(--gp-font-3xl)', { lineHeight: 'var(--gp-line-tight)' }],
        'gp-4xl': ['var(--gp-font-4xl)', { lineHeight: 'var(--gp-line-tight)' }],
      },
      fontWeight: {
        'gp-regular': 'var(--gp-weight-regular)',
        'gp-medium': 'var(--gp-weight-medium)',
        'gp-bold': 'var(--gp-weight-bold)',
        'gp-black': 'var(--gp-weight-black)',
      },
      spacing: {
        'gp-1': 'var(--gp-space-1)',
        'gp-2': 'var(--gp-space-2)',
        'gp-3': 'var(--gp-space-3)',
        'gp-4': 'var(--gp-space-4)',
        'gp-5': 'var(--gp-space-5)',
        'gp-6': 'var(--gp-space-6)',
        'gp-7': 'var(--gp-space-7)',
        'gp-8': 'var(--gp-space-8)',
      },
    },
  },
  plugins: [],
}
