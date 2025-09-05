/* eslint-disable @typescript-eslint/no-explicit-any */
import { Logger } from "./logger";
import type { CemInheritanceOptions, OmittedProperties } from "./types";
import type * as cem from "custom-elements-manifest";
import {
  deepMerge,
  getAllComponents,
  type Mixin,
  type Component,
  getAllMixins,
} from "@wc-toolkit/cem-utilities";
import { createOutDir, saveFile } from "./utilities";
import { defaultUserConfig } from "./default-values";

const completedClasses: Set<string> = new Set();
let classQueue: Component[] = [];
let cemEntities: Component[] = [];
let externalComponents: Component[] = [];
let externalMixins: Mixin[] = [];
let updatedCEM: unknown = {};
let log: Logger;
let userConfig: CemInheritanceOptions = defaultUserConfig;

export function updateCemInheritance(
  cem: unknown,
  options: CemInheritanceOptions = {}
) {
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

function updateOptions(options: CemInheritanceOptions = {}) {
  return deepMerge(userConfig, options);
}

function setExternalManifests(manifests?: unknown[]) {
  if (!manifests?.length) {
    return;
  }

  const combinedManifests = {
    modules: manifests.flatMap(
      (manifest) => (manifest as { modules: unknown[] }).modules
    ),
  };

  externalComponents = getDeclarations(combinedManifests);
  externalMixins = getAllMixins(combinedManifests);
}

function createComponentMap(components: Component[]): Map<string, Component> {
  const map = new Map<string, Component>();
  components.forEach((component) => {
    map.set(component.name, component);
  });
  return map;
}

export function generateUpdatedCem(
  cem: unknown,
  options: CemInheritanceOptions = {}
) {
  if (!cem) {
    throw new Error(
      "Custom Elements Manifest is required to update inheritance."
    );
  }

  const originalCEM = structuredClone(cem);

  updatedCEM = originalCEM;
  userConfig = options.usedByPlugin ? options : updateOptions(options);
  setExternalManifests(userConfig.externalManifests);

  // Include external manifests in the main manifest if option is enabled
  if (
    userConfig.includeExternalManifests &&
    userConfig.externalManifests?.length
  ) {
    updatedCEM = mergeExternalManifests(
      updatedCEM as cem.Package,
      userConfig.externalManifests as cem.Package[]
    );
  }

  cemEntities = getDeclarations(originalCEM, userConfig.exclude);
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
    while (classQueue.length > 0) {
      // Use pop for LIFO processing
      const component = classQueue.pop();
      // Skip if component is undefined
      if (!component) {
        continue;
      }

      const parentName =
        (userConfig.aliasMap &&
          userConfig.aliasMap[component.superclass?.name || ""]) ||
        component.superclass?.name ||
        "";
      const parent = cemMap?.get(parentName) || externalMap?.get(parentName);

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

  if (!component[api]) {
    component[api] = [];
  }

  (parent[api] as any[])?.forEach((element) => {
    let apiItem = (component[api] as any[])?.find(
      (a) => a.name === element.name
    );
    if (!apiItem) {
      apiItem = addInheritedFromInfo(element, parent.name);
      (component[api] as any[]).push(apiItem);
    }
  });

  component[api] = (component[api] as any[])?.filter(
    (a) => !omit.includes(a.name) && a.inheritedFrom
  );

  if (api === "attributes" && component.members?.length && omit.length) {
    const omittedAttributeFields = component.attributes
      ?.filter((a) => omit.includes(a.name || ""))
      .map((a) => a.fieldName);
    component.members = component.members.filter((member) =>
      member.inheritedFrom
        ? !omittedAttributeFields?.includes(member.name)
        : true
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

  if (!component.members) {
    component.members = [];
  }

  parentContent?.forEach((member) => {
    let apiItem = component.members?.find((a) => a.name === member.name);
    if (!apiItem) {
      apiItem = addInheritedFromInfo(member, parent.name);
      component.members!.push(apiItem!);
    }
  });

  component.mixins?.forEach((mixin) => {
    const extMixin = externalMixins.find(
      (extMixin) => extMixin.name === mixin.name
    );
    if (!extMixin) {
      return;
    }
    const mixinApi = extMixin?.members?.filter(
      (m) => m.kind === (api === "methods" ? "method" : "field")
    );
    mixinApi?.forEach((element) => {
      let apiItem = (component[api] as any[])?.find(
        (a) => a.name === element.name
      );
      if (!apiItem) {
        apiItem = addInheritedFromInfo(element, extMixin.name);
        component.members!.push(apiItem!);
      }
    });
  });

  component.members = component.members?.filter((a) => !omit.includes(a.name));

  if (api !== "methods" && component.attributes?.length) {
    component.attributes = component.attributes.filter(
      (a) => !omit.includes(a.fieldName || "")
    );
  }
}

function addInheritedFromInfo(member: any, parentName?: string) {
  const newMember = { ...member };
  if (!member.inheritedFrom) {
    newMember.inheritedFrom = {
      name: parentName || "",
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
function getDeclarations(
  customElementsManifest: unknown,
  exclude?: string[]
): Component[] {
  return getAllComponents(customElementsManifest)?.filter(
    (c) => !exclude?.includes(c.name) || []
  );
}

/**
 * Merges external manifest declarations into the main manifest
 */
function mergeExternalManifests(
  mainManifest: cem.Package,
  externalManifests: cem.Package[]
): cem.Package {
  if (!externalManifests || externalManifests.length === 0) {
    return mainManifest;
  }

  const mergedManifest = { ...mainManifest };

  // Ensure modules array exists
  if (!mergedManifest.modules) {
    mergedManifest.modules = [];
  }

  for (const externalManifest of externalManifests) {
    if (externalManifest.modules) {
      mergedManifest.modules.push(...externalManifest.modules);
    }
  }

  return mergedManifest;
}
