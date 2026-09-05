/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        // Single-typeface system: Inter everywhere. Hierarchy comes from
        // size, weight and letter-spacing — not from swapping fonts.
        sans: ['Inter', 'system-ui', 'sans-serif'],
        display: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['Inter', 'system-ui', 'sans-serif'],
      },
      colors: {
        // Cool paper & ink — the base surfaces
        paper: {
          DEFAULT: '#F5F6F8',
          deep: '#EAECF0',
        },
        line: '#D6DAE1',
        // Accent — oxford navy (collegiate, restrained)
        brand: {
          50: '#EEF2F8',
          100: '#DCE4F0',
          200: '#BCCAE0',
          300: '#93A9C9',
          400: '#5F7FA9',
          500: '#3D6394',
          600: '#2C4E7E',
          700: '#24406B',
          800: '#1B3254',
          900: '#14253F',
          950: '#0E1A2E',
        },
        // Brass — the single secondary highlight, used sparingly
        brass: {
          300: '#C4A94D',
          400: '#A8842C',
          500: '#8F6F24',
          600: '#77611F',
          tint: '#F2EAD3',
        },
        // Warm warning / destructive accents
        clay: {
          DEFAULT: '#B4540A',
          tint: '#F4E8D8',
        },
        wine: {
          DEFAULT: '#9C3D3D',
          tint: '#F3E1E1',
        },
        // Re-tint Tailwind's slate scale to cool greys so every existing
        // bg-slate-* / text-slate-* class picks up the navy-paper feel.
        slate: {
          50: '#F7F8FA',
          100: '#EEF0F3',
          200: '#DFE2E8',
          300: '#C8CDD6',
          400: '#9299A6',
          500: '#6A7180',
          600: '#525866',
          700: '#3D4350',
          800: '#282D37',
          900: '#1A1D24',
          950: '#12141A',
        },
      },
      borderRadius: {
        none: '0',
        sm: '2px',
        DEFAULT: '3px',
        md: '5px',
        lg: '7px',
        xl: '9px',
        '2xl': '11px',
        full: '9999px',
      },
    },
  },
  plugins: [],
};
