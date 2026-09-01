/* eslint-disable @typescript-eslint/no-var-requires */
const { createVelbusConfig } = require("./build-scripts/rspack.cjs");
const { isProdBuild, isStatsBuild } = require("./build-scripts/env.cjs");

module.exports = createVelbusConfig({
  isProdBuild: isProdBuild(),
  isStatsBuild: isStatsBuild(),
  latestBuild: true,
});
