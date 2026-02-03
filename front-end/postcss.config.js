module.exports = {
  plugins: [
    // Handle CSS imports (required if using @import "tailwindcss" in v4)
    require('postcss-import'),
    // Tailwind v4 PostCSS plugin
    require('@tailwindcss/postcss'),
    // Optional autoprefixer
    require('autoprefixer'),
  ],
};
