module.exports = {
  content: ["./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      typography: (theme) => ({
        DEFAULT: {
          css: {
            ul: {
              paddingLeft: "2em",
              listStyleType: "disc",
            },
            ol: {
              paddingLeft: "2em",
              listStyleType: "disc",
            },
          },
        },
      }),
    },
  },
  plugins: [
    // other plugins
  ],
};
