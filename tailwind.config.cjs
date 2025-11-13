module.exports = {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {},
  },
  safelist: [
    {
      pattern: /^(bg|text)-(blue|green|purple|orange)-(100|200|300|400|500|600)$/,
    },
    {
      pattern: /^(bg|text)-(amber|gray|slate)-(50|100|200|300|400|500|600|700|800)$/,
    },
  ],
  plugins: [],
}
