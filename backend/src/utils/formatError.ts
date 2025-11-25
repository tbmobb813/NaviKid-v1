export function formatError(error: unknown): { message: string; errorObj: Error } {
  if (error instanceof Error) {
    return { message: error.message, errorObj: error };
  }

  try {
    const str = typeof error === 'string' ? error : JSON.stringify(error);
    return { message: str, errorObj: new Error(str) };
  } catch (e) {
    const fallback = String(error);
    return { message: fallback, errorObj: new Error(fallback) };
  }
}
