// Configuración compartida del frontend. La URL del proyecto viene de las variables
// de entorno de Vite; el valor por defecto evita romper entornos que no la definan.
export const SUPABASE_URL: string =
  import.meta.env.VITE_SUPABASE_URL || 'https://zvzmnqcbmhpddrpfjrzr.supabase.co';

/** URL pública de una edge function, p. ej. functionUrl('google-drive-proxy'). */
export const functionUrl = (name: string): string => `${SUPABASE_URL}/functions/v1/${name}`;
