/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        brand: {
          darkest:  "#212A31", // deepest background, sidebar
          dark:     "#2E3944", // card backgrounds, secondary surfaces
          primary:  "#124E66", // CTAs, active states, links
          muted:    "#748D92", // subtext, borders, disabled
          light:    "#D3D9D4", // page background, input fills
        }
      }
    }
  },
  plugins: [],
}