import { updateCemInheritance } from "./inheritance.js";
import type { Options } from "./types";
import type { AnalyzePhaseParams, PackageLinkPhaseParams } from "@custom-elements-manifest/analyzer"
import {parseJsDocTags, type CustomTag} from "@wc-toolkit/jsdoc-tags";

const defaultTags: CustomTag = {
  'omit': {
    isArray: true,
  },
  'omit-part': {
    isArray: true,
    mappedName: 'omitCssParts',
  },
  'omit-cssprop': {
    isArray: true,
    mappedName: 'omitCssProps',
  },
  'omit-cssState': {
    isArray: true,
    mappedName: 'omitCssStates',
  },
  'omit-event': {
    isArray: true,
    mappedName: 'omitEvents',
  },
  'omit-slot': {
    isArray: true,
    mappedName: 'omitSlots',
  },
  'omit-method': {
    isArray: true,
    mappedName: 'omitMethods',
  },
}

export function cemInheritancePlugin(options: Options = {}) {
  return {
    name: "cem-inheritance",
    analyzePhase(params: AnalyzePhaseParams) {
      parseJsDocTags(params, defaultTags);
    },
    packageLinkPhase({ customElementsManifest }: PackageLinkPhaseParams) {
      options.usedByPlugin = true;
      updateCemInheritance(customElementsManifest, options);
    },
  };
}