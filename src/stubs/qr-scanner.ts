import { reportStubbed } from "./stub-report";

reportStubbed("qr-scanner", "scanning QR codes with the camera");

export default {
  hasCamera: (): Promise<boolean> => Promise.resolve(false),
};
