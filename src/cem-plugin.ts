import { deepMerge } from "@wc-toolkit/cem-utilities";
import { updateCemInheritance } from "./inheritance.js";
import type { Options } from "./types";
import type { AnalyzePhaseParams, PackageLinkPhaseParams } from "@custom-elements-manifest/analyzer"
import {parseJsDocTags, type CustomTag} from "@wc-toolkit/jsdoc-tags";
import { defaultUserConfig } from "./default-values.js";

let userOptions = defaultUserConfig;
const defaultTags: CustomTag = {
  'omit': {
    isArray: true,
    mappedName: userOptions.omitByProperty?.attributes,
  },
  'omit-part': {
    isArray: true,
    mappedName: userOptions.omitByProperty?.cssParts,
  },
  'omit-cssprop': {
    isArray: true,
    mappedName: userOptions.omitByProperty?.cssProperties,
  },
  'omit-cssState': {
    isArray: true,
    mappedName: userOptions.omitByProperty?.cssStates
  },
  'omit-event': {
    isArray: true,
    mappedName: userOptions.omitByProperty?.events,
  },
  'omit-slot': {
    isArray: true,
    mappedName: userOptions.omitByProperty?.slots,
  },
  'omit-method': {
    isArray: true,
    mappedName: userOptions.omitByProperty?.methods,
  },
}

export function cemInheritancePlugin(options: Options = {}) {
  userOptions = deepMerge(defaultUserConfig, options);
  return {
    name: "cem-inheritance",
    analyzePhase(params: AnalyzePhaseParams) {
      parseJsDocTags(params, defaultTags);
    },
    packageLinkPhase({ customElementsManifest }: PackageLinkPhaseParams) {
      options.usedByPlugin = true;
      updateCemInheritance(customElementsManifest, userOptions);
    },
  };
}