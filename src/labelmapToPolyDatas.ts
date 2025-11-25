import vtkImageData from "@kitware/vtk.js/Common/DataModel/ImageData";
import vtkPolyData from "@kitware/vtk.js/Common/DataModel/PolyData";
import vtkDataArray from "@kitware/vtk.js/Common/Core/DataArray";
import vtkImageMarchingCubes from "@kitware/vtk.js/Filters/General/ImageMarchingCubes";
import {
  serializeImageData,
  serializePolyData,
  deserializePolyData,
} from "./serializeVtk";

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
  options: { segments?: number[] } = {},
) {
  const scalars = imageData.getPointData().getScalars().getData() as Uint8Array;
  const segments = options.segments ?? getUniqueSegmentValues(scalars);

  const result = {} as Record<number, vtkPolyData>;

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
  options: { segments?: number[]; worker?: Worker } = {},
) {
  const { worker, ...coreOptions } = options;

  if (!worker) {
    return coreLabelmapToPolyDatas(imageData, coreOptions);
  }

  const serialized = serializeImageData(imageData);

  return new Promise<ReturnType<typeof coreLabelmapToPolyDatas>>(
    (resolve, reject) => {
      worker.onmessage = (
        e: MessageEvent<{
          result: Record<number, ReturnType<typeof serializePolyData>>;
        }>,
      ) => {
        const result = {} as ReturnType<typeof coreLabelmapToPolyDatas>;
        for (const [value, data] of Object.entries(e.data.result)) {
          result[Number(value)] = deserializePolyData(data);
        }
        resolve(result);
      };
      worker.onerror = reject;
      worker.postMessage(
        { imageDataSerialized: serialized, options: coreOptions },
        [serialized.scalars.buffer, serialized.direction.buffer],
      );
    },
  );
}
