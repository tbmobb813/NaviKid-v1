/*
 * Small runtime helper to resolve a constructor export from a CJS or ESM module.
 * This concentrates the required escape hatch in one place and keeps callers
 * free of repeated `(mod as unknown as { default?: ... }).default ?? ...` patterns.
 */
export function getCtorFromModule<T = unknown>(mod: unknown): new (...args: unknown[]) => T {
  // keep the `any` escape in one small helper
  const maybeDefault = (mod as any)?.default;
  const ctor = maybeDefault ?? (mod as any);
  if (typeof ctor !== 'function') {
    throw new Error('Module does not export a constructor');
  }
  return ctor as new (...args: unknown[]) => T;
}


