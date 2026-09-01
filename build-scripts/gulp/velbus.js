import gulp from "gulp";
import env from "../env.cjs";

import "./clean.js";
import "./gen-icons-json.js";
import "./rspack.js";
import "./translations.js";
import "./locale-data.js";

gulp.task(
  "develop-velbus",
  gulp.series(
    async () => {
      process.env.NODE_ENV = "development";
    },
    "clean-velbus-dist",
    "set-dev-flag",
    "gen-icons-json",
    "build-translations",
    "build-locale-data",
    "rspack-watch-velbus",
  ),
);

gulp.task(
  "build-velbus",
  gulp.series(
    async () => {
      process.env.NODE_ENV = "production";
    },
    "clean-velbus-dist",
    "ensure-velbus-build-dir",
    "gen-icons-json",
    "build-translations",
    "build-locale-data",
    "rspack-prod-velbus",
    "set-prod-flag",
    ...// Don't compress running tests
    (env.isTest() ? [] : []),
  ),
);
