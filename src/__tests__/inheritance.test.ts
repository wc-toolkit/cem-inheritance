/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, expect, test } from "vitest";
import cem from '../../demo/custom-elements.json' with { type: 'json' };
import shoelaceCem from '../../demo/src/shoelace-cem.json' with { type: 'json' };
import extMixinCem from '../../demo/src/ext-mixin-cem.json' with { type: 'json' };
import { getComponentByClassName, getComponentPublicProperties } from "@wc-toolkit/cem-utilities";
import { generateUpdatedCem } from "../../src/inheritance";


describe('cem-inheritance', () => {
  const updatedCem = generateUpdatedCem(cem, {
    externalManifests: [
      shoelaceCem,
      extMixinCem,
    ]
  });

  const extendedCem = generateUpdatedCem(cem, {
    includeExternalManifests: true,
    externalManifests: [
      shoelaceCem,
      extMixinCem,
    ]
  });

  test('should inherit APIs from parent', () => {
    // Arrange
    const component = getComponentByClassName(updatedCem, 'MyExtComponent');
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
    const component = getComponentByClassName(updatedCem, 'MyConfigOmitComponent');
    const properties = getComponentPublicProperties(component!);
      
    // Act
    
    // Assert
    expect(properties.length).toEqual(4);
    expect(component?.cssParts?.length).toEqual(2);
    expect(component?.cssProperties?.length).toEqual(2);
    expect(component?.events?.length).toEqual(1);
    expect(component?.slots?.length).toEqual(1);
  });

  test('should omit APIs based on JSDoc tags', () => {
    // Arrange
    const component = getComponentByClassName(updatedCem, 'MyJsDocOmitComponent');
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
    const component = getComponentByClassName(updatedCem, 'MyExtJsDocOmitComponent');
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
    const component = getComponentByClassName(updatedCem, 'MyMixinComponent');
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
    expect(properties.length).toEqual(9);
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

  test('should handle class name aliases', () => {
    // Arrange
    const updatedCemWithAlias = generateUpdatedCem(cem, {
      externalManifests: [
        shoelaceCem,
        extMixinCem,
      ],
      aliasMap: {
        'ShoelaceElement': 'ShoelaceBase',
        'ExtMixin': 'RenamedExtMixin'
      }
    });

    const component = getComponentByClassName(updatedCemWithAlias, 'MyExtComponent');
    const properties = getComponentPublicProperties(component!);
      
    // Act
    
    // Assert
    expect(properties.length).toEqual(4);
    expect(component?.cssParts?.length).toEqual(2);
    expect(component?.cssProperties?.length).toEqual(2);
    expect(component?.events?.length).toEqual(1);
    expect(component?.slots?.length).toEqual(1);
  });

  test('resolveParent should prefer externalMap when cemMap entry === component', async () => {
    // Arrange: create a fake component and duplicate parent entries
    const component = { name: 'DuplicateParent' } as any; // same object identity simulated by reference

    // cemMap contains the same object reference as the component
    const cemMap = new Map<string, any>();
    cemMap.set('DuplicateParent', component);

    // externalMap contains a different object representing the real parent
    const externalParent = { name: 'DuplicateParent', members: [{ name: 'x' }] } as any;
    const externalMap = new Map<string, any>();
    externalMap.set('DuplicateParent', externalParent);

  // Act: dynamically import the helper from the module under test
  const mod = await import('../../src/inheritance');
  const resolved = mod.resolveParent('DuplicateParent', component, cemMap, externalMap);

    // Assert: should return the external parent, not the cemMap component
    expect(resolved).toBe(externalParent);
  });

  test('resolveParent should honor aliasMap when resolving parent names', async () => {
    // Arrange: prepare small maps and an aliasMap to pass directly
    const aliasMap = { AliasedParent: 'RealParent' } as Record<string, string>;

    const component = { name: 'Child' } as any;

    // cemMap maps RealParent to a component (not the same as component)
    const realParent = { name: 'RealParent', members: [] } as any;
    const cemMap = new Map<string, any>();
    cemMap.set('RealParent', realParent);

    // externalMap contains another RealParent entry
    const externalParent = { name: 'RealParent', members: [{ name: 'y' }] } as any;
    const externalMap = new Map<string, any>();
    externalMap.set('RealParent', externalParent);

    // Act: use resolveParent with the aliased name and pass aliasMap directly
    const mod = await import('../../src/inheritance');
    const resolved = mod.resolveParent('AliasedParent', component, cemMap, externalMap, aliasMap);

    // Assert: resolved should be the cemMap entry (since cemMap entry != component),
    // and alias should be applied to map to 'RealParent'
    expect(resolved).toBe(realParent);
  });
});