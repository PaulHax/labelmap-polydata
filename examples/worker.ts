import { handleLabelmapMessage } from "../src/workerHandler";

self.onmessage = (e) => {
  const { result, transferables } = handleLabelmapMessage(e.data);
  self.postMessage({ result }, transferables);
};
