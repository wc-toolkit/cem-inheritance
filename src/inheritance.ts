/* eslint-disable @typescript-eslint/no-explicit-any */
import { Logger } from "./logger";
import type { OmittedProperties, Options } from "./types";
import {
  deepMerge,
  getAllComponents,
  type Component,
} from "@wc-toolkit/cem-utilities";
import { createOutDir, saveFile } from "./utilities";

const completedClasses: string[] = [];
let classQueue: Component[] = [];
let cemEntities: Component[] = [];
let externalComponents: Component[] = [];
let updatedCEM: unknown = {};
const defaultOmittedProperties: OmittedProperties = {
  cssProperties: "omitCssProps",
  cssParts: "omitCssParts",
  cssStates: "omitCssStates",
  methods: "omitMethods",
  attributes: "omit",
  properties: "omit",
  events: "omitEvents",
  slots: "omitSlots",
};
let userConfig: Options = {
  fileName: "custom-elements.json",
  outdir: "./",
  exclude: [],
  externalManifests: [],
  omitByComponent: {},
  omitByProperty: defaultOmittedProperties,
};
let log: Logger;

export function updateCemInheritance(cem: unknown, options: Options = {}) {
  log = new Logger(options.debug);
  if (options.skip) {
    log.yellow("[cem-inheritance] - Skipped");
  }

  log.log("[cem-inheritance] - Updating Custom Elements Manifest...");
  const newCem = generateUpdatedCem(cem, options);
  if (!options.usedByPlugin) {
    createOutDir(userConfig.outdir!);
    saveFile(
      userConfig.outdir!,
      userConfig.fileName!,
      JSON.stringify(newCem, null, 2)
    );
  }
  log.green("[cem-inheritance] - Custom Elements Manifest updated.");
}

function updateOptions(options: Options = {}) {
  setExternalManifests(options.externalManifests);
  return deepMerge(userConfig, options);
}

function setExternalManifests(manifests?: unknown[]) {
  if (!manifests?.length) {
    return;
  }

  externalComponents = manifests.flatMap((manifest) =>
    getDeclarations(manifest)
  );
}

export function generateUpdatedCem(cem: unknown, options: Options = {}) {
  log = new Logger(options.debug);

  if (!cem) {
    throw new Error(
      "Custom Elements Manifest is required to update inheritance."
    );
  }

  updatedCEM = cem;
  userConfig = updateOptions(options);
  cemEntities = getDeclarations(cem, userConfig.exclude);
  cemEntities.forEach((component) => {
    getAncestors(component);
    processInheritanceQueue();
  });

  return updatedCEM;
}

function getAncestors(component?: Component) {
  if (!component || completedClasses.includes(component.name)) {
    return;
  }

  classQueue.push(component);
  if (
    component.superclass?.name &&
    !completedClasses.includes(component.superclass.name)
  ) {
    const parent =
      cemEntities.find((c) => c.name === component.superclass?.name) ||
      externalComponents.find((c) => c.name === component.superclass?.name);
    getAncestors(parent);
  }
}

function processInheritanceQueue() {
  if (classQueue.length === 0) {
    return;
  }

  classQueue.reverse();

  classQueue.forEach((component) => {
    const parent =
      cemEntities.find((c) => c.name === component.superclass?.name) ||
      externalComponents.find((c) => c.name === component.superclass?.name);
    if (parent) {
      Object.keys(defaultOmittedProperties).forEach((key) => {
        const componentApi = key as keyof OmittedProperties;
        const omit = getOmittedProperties(component, componentApi);
        updateApi(component, parent, componentApi, omit);
      });
    }

    completedClasses.push(component.name);
  });

  classQueue = [];
}

function getOmittedProperties(
  component: Component,
  api: keyof OmittedProperties
) {
  const configOmits = userConfig.omitByComponent?.[component.name]?.[api] || [];
  const jsDocOmitProp = userConfig.omitByProperty?.[api];
  console.log("jsDocOmitProp", jsDocOmitProp);
  const omitsFromJsDoc = jsDocOmitProp
    ? (component[jsDocOmitProp] as Array<{ name: string }>)?.map(
        (x) => x.name
      ) || []
    : [];
  console.log("omitsFromJsDoc", omitsFromJsDoc);

  return omitsFromJsDoc.length ? omitsFromJsDoc : configOmits;
}

function updateApi(
  component: Component,
  parent: Component,
  api: string,
  omit: string[]
) {
  if (api === "properties" || api === "methods") {
    updateClassMembers(component, parent, api, omit);
    return;
  }

  if (!parent[api] || userConfig.ignore?.includes(api)) {
    return;
  }

  component[api] = component[api] || [];
  (parent[api] as any[])?.forEach((element) => {
    let apiItem = (component[api] as any[])?.find(
      (a) => a.name === element.name
    );
    if (!apiItem) {
      apiItem = addInheritedFromInfo(element, component);
      (component[api] as any[]).push(apiItem);
    }
  });

  // if(component.name === 'MyJsDocOmitComponent') {
  //   console.log('API', api, component.name, component[api], omit);
  // }
  component[api] = (component[api] as any[])?.filter(
    (a) => !omit.includes(a.name)
  );
}

function updateClassMembers(
  component: Component,
  parent: Component,
  api: string,
  omit: string[]
) {
  const parentContent = parent.members?.filter(
    (m) => m.kind === (api === "methods" ? "method" : "field")
  );

  if (!parentContent?.length || userConfig.ignore?.includes(api)) {
    return;
  }

  component.members = component.members || [];
  parentContent?.forEach((element) => {
    let apiItem = component.members?.find((a) => a.name === element.name);
    if (!apiItem) {
      apiItem = addInheritedFromInfo(element, component);
      component.members!.push(apiItem!);
    }
  });

  component.members = component.members?.filter((a) => !omit.includes(a.name));
}

function addInheritedFromInfo(member: any, component: Component) {
  const newMember = { ...member };
  if (!member.inheritedFrom) {
    newMember.inheritedFrom = {
      name: component.superclass?.name,
    };
  }
  return newMember;
}

/**
 * Gets a list of components from a CEM object
 * @param customElementsManifest CEM object
 * @param exclude and array of component names to exclude
 * @returns Component[]
 */
export function getDeclarations(
  customElementsManifest: unknown,
  exclude?: string[]
): Component[] {
  return getAllComponents(customElementsManifest).filter(
    (c) => !exclude?.includes(c.name)
  );
}
