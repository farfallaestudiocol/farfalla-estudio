// Información legal del portal: versión de las políticas y datos del responsable.

/**
 * Versión vigente de la Política de Tratamiento de Datos Personales y de los Términos y
 * Condiciones. Se guarda en cada pedido y registro como prueba de qué texto aceptó el
 * titular (Decreto 1377 de 2013, art. 8: conservar prueba de la autorización).
 * Al cambiar el contenido de las páginas legales, actualizar esta fecha (AAAA-MM-DD).
 */
export const POLICY_VERSION = '2026-11-21';

const MONTHS = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];

export function formatPolicyDate(version: string = POLICY_VERSION): string {
  const [y, m, d] = version.split('-').map(Number);
  return `${d} de ${MONTHS[m - 1]} de ${y}`;
}

export const isValidPolicyVersion = (v: unknown): v is string => typeof v === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(v);

// Lo que se guarda en site_settings (público: es información que la ley obliga a mostrar).
export interface LegalSettings {
  company_name?: string;
  contact_email?: string;
  contact_phone?: string;
  contact_city?: string;
  contact_address?: string;
  legal_company_name?: string;
  legal_nit?: string;
  legal_address?: string;
  legal_privacy_email?: string;
}

export interface LegalInfo {
  brandName: string; // nombre comercial
  legalName: string; // razón social o nombre del titular
  nit: string; // '' si aún no se ha configurado
  address: string;
  city: string;
  email: string; // canal para consultas y reclamos de datos personales
  phone: string;
}

const clean = (v: string | undefined | null) => (v ?? '').trim();

/** Datos del responsable del tratamiento, con los datos de contacto de la tienda como respaldo. */
export function resolveLegalInfo(s: LegalSettings | null | undefined): LegalInfo {
  const brandName = clean(s?.company_name) || 'Farfalla Estudio';
  return {
    brandName,
    legalName: clean(s?.legal_company_name) || brandName,
    nit: clean(s?.legal_nit),
    address: clean(s?.legal_address) || clean(s?.contact_address),
    city: clean(s?.contact_city) || 'Bogotá',
    email: clean(s?.legal_privacy_email) || clean(s?.contact_email),
    phone: clean(s?.contact_phone),
  };
}

/**
 * Datos que la ley espera ver identificados y que todavía faltan. Se usa en el administrador
 * para avisar antes de publicar: una política sin responsable identificado no cumple.
 */
export function missingLegalFields(s: LegalSettings | null | undefined): string[] {
  const info = resolveLegalInfo(s);
  const missing: string[] = [];
  if (!clean(s?.legal_company_name)) missing.push('Razón social o nombre completo del titular del negocio');
  if (!info.nit) missing.push('NIT o número de documento');
  if (!info.address) missing.push('Dirección');
  if (!info.email) missing.push('Correo para consultas y reclamos de datos personales');
  if (!info.phone) missing.push('Teléfono de contacto');
  return missing;
}
