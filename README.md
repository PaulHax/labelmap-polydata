# labelmap-polydata

Convert vtk.js labelmap ImageData to PolyData meshes using marching cubes.

## Installation

```bash
npm install labelmap-polydata
```

Requires `@kitware/vtk.js` as a peer dependency.

## Usage

```typescript
import { labelmapToPolyDatas } from "labelmap-polydata";

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

For non-blocking conversion, provide a worker instance. The consumer's bundler handles vtk.js resolution, so you control the version.

```typescript
import { labelmapToPolyDatas } from "labelmap-polydata";
import LabelmapWorker from "labelmap-polydata/worker?worker";

// Create worker (reuse for multiple calls)
const worker = new LabelmapWorker();

const polyDatas = await labelmapToPolyDatas(labelmap, { worker });

// When done, terminate the worker
worker.terminate();
```

## Options

```typescript
const polyDatas = await labelmapToPolyDatas(labelmap, {
  worker: myWorker, // Worker instance for non-blocking execution
  segments: [1, 2, 3], // Process specific segment values (default: all non-zero)
});
```

## License

MIT
