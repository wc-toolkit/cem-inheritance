/* eslint-disable @typescript-eslint/no-explicit-any */
import { Logger } from "./logger";
import type { OmittedProperties, Options } from "./types";
import {
  deepMerge,
  getAllComponents,
  type Component,
} from "@wc-toolkit/cem-utilities";
import { createOutDir, saveFile } from "./utilities";
import { defaultUserConfig } from "./default-values";

const completedClasses: Set<string> = new Set();
let classQueue: Component[] = [];
let cemEntities: Component[] = [];
let externalComponents: Component[] = [];
let updatedCEM: unknown = {};
let log: Logger;
let userConfig: Options = defaultUserConfig;

export function updateCemInheritance(cem: unknown, options: Options = {}) {
  log = new Logger(options.debug);
  if (options.skip) {
    log.yellow("[cem-inheritance] - Skipped");
    return;
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

function createComponentMap(components: Component[]): Map<string, Component> {
  const map = new Map<string, Component>();
  components.forEach((component) => {
    map.set(component.name, component);
  });
  return map;
}

function generateUpdatedCem(cem: unknown, options: Options = {}) {
  if (!cem) {
    throw new Error(
      "Custom Elements Manifest is required to update inheritance."
    );
  }

  updatedCEM = cem;
  userConfig = options.usedByPlugin ? options : updateOptions(options);
  cemEntities = getDeclarations(cem, userConfig.exclude);
  const cemMap = createComponentMap(cemEntities);
  const externalMap = createComponentMap(externalComponents);

  cemEntities.forEach((component) => {
    getAncestors(component, cemMap, externalMap);
  });

  processInheritanceQueue(cemMap, externalMap);

  return updatedCEM;
}

function getAncestors(
  component?: Component,
  cemMap?: Map<string, Component>,
  externalMap?: Map<string, Component>
) {
  if (!component || completedClasses.has(component.name)) {
    return;
  }

  classQueue.push(component);
  if (
    component.superclass?.name &&
    !completedClasses.has(component.superclass.name)
  ) {
    const parent =
      cemMap?.get(component.superclass.name) ||
      externalMap?.get(component.superclass.name);
    getAncestors(parent, cemMap, externalMap);
  }
}

function processInheritanceQueue(
  cemMap?: Map<string, Component>,
  externalMap?: Map<string, Component>
) {
  if (classQueue.length === 0) {
    return;
  }

  try {
    // Process the queue using a while loop for better performance
    while (classQueue.length > 0) {
      const component = classQueue.pop(); // Use pop for LIFO processing
      if (!component) continue; // Skip if component is undefined

      const parent =
        cemMap?.get(component.superclass?.name || "") ||
        externalMap?.get(component.superclass?.name || "");

      if (parent) {
        Object.keys(defaultUserConfig.omitByProperty!).forEach((key) => {
          const componentApi = key as keyof OmittedProperties;
          const omit = getOmittedProperties(component, parent, componentApi);
          updateApi(component, parent, componentApi, omit);
        });
      }

      completedClasses.add(component.name);
    }
  } catch (error) {
    console.error(
      "[cem-inheritance] - Error processing inheritance queue.",
      error
    );
  } finally {
    // Ensure classQueue is always empty after processing
    classQueue = [];
  }
}

function getOmittedProperties(
  component: Component,
  parent: Component,
  api: keyof OmittedProperties
): string[] {
  const configOmits = userConfig.omitByConfig?.[component.name]?.[api] || [];
  const componentOmitProp = userConfig.omitByProperty?.[api] || "";

  // Safely cast to array of { name: string }

  const allOmits = [
    ...configOmits.map((name) => ({ name })),
    ...((component[componentOmitProp] as Array<{ name: string }>) || []),
    ...((parent[componentOmitProp] as Array<{ name: string }>) || []),
  ];

  const uniqueOmits = [...new Set(allOmits.map((omit) => omit.name))];

  // do not add the omit property to the component if there are no omits
  if (uniqueOmits.length) {
    component[componentOmitProp] = uniqueOmits.map((name) => ({ name }));
  }
  return uniqueOmits;
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

  if (userConfig.ignore?.includes(api)) {
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

  component[api] = (component[api] as any[])?.filter(
    (a) => !omit.includes(a.name) && a.inheritedFrom
  );

  if (api === "attributes" && component.members?.length) {
    component.members = component.members.filter(
      (a) =>
        a.name ===
          parent.attributes?.find((x) => omit.includes(x.name))?.fieldName &&
        a.inheritedFrom
    );
  }
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

  if (userConfig.ignore?.includes(api)) {
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

  component.members = component.members?.filter(
    (a) => !omit.includes(a.name) && a.inheritedFrom
  );

  if (api !== "methods" && component.attributes?.length) {
    component.attributes = component.attributes.filter(
      (a) => !omit.includes(a.fieldName || "") && a.inheritedFrom
    );
  }
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
