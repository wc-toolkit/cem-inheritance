---
"@wc-toolkit/cem-inheritance": patch
---

Read declarations straight from the manifest instead of via `getAllComponents`

Inheritance is applied by mutating declaration objects in place —
`packageLinkPhase` discards the return value of `updateCemInheritance`, so
mutating the analyzer's manifest is the plugin's only output channel.

`@wc-toolkit/cem-utilities` 1.6.0 made `getAllComponents` return shallow copies
of the declarations rather than references into the manifest. Because the
dependency range is `^1.2.0`, every consumer installing fresh resolved 1.6.0 and
got a manifest with no inherited API — no error, no warning. Elements wrapping an
external base class were left with the `attributes`, `events`, `slots`,
`cssParts` and `cssProperties` keys absent entirely.

`getDeclarations` now walks `cem.modules[].declarations[]` itself, matching what
`resolveMixinVariableSuperclasses` already does, so the plugin no longer depends
on `getAllComponents`' reference semantics. The committed `demo` manifest loses
its `modulePath` entries as a result — those were never the plugin's to write.
