import { deleteSync } from "del";
import gulp from "gulp";
import paths from "../paths.cjs";

gulp.task("clean-velbus-dist", async () =>
  deleteSync([
    `${paths.velbus_output_root}/*.js`,
    `${paths.velbus_output_root}/*.js.map`,
    `${paths.velbus_output_root}/*.LICENSE.txt`,
    paths.build_dir,
  ]),
);
