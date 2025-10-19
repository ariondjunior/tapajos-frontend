module.exports = {
  // Use the dedicated PostCSS plugin for Tailwind
  plugins: [
    require('@tailwindcss/postcss'),
    require('autoprefixer'),
  ],
}
