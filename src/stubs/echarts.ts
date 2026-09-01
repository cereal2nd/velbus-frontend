import { reportStubbed } from "./stub-report";

reportStubbed("echarts", "drawing charts and graphs");

const noop = (): undefined => undefined;

export default new Proxy(noop, { get: () => noop });

export const LinearGradient = class StubbedLinearGradient {
  public readonly stubbed = true;
};
