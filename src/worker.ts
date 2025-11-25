import { deserializeImageData, serializePolyData } from "./serializeVtk";
import { coreLabelmapToPolyDatas } from "./labelmapToPolyDatas";
import type {
  LabelmapToPolyDatasOptions,
  SerializedImageData,
  SerializedPolyData,
} from "./types";

interface WorkerMessage {
  imageDataSerialized: SerializedImageData;
  options: LabelmapToPolyDatasOptions;
}

self.onmessage = (e: MessageEvent<WorkerMessage>) => {
  const { imageDataSerialized, options } = e.data;
  const imageData = deserializeImageData(imageDataSerialized);
  const polyDatas = coreLabelmapToPolyDatas(imageData, options);

  const result: Record<number, SerializedPolyData> = {};
  const transferables: ArrayBuffer[] = [];

  for (const [value, polyData] of Object.entries(polyDatas)) {
    const serialized = serializePolyData(polyData);
    result[Number(value)] = serialized;
    transferables.push(
      serialized.points.buffer as ArrayBuffer,
      serialized.polys.buffer as ArrayBuffer,
    );
    if (serialized.normals) {
      transferables.push(serialized.normals.buffer as ArrayBuffer);
    }
  }

  self.postMessage({ result }, transferables);
};
