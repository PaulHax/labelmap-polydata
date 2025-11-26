import {
  deserializeImageData,
  serializePolyData,
  type serializeImageData,
} from "./serializeVtk";
import { coreLabelmapToPolyDatas } from "./labelmapToPolyDatas";

export type WorkerMessage = {
  imageDataSerialized: ReturnType<typeof serializeImageData>;
  options?: { segments?: number[] };
};

export type WorkerResponse = {
  result: Record<number, ReturnType<typeof serializePolyData>>;
  transferables: ArrayBuffer[];
};

export function handleLabelmapMessage(data: WorkerMessage): WorkerResponse {
  const { imageDataSerialized, options = {} } = data;
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

  return { result, transferables };
}
