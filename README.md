# booklet-map-test

A prototype Expo / React Native app that shows a full-screen vector map centered on the user's current location. The map uses a custom [MapLibre](https://maplibre.org/) style with OpenFreeMap tiles and labels set in the **Sen** typeface, which is bundled into the app.

It is a testbed for the map experience in Booklet, not a finished product.

## Current features

- **Full-screen map on the Home tab** ([src/app/index.tsx](src/app/index.tsx))
  - Asks for foreground location permission on launch.
  - Shows a spinner while it waits for a GPS fix, then centers the camera on the user at zoom 15.
  - Shows the user's position with MapLibre's `UserLocation` puck.
  - Shows a plain error message if permission is denied or the location can't be read. There is no retry button yet.
- **Custom map style** ([src/constants/map-style.json](src/constants/map-style.json))
  - A MapLibre style spec (v8) with 102 layers: land use, water, roads, rail, bridges and tunnels, 2D and 3D buildings, boundaries, POIs and place labels. The layer structure follows OpenFreeMap's "Liberty" style, with custom changes such as the background color `#DEECB6`.
  - Tiles come from OpenFreeMap: vector `https://tiles.openfreemap.org/planet` and raster Natural Earth shaded relief for zooms 0–6. Both are free and need **no API key**.
  - Icons and sprites load remotely from OpenFreeMap (`ofm_f384` sprite).
  - Every text layer uses the font `Sen-Bold`.
- **Bundled font glyphs** ([assets/glyphs/](assets/glyphs/))
  - Pre-rendered MapLibre glyph PBFs for `Sen-Bold` and `Sen-Regular` (256 Unicode range files each). Only `Sen-Bold` is used by the style right now.
  - The style loads them offline from `asset://glyphs/{fontstack}/{range}.pbf`, so labels don't depend on a remote glyph server.
  - Sen is licensed under the SIL Open Font License; see [assets/glyphs/OFL.txt](assets/glyphs/OFL.txt).
- **Config plugin that bundles the glyphs natively** ([plugins/with-map-glyphs.js](plugins/with-map-glyphs.js))
  - At prebuild, it copies `assets/glyphs` into `android/app/src/main/assets/glyphs` on Android and `ios/<project>/glyphs` on iOS.
  - On iOS it adds that folder to the Xcode project as a **folder reference**, not a group. This keeps the `{fontstack}/{range}.pbf` directory structure in the app bundle, which is what `asset://` lookups need.
- **Leftovers from the template:** the **Explore** tab ([src/app/explore.tsx](src/app/explore.tsx)), the native tab bar, theming and the animated splash still come from `create-expo-app` and haven't been customized.

## Tech stack

| | |
|---|---|
| Expo SDK | 58 (`expo ~58.0.25`), React Native 0.88, React 19.3 |
| Routing | Expo Router (file-based, `src/app/`), native tabs |
| Map | `@maplibre/maplibre-react-native` v11 (`Map`, `Camera`, `UserLocation`) |
| Location | `expo-location` |
| Build | Development build via `expo-dev-client` (**does not run in Expo Go**) |
| Experiments | Typed routes, React Compiler |

## Setup

### Prerequisites

- Node.js and npm. The project uses `package-lock.json`.
- For iOS: macOS with Xcode and CocoaPods. For Android: Android Studio with an SDK and an emulator or device.
- You don't need a map API key or any account.

### 1. Install dependencies

```bash
npm install
```

### 2. Build and run a development build

MapLibre is a native module and isn't included in Expo Go, so you need a development build:

```bash
npx expo run:ios       # or: npm run ios
npx expo run:android   # or: npm run android
```

This runs `expo prebuild`, which generates `ios/` and `android/` and applies the config plugins, then compiles and installs the app. After the first build, you can start just the JS bundler with `npx expo start` and open the already-installed dev client.

To build in the cloud instead: `npx eas-cli@latest build --profile development`. There is no `eas.json` yet, so EAS will offer to create one.

### 3. Allow location access

Grant location permission when the app asks. On a simulator, set a location first. In the iOS Simulator, use *Features → Location*. In the Android emulator, use *Extended controls → Location*. Otherwise the app will keep showing the spinner or an error.

## Setup changes made so far

These are the changes from the stock `create-expo-app` template, so you know what's custom:

1. **Added dependencies** with `npx expo install`:
   - `@maplibre/maplibre-react-native`: the map renderer.
   - `expo-location`: permission handling and the GPS fix.
   - `expo-dev-client`: development build support, since MapLibre can't run in Expo Go.
   - `eslint` and `eslint-config-expo` (dev): linting, configured in [eslint.config.js](eslint.config.js).
2. **Changes to [app.json](app.json):**
   - `ios.bundleIdentifier`: `com.princerely.map-test`. This is required for native iOS builds.
   - `android.permissions`: `ACCESS_COARSE_LOCATION` and `ACCESS_FINE_LOCATION`.
   - The `expo-location` plugin with the iOS "when in use" permission text: *"Allow $(PRODUCT_NAME) to show your location on the map."*
   - The `@maplibre/maplibre-react-native` plugin.
   - The local `./plugins/with-map-glyphs` plugin, described above.
3. **Changes to `package.json` scripts:** `ios` and `android` now run `expo run:*` (native build) instead of `expo start --*`.
4. **Added the map style** at `src/constants/map-style.json`, with `glyphs` pointing at `asset://glyphs/...`.
5. **Added Sen glyph PBFs** in `assets/glyphs/Sen-Bold` and `assets/glyphs/Sen-Regular`, plus the OFL license.
6. **Replaced the Home screen** with the map screen.

### Why the font is bundled as glyphs

The first attempt to use Sen for map labels failed. The font wouldn't load and the map threw an error. That's because MapLibre doesn't draw text with the app's fonts, whether they're installed on the device or loaded with `expo-font`. It renders labels from **glyph files**: pre-rasterized SDF (signed distance field) `.pbf` files for each 256-character Unicode range. It fetches them from the style's `glyphs` URL using the fontstack name in `text-font`. OpenFreeMap's glyph server doesn't host Sen, so asking for `"Sen-Bold"` there failed.

The fix was to generate Sen glyph PBFs ourselves, ship them inside the app ([assets/glyphs/](assets/glyphs/)), point the style at `asset://glyphs/{fontstack}/{range}.pbf`, and add the [with-map-glyphs](plugins/with-map-glyphs.js) config plugin so the files end up in the native bundles. As a bonus, labels now render without a network request for fonts.

> **Not recorded:** which tool turned the Sen `.ttf` files into glyph PBFs (for example, [maplibre/font-maker](https://github.com/maplibre/font-maker) or `build_pbf_glyphs`), and where the original style JSON came from before it was customized. If you know, please add it here.

## Working with the map

### Changing the font

1. Generate glyph PBFs for the new font with a MapLibre glyph tool. The output must be one folder per fontstack, containing `0-255.pbf` through `65280-65535.pbf`.
2. Put the folder in `assets/glyphs/<FontName>/`.
3. Change `text-font` in `map-style.json` to `["<FontName>"]`. The name must match the folder name exactly.
4. **Rebuild the native app** with `npx expo run:ios` or `run:android`. Glyphs are copied in at prebuild, so a Metro reload won't pick them up.

### Changing the style

Edit `src/constants/map-style.json` by hand, or export one from [Maputnik](https://maplibre.org/maputnik/). If you load an external style into Maputnik, set its `glyphs` URL back to `asset://glyphs/{fontstack}/{range}.pbf` before you paste it here. Style changes are JS-only, so a reload is enough.

## Commands

```bash
npx expo start       # start Metro for the dev client
npx expo run:ios     # native iOS build + run
npx expo run:android # native Android build + run
npx expo lint        # lint
npx tsc --noEmit     # typecheck
npx expo-doctor      # check dependency/config health
```

## Project layout

```
src/app/                 Routes (Expo Router): _layout.tsx, index.tsx (map), explore.tsx (template)
src/components/          Template UI components (tabs, themed text/view, etc.)
src/constants/           theme.ts, map-style.json
assets/glyphs/           MapLibre glyph PBFs (Sen-Bold, Sen-Regular) + OFL license
plugins/                 with-map-glyphs.js config plugin
app.json                 Expo config (permissions, plugins, bundle ID)
```

`ios/` and `android/` are generated by prebuild and are gitignored. Don't edit them by hand. Configure native behavior through `app.json` and config plugins instead.

## Known limitations / next steps

- **Web isn't supported** for the map screen. MapLibre React Native is native-only, even though the template's web config is still in place.
- There's no retry or "open settings" option after location permission is denied.
- The camera centers once, on the first fix. It doesn't follow the user afterward.
- Sprites and tiles need a network connection. Only the glyphs work offline.
- The Explore tab and the splash and theme are still template placeholders.
- There is no `eas.json` or EAS project setup yet.
