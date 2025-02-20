export type Options = {
  /** Name of the updated CEM file - default is "custom-elements.json" */
  fileName?: string;
  /** Path to output directory */
  outdir?: string;
  /** Class names of any components you would like to exclude from inheritance */
  exclude?: string[];
  /** Aspects of your class that you would like to exclude from it and its children */
  omitByProperty?: OmittedProperties;
  /** Aspects of your class that you would like to exclude from it and its children */
  omitByComponent?: ClassOmit;
  /** Skip inheritance for an aspect of your components */
  ignore?: string[];
  /** External CEMs that your components extend */
  externalManifests?: unknown[];
  /** Shows process logs */
  debug?: boolean;
  /** Prevents plugin from executing */
  skip?: boolean;
  /** @internal Used to indicate if this is used as a CEM a plugin */
  usedByPlugin?: boolean;
};

export type ClassOmit = {
  [key: string]: OmittedApis;
};

export type OmittedProperties = {
  attributes?: string;
  cssParts?: string;
  cssProperties?: string;
  cssStates?: string;
  events?: string;
  methods?: string;
  properties?: string;
  slots?: string;
};

export type OmittedApis = Record<keyof OmittedProperties, string[]>;
