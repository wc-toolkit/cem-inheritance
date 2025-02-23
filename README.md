<div align="center">
  
![workbench with tools, html, css, javascript, and typescript logos](https://raw.githubusercontent.com/wc-toolkit/cem-inheritance/refs/heads/main/assets/wc-toolkit_ts.png)

</div>

# WC Toolkit CEM Inheritance

This tool maps inherited content (including class members, attributes, CSS parts, CSS variables, slots, and events) from parent components in the Custom Elements Manifest (CEM).
This helps in maintaining a clear and comprehensive documentation of web components and their inheritance hierarchy and reduces the need for duplicate documentation for component with shared APIs.

## Features

- Automatically updates the Custom Elements Manifest with inherited properties.
- Supports various inheritance types including class members, attributes, CSS parts, CSS variables, slots, and events.
- Configurable options to customize the inheritance mapping process.
- Integrates with JSDoc tags for additional customization.

## Installation

To install the package, use the following command:

```bash
npm install @wc-toolkit/cem-inheritance
```

## Usage

This package includes two ways to update the Custom Elements Manifest:

1. using it in a script
2. as a plugin for the [Custom Element Manifest Analyzer](https://custom-elements-manifest.open-wc.org/).

### Script

```js
// my-script.js

import { updateCemInheritance } from "@wc-toolkit/cem-inheritance";
import manifest from "./path/to/custom-elements.json" with { type: 'json' };

const options = {...};

updateCemInheritance(manifest, options);
```

### CEM Analyzer

The plugin can be added to the [Custom Elements Manifest Analyzer configuration file](https://custom-elements-manifest.open-wc.org/analyzer/config/#config-file).

```js
// custom-elements-manifest.config.js

import { cemInheritancePlugin } from "@wc-toolkit/cem-inheritance";

const options = {...};

export default {
  /** Enable this if you are extending a third-party library */
  dependencies: true,
  plugins: [
    cemInheritancePlugin(options)
  ],
};
```

<div style="text-align: center; margin-top: 32px;">
  <a href="https://stackblitz.com/edit/stackblitz-starters-57ju3afb?file=README.md" target="_blank">
    <img
      alt="Open in StackBlitz"
      src="https://developer.stackblitz.com/img/open_in_stackblitz.svg"
    />
  </a>
</div>

Check out the [documentation](https://wc-toolkit.com/documentation/cem-inheritance) to see how to configure this to meet your project's needs.
