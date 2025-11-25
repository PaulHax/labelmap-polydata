import { defineConfig } from 'tsup'

export default defineConfig({
  entry: ['src/*.ts', '!src/vtk.d.ts'],
  format: ['esm'],
  dts: true,
  clean: true,
  external: [/@kitware\/vtk\.js/],
})
