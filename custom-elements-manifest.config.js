import { cemInheritancePlugin } from "./dist/index.js";

export default {
  /** Globs to analyze */
  globs: ["demo/src/**/*.ts"],
  /** Directory to output CEM to */
  outdir: "demo",
  /** Include third party custom elements manifests */
  dependencies: false,
  /** Run in dev mode, provides extra logging */
  dev: false,
  /** Output CEM path to `package.json`, defaults to true */
  packagejson: false,
  plugins: [
    cemInheritancePlugin({
      omitByComponent: {
        MyConfigOmitComponent: {
          cssParts: ["title"],
          cssProperties: ["--my-component-color"],
          events: ["my-event"],
          cssStates: ["active"],
        },
      },
    }),
  ],
};
