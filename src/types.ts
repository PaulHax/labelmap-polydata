import type vtkPolyData from "@kitware/vtk.js/Common/DataModel/PolyData";

export interface LabelmapToPolyDatasOptions {
  segments?: number[];
  useWorker?: boolean;
}

export type PolyDataResult = Record<number, vtkPolyData>;

export interface SerializedImageData {
  dimensions: [number, number, number];
  spacing: [number, number, number];
  origin: [number, number, number];
  direction: Float64Array;
  scalars: Uint8Array | Uint16Array | Int16Array;
}

export interface SerializedPolyData {
  points: Float32Array;
  polys: Uint32Array;
  normals: Float32Array | null;
}
