const fs = require("fs");
const path = require("path");
const paths = require("./paths.cjs");

const isTrue = (value) => value === "1" || value?.toLowerCase() === "true";
module.exports = {
  useRollup() {
    return isTrue(process.env.ROLLUP);
  },
  useWDS() {
    return isTrue(process.env.WDS);
  },
  isProdBuild() {
    return process.env.NODE_ENV === "production" || module.exports.isStatsBuild();
  },
  isStatsBuild() {
    return isTrue(process.env.STATS);
  },
  isTest() {
    return isTrue(process.env.IS_TEST);
  },
  isNetlify() {
    return isTrue(process.env.NETLIFY);
  },
  version() {
    const versionPath = path.resolve(paths.root_dir, "VERSION");
    if (fs.existsSync(versionPath)) {
      return fs.readFileSync(versionPath, "utf8").trim();
    }
    return "dev";
  },
  isDevContainer() {
    return isTrue(process.env.DEV_CONTAINER);
  },
};
