import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        primary: '#1563FF',
        'primary-light': '#1596FF',
        sidebar: '#1A1D23',
        'sidebar-hover': '#252930',
        error: '#EB4D4B',
        success: '#03C065',
        warning: '#F59E0B',
      },
    },
  },
  plugins: [],
};

export default config;
