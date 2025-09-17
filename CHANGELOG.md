# @wc-toolkit/cem-inheritance

## 1.2.1

### Patch Changes

- 85987b1: Fixed inheritance when using the `aliasMap`

## 1.2.0

### Minor Changes

- 24a4754: Added new `aliasMap` setting to map renamed extended class names

## 1.1.0

### Minor Changes

- 5beb9c1: Added `includeExternalManifests` option to include all modules from externla manifests

## 1.0.4

### Patch Changes

- b1a26a5: fixed issue where local properties and methods were being omitted

## 1.0.3

### Patch Changes

- 116ce77: Fixed issue where mixins aren't inheriting from external manifests
- 116ce77: Fixed problem where multiple manifests are passed to the configuration

## 1.0.2

### Patch Changes

- 5655ba4: Fixed logic for inheriting from an external manifest

## 1.0.1

### Patch Changes

- 3f987c1: Exported missing types and `updateCemInheritance` function for CI builds
- 3f987c1: Fixed mixin inheritance
- 3f987c1: Deprecated `Options` type and replaced it with `CemInheritanceOptions`

## 1.0.0

### Major Changes

- d825e4a: Initial commit

## 1.0.0

### Major Changes

- 609c34a: Initial commit
