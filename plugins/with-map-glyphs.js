// Bundles assets/glyphs (MapLibre font glyphs) into the native apps so the
// map style can load them from asset://glyphs/{fontstack}/{range}.pbf.
const fs = require("fs");
const path = require("path");
const {
  IOSConfig,
  withDangerousMod,
  withXcodeProject,
} = require("expo/config-plugins");

const SOURCE = "assets/glyphs";

function copyGlyphs(projectRoot, destination) {
  fs.rmSync(destination, { recursive: true, force: true });
  fs.cpSync(path.join(projectRoot, SOURCE), destination, { recursive: true });
}

module.exports = function withMapGlyphs(config) {
  config = withDangerousMod(config, [
    "android",
    (c) => {
      const { projectRoot, platformProjectRoot } = c.modRequest;
      copyGlyphs(projectRoot, path.join(platformProjectRoot, "app/src/main/assets/glyphs"));
      return c;
    },
  ]);

  config = withDangerousMod(config, [
    "ios",
    (c) => {
      const { projectRoot, platformProjectRoot, projectName } = c.modRequest;
      copyGlyphs(projectRoot, path.join(platformProjectRoot, projectName, "glyphs"));
      return c;
    },
  ]);

  // Add ios/<project>/glyphs as a folder reference so its subfolders are kept in the app bundle.
  config = withXcodeProject(config, (c) => {
    const project = c.modResults;
    const projectName = c.modRequest.projectName;
    IOSConfig.XcodeUtils.addResourceFileToGroup({
      filepath: `${projectName}/glyphs`,
      groupName: projectName,
      isBuildFile: true,
      project,
    });
    const refs = project.pbxFileReferenceSection();
    for (const key of Object.keys(refs)) {
      const ref = refs[key];
      if (typeof ref === "object" && String(ref.path).replace(/"/g, "").endsWith("glyphs")) {
        ref.lastKnownFileType = "folder";
      }
    }
    return c;
  });

  return config;
};
