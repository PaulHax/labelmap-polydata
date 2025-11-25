import { defineConfig } from "vite";

export default defineConfig({
  build: {
    lib: {
      entry: {
        labelmapToPolyDatas: "src/labelmapToPolyDatas.ts",
        worker: "src/worker.ts",
      },
      formats: ["es"],
    },
    rollupOptions: {
      external: [/@kitware\/vtk\.js/],
      output: {
        preserveModules: true,
        preserveModulesRoot: "src",
        entryFileNames: "[name].js",
      },
    },
  },
});
