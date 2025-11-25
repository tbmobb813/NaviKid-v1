/**
 * Helpers to safely convert unknown values into Record<string, unknown>
 * without asserting unsafe casts throughout the codebase.
 */

export function safeToRecord(value: unknown): Record<string, unknown> | undefined {
  if (value && typeof value === 'object' && !Array.isArray(value)) {
    return value as Record<string, unknown>;
  }
  return undefined;
}

export default safeToRecord;
