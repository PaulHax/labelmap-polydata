import "@kitware/vtk.js/Rendering/Profiles/Geometry";
import vtkGenericRenderWindow from "@kitware/vtk.js/Rendering/Misc/GenericRenderWindow";
import vtkActor from "@kitware/vtk.js/Rendering/Core/Actor";
import vtkMapper from "@kitware/vtk.js/Rendering/Core/Mapper";
import vtkMatrixBuilder from "@kitware/vtk.js/Common/Core/MatrixBuilder";
import type vtkPolyData from "@kitware/vtk.js/Common/DataModel/PolyData";
import type vtkImageData from "@kitware/vtk.js/Common/DataModel/ImageData";

const COLORS: [number, number, number][] = [
  [1.0, 0.4, 0.4],
  [0.4, 1.0, 0.4],
  [0.4, 0.4, 1.0],
  [1.0, 1.0, 0.4],
  [1.0, 0.4, 1.0],
  [0.4, 1.0, 1.0],
];

function buildDirectionMatrix(imageData: vtkImageData): Float64Array {
  const origin = imageData.getOrigin();
  const direction = imageData.getDirection();

  return vtkMatrixBuilder
    .buildFromRadian()
    .translate(origin[0], origin[1], origin[2])
    .multiply3x3(direction)
    .translate(-origin[0], -origin[1], -origin[2])
    .getMatrix();
}

export function createPolyDataViewer(container: HTMLElement) {
  const genericRenderWindow = vtkGenericRenderWindow.newInstance();
  genericRenderWindow.setContainer(container);
  genericRenderWindow.resize();

  const renderer = genericRenderWindow.getRenderer();
  const renderWindow = genericRenderWindow.getRenderWindow();
  renderer.setBackground([0.1, 0.1, 0.1]);

  function setPolyDatas(
    polyDatas: Record<number, vtkPolyData>,
    sourceImage?: vtkImageData
  ) {
    renderer.getActors().forEach((actor) => renderer.removeActor(actor));

    const directionMatrix = sourceImage
      ? buildDirectionMatrix(sourceImage)
      : null;

    let colorIndex = 0;
    for (const polyData of Object.values(polyDatas)) {
      const mapper = vtkMapper.newInstance();
      mapper.setInputData(polyData);

      const actor = vtkActor.newInstance();
      actor.setMapper(mapper);
      actor.getProperty().setColor(...COLORS[colorIndex % COLORS.length]);

      if (directionMatrix) {
        actor.setUserMatrix(directionMatrix);
      }

      renderer.addActor(actor);
      colorIndex++;
    }

    renderer.resetCamera();
    renderWindow.render();
  }

  return { setPolyDatas };
}
