import vtkMatrixBuilder from "@kitware/vtk.js/Common/Core/MatrixBuilder";
import type vtkImageData from "@kitware/vtk.js/Common/DataModel/ImageData";

/**
 * Builds a 4x4 transformation matrix that applies the image's direction matrix
 * around its origin. Use this to align polydata meshes with world space when
 * the source image has a non-identity direction (oblique/rotated scans).
 *
 * Apply to a vtk.js actor: actor.setUserMatrix(buildDirectionMatrix(imageData))
 */
export function buildDirectionMatrix(imageData: vtkImageData) {
  const origin = imageData.getOrigin();
  const direction = imageData.getDirection();

  return vtkMatrixBuilder
    .buildFromRadian()
    .translate(origin[0], origin[1], origin[2])
    .multiply3x3(direction)
    .translate(-origin[0], -origin[1], -origin[2])
    .getMatrix();
}
