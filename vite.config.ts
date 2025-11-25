import { defineConfig } from "vite";

export default defineConfig({
  build: {
    lib: {
      entry: "src/labelmapToPolyDatas.ts",
      formats: ["es"],
      fileName: "labelmap-polydata",
    },
    rollupOptions: {
      external: [/@kitware\/vtk\.js/],
    },
  },
});
