import type { Config } from "tailwindcss";
const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: { extend: { colors: { wine: "#501c2b", ink: "#302328", cream: "#fff6eb", rose: "#e8b4b3" }, fontFamily: { sans: ["var(--font-sans)", "sans-serif"], display: ["var(--font-display)", "serif"] } } },
  plugins: [],
};
export default config;
