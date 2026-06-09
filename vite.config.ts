import { defineConfig } from "vite";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  plugins: [tailwindcss()],
  root: "src",
  base: "/FHood/",
  build: {
    outDir: "../dist",
  },
});