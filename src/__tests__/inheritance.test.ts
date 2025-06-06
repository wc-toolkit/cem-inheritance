/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, expect, test } from "vitest";
import cem from '../../demo/custom-elements.json' with { type: 'json' };
import shoelaceCem from '../../demo/src/shoelace-cem.json' with { type: 'json' };
import extMixinCem from '../../demo/src/ext-mixin-cem.json' with { type: 'json' };
import { getComponentByClassName, getComponentPublicProperties } from "@wc-toolkit/cem-utilities";
import { generateUpdatedCem } from "../../src/inheritance";


describe('cem-inheritance', () => {
  const updatedCem = generateUpdatedCem({...cem}, {
    externalManifests: [
      shoelaceCem,
      extMixinCem,
    ]
  });

  const extendedCem = generateUpdatedCem({...cem}, {
    includeExternalManifests: true,
    externalManifests: [
      shoelaceCem,
      extMixinCem,
    ]
  });

  test('should inherit APIs from parent', () => {
    // Arrange
    const component = getComponentByClassName(cem, 'MyExtComponent');
    const properties = getComponentPublicProperties(component!);
      
    // Act
    
    // Assert
    expect(properties.length).toEqual(4);
    expect(component?.cssParts?.length).toEqual(2);
    expect(component?.cssProperties?.length).toEqual(2);
    expect(component?.events?.length).toEqual(1);
    expect(component?.slots?.length).toEqual(1);
  });

  test('should omit APIs based on CEM config', () => {
    // Arrange
    const component = getComponentByClassName(cem, 'MyConfigOmitComponent');
    const properties = getComponentPublicProperties(component!);
      
    // Act
    
    // Assert
    expect(properties.length).toEqual(4);
    expect(component?.cssParts?.length).toEqual(1);
    expect(component?.cssProperties?.length).toEqual(1);
    expect(component?.events?.length).toEqual(0);
    expect(component?.slots?.length).toEqual(1);
  });

  test('should omit APIs based on JSDoc tags', () => {
    // Arrange
    const component = getComponentByClassName(cem, 'MyJsDocOmitComponent');
    const properties = getComponentPublicProperties(component!);
      
    // Act
    
    // Assert
    expect(properties.length).toEqual(3);
    expect(component?.cssParts?.length).toEqual(1);
    expect(component?.cssProperties?.length).toEqual(1);
    expect(component?.events?.length).toEqual(0);
    expect(component?.slots?.length).toEqual(1);
  });

  test('should omit APIs based on parent omissions', () => {
    // Arrange
    const component = getComponentByClassName(cem, 'MyExtJsDocOmitComponent');
    const properties = getComponentPublicProperties(component!);
      
    // Act
    
    // Assert
    expect(properties.length).toEqual(3);
    expect(component?.cssParts?.length).toEqual(1);
    expect(component?.cssProperties?.length).toEqual(1);
    expect(component?.events?.length).toEqual(0);
    expect(component?.slots?.length).toEqual(1);
  });

  test('should include APIs from parent and mixin', () => {
    // Arrange
    const component = getComponentByClassName(cem, 'MyMixinComponent');
    const properties = getComponentPublicProperties(component!);
      
    // Act
    
    // Assert
    expect(properties.length).toEqual(9);
  });

  test('should include APIs from parent and mixin', () => {
    // Arrange
    const component = getComponentByClassName(updatedCem, 'MyExternalMixinComponent');
    const properties = getComponentPublicProperties(component!);
      
    // Act
    
    // Assert
    expect(properties.length).toEqual(10);
  });

  test('should include external manifest declarations when `includeExternalManifests` is "true"', () => {
    // Arrange
    const originalModuleCount = (updatedCem as any).modules?.length || 0;
    const extendedModuleCount = (extendedCem as any).modules?.length || 0;

    // Act

    // Assert
    expect(extendedModuleCount).toBeGreaterThan(originalModuleCount);
  });

  test('should not include external manifest declarations when `includeExternalManifests` is "false"', () => {
    // Arrange
    const cemWithoutExternal = generateUpdatedCem(cem, {
      includeExternalManifests: false,
      externalManifests: [
        shoelaceCem,
        extMixinCem,
      ]
    });
    
    const originalModuleCount = (cem as any).modules?.length || 0;
    const updatedModuleCount = (cemWithoutExternal as any).modules?.length || 0;
    
    // Act & Assert
    expect(updatedModuleCount).toEqual(originalModuleCount);
    
    // Check that no external module was added
    const externalModule = (cemWithoutExternal as any).modules?.find((module: any) => module.path === '_external');
    expect(externalModule).toBeUndefined();
  });
});