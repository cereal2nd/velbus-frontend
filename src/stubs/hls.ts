import { reportStubbed } from "./stub-report";

reportStubbed(
  "hls.js",
  "playing camera streams that the browser cannot play natively",
);

export default {
  isSupported: (): boolean => false,
};
