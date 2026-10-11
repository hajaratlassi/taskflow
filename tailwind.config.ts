import type { Config } from "tailwindcss";
export default {
  content: ["./src/**/*.{ts,tsx}"],
  theme: { extend: { colors: { paper: "#eef0ec", ink: "#1d2a28", brand: "#0f766e" } } },
  plugins: [],
} satisfies Config;
