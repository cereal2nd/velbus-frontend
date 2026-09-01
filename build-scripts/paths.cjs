const path = require("path");

module.exports = {
  root_dir: path.resolve(__dirname, ".."),

  src_dir: path.resolve(__dirname, "../src"),

  build_dir: path.resolve(__dirname, "../build"),

  velbus_dir: path.resolve(__dirname, ".."),
  velbus_output_root: path.resolve(__dirname, "../velbus_frontend/dist"),
  velbus_publicPath: "/velbus_static",
  upstream_build_dir: path.resolve(__dirname, "../homeassistant-frontend/build"),

  translations_src: path.resolve(
    __dirname,
    "../homeassistant-frontend/src/translations"
  ),
};
