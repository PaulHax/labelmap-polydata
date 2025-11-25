import vtkImageData from "@kitware/vtk.js/Common/DataModel/ImageData";
import vtkDataArray from "@kitware/vtk.js/Common/Core/DataArray";
import vtkImageMarchingCubes from "@kitware/vtk.js/Filters/General/ImageMarchingCubes";
import { serializeImageData, deserializePolyData } from "./serializeVtk";
import type {
  LabelmapToPolyDatasOptions,
  PolyDataResult,
  SerializedPolyData,
} from "./types";

export type { LabelmapToPolyDatasOptions, PolyDataResult } from "./types";

function createBinaryMask(
  imageData: vtkImageData,
  segmentValue: number,
): vtkImageData {
  const scalars = imageData.getPointData().getScalars().getData() as Uint8Array;
  const binaryData = new Uint8Array(scalars.length);

  for (let i = 0; i < scalars.length; i++) {
    binaryData[i] = scalars[i] === segmentValue ? 1 : 0;
  }

  const binaryMask = vtkImageData.newInstance();
  binaryMask.setDimensions(imageData.getDimensions());
  binaryMask.setSpacing(imageData.getSpacing());
  binaryMask.setOrigin(imageData.getOrigin());
  binaryMask.setDirection(imageData.getDirection());

  const binaryScalars = vtkDataArray.newInstance({
    values: binaryData,
    numberOfComponents: 1,
  });
  binaryMask.getPointData().setScalars(binaryScalars);

  return binaryMask;
}

function getUniqueSegmentValues(
  scalars: Uint8Array | Uint16Array | Int16Array,
): number[] {
  const uniqueValues = new Set<number>();
  for (let i = 0; i < scalars.length; i++) {
    const value = scalars[i];
    if (value !== 0) {
      uniqueValues.add(value);
    }
  }
  return Array.from(uniqueValues).sort((a, b) => a - b);
}

export function coreLabelmapToPolyDatas(
  imageData: vtkImageData,
  options: LabelmapToPolyDatasOptions = {},
): PolyDataResult {
  const scalars = imageData.getPointData().getScalars().getData() as Uint8Array;
  const segments = options.segments ?? getUniqueSegmentValues(scalars);

  const result: PolyDataResult = {};

  for (const segmentValue of segments) {
    const binaryMask = createBinaryMask(imageData, segmentValue);

    const marchingCubes = vtkImageMarchingCubes.newInstance();
    marchingCubes.setInputData(binaryMask);
    marchingCubes.setContourValue(0.5);
    marchingCubes.setComputeNormals(true);
    marchingCubes.setMergePoints(true);

    const polyData = marchingCubes.getOutputData();
    if (polyData && polyData.getNumberOfPoints() > 0) {
      result[segmentValue] = polyData;
    }
  }

  return result;
}

export async function labelmapToPolyDatas(
  imageData: vtkImageData,
  options: LabelmapToPolyDatasOptions = {},
): Promise<PolyDataResult> {
  if (!options.useWorker) {
    return coreLabelmapToPolyDatas(imageData, options);
  }

  const worker = new Worker(new URL("./worker.ts", import.meta.url), {
    type: "module",
  });
  const serialized = serializeImageData(imageData);

  return new Promise((resolve, reject) => {
    worker.onmessage = (
      e: MessageEvent<{ result: Record<number, SerializedPolyData> }>,
    ) => {
      const result: PolyDataResult = {};
      for (const [value, data] of Object.entries(e.data.result)) {
        result[Number(value)] = deserializePolyData(data);
      }
      worker.terminate();
      resolve(result);
    };
    worker.onerror = (error) => {
      worker.terminate();
      reject(error);
    };
    worker.postMessage({ imageDataSerialized: serialized, options }, [
      serialized.scalars.buffer,
      serialized.direction.buffer,
    ]);
  });
}
