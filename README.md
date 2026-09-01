# Velbus config panel frontend

Lit/TypeScript config panel for the Home Assistant Velbus integration. The built assets are packaged in the `velbus-frontend` PyPI wheel and loaded by Home Assistant through `panel_custom`.

## Prerequisites

- Node.js 24 (see `.nvmrc`; [fnm](https://github.com/Schniz/fnm) or nvm is recommended)
- Yarn 4 (Corepack enables it after `fnm use` / `nvm use`)
- A checkout of [home-assistant/frontend](https://github.com/home-assistant/frontend) as `homeassistant-frontend` (git submodule or symlink to a local clone)

## Bootstrap

```sh
./script/bootstrap
```

This merges frontend dependencies from `homeassistant-frontend/package.json`, runs `yarn install`, and links `homeassistant-frontend/node_modules` to this repo's `node_modules` so the shared Babel build plugins can resolve packages.

## Development

Run the rspack watcher and point Home Assistant at the editable Python package:

```sh
./script/develop
```

Install the package into your Home Assistant venv:

```sh
pip install -e /path/to/velbus-frontend
```

Enable advanced mode on a Velbus config entry, then open **Settings → Devices & services → Velbus → Configure**.

## Production build

```sh
yarn build
```

Build output is written to `velbus_frontend/dist/velbus-panel.js`. Production builds set `IS_PROD_BUILD = True` in `velbus_frontend/constants.py` for cache-friendly static serving.

## Lint

```sh
yarn lint
```

## Python package

The Python API in `velbus_frontend/__init__.py` exposes:

- `webcomponent_name` (`velbus-panel`)
- `entrypoint_js` (`velbus-panel.js`)
- `locate_dir()`, `get_build_id()`, `is_prod_build`
