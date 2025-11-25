# labelmap-polydata

Convert vtk.js labelmap ImageData to PolyData meshes using marching cubes.

## Installation

```bash
npm install labelmap-polydata
```

Requires `@kitware/vtk.js` as a peer dependency.

## Usage

```typescript
import vtkImageData from "@kitware/vtk.js/Common/DataModel/ImageData";
import { labelmapToPolyDatas } from "labelmap-polydata";

// Create or load a labelmap ImageData where voxel values
// represent segment IDs (0 = background)
const labelmap: vtkImageData = /* your labelmap */;

// Convert to polydata meshes
const polyDatas = await labelmapToPolyDatas(labelmap);

// Result is a record mapping segment values to vtkPolyData
for (const [segmentValue, polyData] of Object.entries(polyDatas)) {
  console.log(`Segment ${segmentValue}: ${polyData.getNumberOfPoints()} points`);
}
```

## Options

```typescript
const polyDatas = await labelmapToPolyDatas(labelmap, {
  useWorker: true, // Run marching cubes in a web worker
  segments: [1, 2, 3], // Process specific segment values (default: all non-zero)
});
```

## License

MIT
