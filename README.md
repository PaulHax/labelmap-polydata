# labelmap-polydata

Convert vtk.js labelmap ImageData to PolyData meshes using marching cubes.

## Installation

```bash
npm install labelmap-polydata
```

Requires `@kitware/vtk.js` as a peer dependency.

## Usage

```typescript
import { labelmapToPolyDatas } from "labelmap-polydata/labelmapToPolyDatas";

// Create or load a labelmap ImageData where voxel values
// represent segment IDs (0 = background)
const labelmap: vtkImageData = /* your labelmap */;

// Convert to polydata meshes (runs on main thread)
const polyDatas = await labelmapToPolyDatas(labelmap);

// Result is a record mapping segment values to vtkPolyData
for (const [segmentValue, polyData] of Object.entries(polyDatas)) {
  console.log(`Segment ${segmentValue}: ${polyData.getNumberOfPoints()} points`);
}
```

## Web Worker Support

For non-blocking conversion, create a local worker file in your project. This lets your bundler resolve vtk.js, so you control the version.

**1. Create a worker file in your project:**

```typescript
// src/workers/labelmapWorker.ts
import { coreLabelmapToPolyDatas } from "labelmap-polydata/labelmapToPolyDatas";
import {
  deserializeImageData,
  serializePolyData,
  type serializeImageData,
} from "labelmap-polydata/serializeVtk";

type WorkerMessage = {
  imageDataSerialized: ReturnType<typeof serializeImageData>;
  options: { segments?: number[] };
};

self.onmessage = (e: MessageEvent<WorkerMessage>) => {
  const { imageDataSerialized, options } = e.data;
  const imageData = deserializeImageData(imageDataSerialized);
  const polyDatas = coreLabelmapToPolyDatas(imageData, options);

  const result: Record<number, ReturnType<typeof serializePolyData>> = {};
  const transferables: ArrayBuffer[] = [];

  for (const [value, polyData] of Object.entries(polyDatas)) {
    const serialized = serializePolyData(polyData);
    result[Number(value)] = serialized;
    transferables.push(
      serialized.points.buffer as ArrayBuffer,
      serialized.polys.buffer as ArrayBuffer
    );
    if (serialized.normals) {
      transferables.push(serialized.normals.buffer as ArrayBuffer);
    }
  }

  self.postMessage({ result }, transferables);
};
```

**2. Use the worker:**

```typescript
import { labelmapToPolyDatas } from "labelmap-polydata/labelmapToPolyDatas";
import LabelmapWorker from "./workers/labelmapWorker?worker";

const worker = new LabelmapWorker();

const polyDatas = await labelmapToPolyDatas(labelmap, { worker });

worker.terminate();
```

## Options

```typescript
import { labelmapToPolyDatas } from "labelmap-polydata/labelmapToPolyDatas";

const polyDatas = await labelmapToPolyDatas(labelmap, {
  worker: myWorker, // Worker instance for non-blocking execution
  segments: [1, 2, 3], // Process specific segment values (default: all non-zero)
});
```

## World Space Alignment

The marching cubes algorithm outputs polydata in scaled index space (origin + index × spacing) but does not apply the image's direction matrix. For images with non-identity direction (oblique/rotated scans), apply the direction matrix to align the mesh with world space:

```typescript
import vtkMatrixBuilder from "@kitware/vtk.js/Common/Core/MatrixBuilder";

function buildDirectionMatrix(imageData: vtkImageData): Float64Array {
  const origin = imageData.getOrigin();
  const direction = imageData.getDirection();

  // Rotate around origin: T(origin) × R(direction) × T(-origin)
  return vtkMatrixBuilder
    .buildFromRadian()
    .translate(origin[0], origin[1], origin[2])
    .multiply3x3(direction)
    .translate(-origin[0], -origin[1], -origin[2])
    .getMatrix();
}

// Apply to actor
const directionMatrix = buildDirectionMatrix(labelmap);
actor.setUserMatrix(directionMatrix);
```

## License

MIT
