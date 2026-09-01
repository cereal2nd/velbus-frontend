import { reportStubbed } from "./stub-report";

export default class Cropper {
  public constructor() {
    reportStubbed("cropperjs", "cropping an uploaded image");
  }

  public getData(): Record<string, never> {
    return {};
  }

  public getImageData(): Record<string, never> {
    return {};
  }

  public getCroppedCanvas(): HTMLCanvasElement {
    return document.createElement("canvas");
  }

  public replace(): void {
    // no-op
  }

  public destroy(): void {
    // no-op
  }
}
