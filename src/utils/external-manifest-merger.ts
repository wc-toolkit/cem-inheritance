import type * as cem from "custom-elements-manifest";

/**
 * Merges external manifest declarations into the main manifest
 */
export function mergeExternalManifests(
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

/**
 * Filters external declarations to only include those that are actually extended
 */
export function filterRelevantExternalDeclarations(
  mainManifest: cem.Package,
  externalManifests: cem.Package[]
): cem.Package[] {
  const extendedNames = new Set<string>();
  
  // Collect all class names that are extended in the main manifest
  if (mainManifest.modules) {
    for (const module of mainManifest.modules) {
      if (module.declarations) {
        for (const declaration of module.declarations) {
          if (declaration.kind === "class" && "superclass" in declaration && declaration.superclass) {
            extendedNames.add(declaration.superclass.name);
          }
        }
      }
    }
  }

  // Filter external manifests to only include relevant declarations
  return externalManifests.map(manifest => ({
    ...manifest,
    modules: manifest.modules?.map(module => ({
      ...module,
      declarations: module.declarations?.filter(declaration => 
        extendedNames.has(declaration.name)
      )
    })).filter(module => module.declarations && module.declarations.length > 0)
  })).filter(manifest => manifest.modules && manifest.modules.length > 0);
}
