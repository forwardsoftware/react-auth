import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  test: {
    environment: "jsdom",
    globals: true,
    include: ["**/*.{test,spec}.{js,jsx,ts,tsx}"],
    coverage: {
      reporter: ["clover", "lcov", "html"],
      include: ["src/**/*.{js,jsx,ts,tsx}"],
      exclude: ["**/*.d.ts"],
    },
  },
});
