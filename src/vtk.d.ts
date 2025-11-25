declare module "@kitware/vtk.js/Filters/General/ImageMarchingCubes" {
  import vtkImageData from "@kitware/vtk.js/Common/DataModel/ImageData";
  import vtkPolyData from "@kitware/vtk.js/Common/DataModel/PolyData";

  export interface vtkImageMarchingCubes {
    setInputData(data: vtkImageData): void;
    setContourValue(value: number): void;
    setComputeNormals(compute: boolean): void;
    setMergePoints(merge: boolean): void;
    getOutputData(): vtkPolyData;
  }

  export interface IImageMarchingCubesInitialValues {}

  export function newInstance(
    initialValues?: IImageMarchingCubesInitialValues,
  ): vtkImageMarchingCubes;

  export default {
    newInstance,
  };
}
