/**
 * Cuando una edge function responde con error HTTP, supabase-js oculta el cuerpo tras un
 * mensaje genérico. Esto extrae el `error` que devolvió la función, si lo hay.
 */
export async function readFunctionError(error: unknown): Promise<string | null> {
  const context = (error as { context?: { json?: () => Promise<{ error?: string }> } } | null)?.context;
  try {
    const body = await context?.json?.();
    return body?.error ?? null;
  } catch {
    return null;
  }
}
