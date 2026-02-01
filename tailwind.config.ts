import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}", // <--- ADD THIS LINE
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      // ... keep existing theme settings
    },
  },
  plugins: [
    require('@tailwindcss/typography'), // Ensure you have this if using 'prose'
  ],
};
export default config;