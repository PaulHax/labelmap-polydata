import vtkImageData from "@kitware/vtk.js/Common/DataModel/ImageData";
import vtkPolyData from "@kitware/vtk.js/Common/DataModel/PolyData";
import vtkDataArray from "@kitware/vtk.js/Common/Core/DataArray";
import vtkPoints from "@kitware/vtk.js/Common/Core/Points";
import vtkCellArray from "@kitware/vtk.js/Common/Core/CellArray";
import type { SerializedImageData, SerializedPolyData } from "./types";

export function serializeImageData(
  imageData: vtkImageData,
): SerializedImageData {
  const scalars = imageData.getPointData().getScalars();
  return {
    dimensions: imageData.getDimensions() as [number, number, number],
    spacing: imageData.getSpacing() as [number, number, number],
    origin: imageData.getOrigin() as [number, number, number],
    direction: new Float64Array(imageData.getDirection()),
    scalars: scalars.getData().slice() as Uint8Array,
  };
}

export function deserializeImageData(data: SerializedImageData): vtkImageData {
  const imageData = vtkImageData.newInstance();
  imageData.setDimensions(data.dimensions);
  imageData.setSpacing(data.spacing);
  imageData.setOrigin(data.origin);
  // @ts-expect-error vtk.js types expect mat3 but accepts number[]
  imageData.setDirection(Array.from(data.direction));

  const scalars = vtkDataArray.newInstance({
    values: data.scalars,
    numberOfComponents: 1,
  });
  imageData.getPointData().setScalars(scalars);
  return imageData;
}

export function serializePolyData(polyData: vtkPolyData): SerializedPolyData {
  const points = polyData.getPoints();
  const polys = polyData.getPolys();
  const normalsArray = polyData.getPointData().getNormals();

  return {
    points: points.getData() as Float32Array,
    polys: polys.getData() as Uint32Array,
    normals: normalsArray ? (normalsArray.getData() as Float32Array) : null,
  };
}

export function deserializePolyData(data: SerializedPolyData): vtkPolyData {
  const polyData = vtkPolyData.newInstance();

  const points = vtkPoints.newInstance();
  points.setData(data.points, 3);
  polyData.setPoints(points);

  const polys = vtkCellArray.newInstance();
  polys.setData(data.polys);
  polyData.setPolys(polys);

  if (data.normals) {
    const normals = vtkDataArray.newInstance({
      values: data.normals,
      numberOfComponents: 3,
      name: "Normals",
    });
    polyData.getPointData().setNormals(normals);
  }

  return polyData;
}
