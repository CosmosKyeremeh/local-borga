// local-borga/web-client/tailwind.config.ts

import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // --- CUSTOM COLORS
        'yellow': { // Used for the Fresh Goods (Retail) section
          500: '#FFD700', // Gold Primary Accent
          600: '#E6C200', // Gold for hover/buttons
        },
        'green': { // Used for the Custom Milling (Service) section
          700: '#004d40', // Dark Teal/Blue-Black for Service Primary
        },
        'blue': { // Used for the Shipping Banner
          900: '#1a202c', // Very dark blue/charcoal for the banner background
        },
      },
    },
  },
  plugins: [],
}
export default config