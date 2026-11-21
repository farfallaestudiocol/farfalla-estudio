-- Evidencia de la autorización para el tratamiento de datos personales (Ley 1581 de 2012;
-- Decreto 1377 de 2013, art. 8): cuándo se autorizó y qué versión del texto se mostró.
-- accepted_terms_at (que ya existía) queda como la fecha de aceptación de los términos y
-- condiciones; la autorización de datos se guarda aparte porque son consentimientos distintos.
ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS accepted_privacy_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS policy_version TEXT;
