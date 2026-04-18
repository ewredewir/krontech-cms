import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        primary: '#1563FF',
        'primary-light': '#1596FF',
        body: '#F5F6F8',
        heading: '#333333',
        'secondary-text': '#4D5154',
        footer: '#000000',
        'sub-footer': '#0F1010',
        error: '#EB4D4B',
        success: '#03C065',
      },
      fontFamily: {
        sans: ['Roboto', 'sans-serif'],
      },
      fontSize: {
        nav: ['16px', { fontWeight: '500' }],
        'nav-sm': ['14px', { fontWeight: '500' }],
        body: ['14px', { lineHeight: '27px' }],
        lead: ['16px', { lineHeight: '27px' }],
        h1: ['32px', { fontWeight: '600' }],
        h2: ['40px', { fontWeight: '500' }],
        h3: ['32px', { fontWeight: '700' }],
        'h3-title': ['24px', { fontWeight: '500' }],
        h4: ['24px', { lineHeight: '36px' }],
        h5: ['24px', {}],
      },
      screens: {
        nav: '1100px',
      },
      boxShadow: {
        card: 'rgba(37,38,41,0.12) 0px 6px 12px -4px',
      },
      backgroundImage: {
        'primary-gradient': 'linear-gradient(#1596FF 0%, #1563FF 100%)',
      },
    },
  },
  plugins: [],
};

export default config;
