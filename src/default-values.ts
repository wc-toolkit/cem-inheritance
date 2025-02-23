import { OmittedProperties, Options } from "./types";

export const defaultOmittedProperties: OmittedProperties = {
  cssProperties: "omitCssProps",
  cssParts: "omitCssParts",
  cssStates: "omitCssStates",
  methods: "omitMethods",
  attributes: "omit",
  properties: "omit",
  events: "omitEvents",
  slots: "omitSlots",
};

export const defaultUserConfig: Options = {
  fileName: "custom-elements.json",
  outdir: "./",
  exclude: [],
  externalManifests: [],
  omitByConfig: {},
  omitByProperty: defaultOmittedProperties,
};
