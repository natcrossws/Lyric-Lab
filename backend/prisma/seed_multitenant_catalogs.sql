-- Seed catálogos multitenant (billing + legales)
-- Idempotente: ON CONFLICT DO NOTHING donde hay unique

INSERT INTO cat_locale (codigo, nombre, activo) VALUES
  ('es-MX', 'Español (México)', true),
  ('en-US', 'English (US)', true)
ON CONFLICT (codigo) DO NOTHING;

INSERT INTO cat_moneda (codigo, nombre, simbolo, activo) VALUES
  ('MXN', 'Peso mexicano', '$', true),
  ('USD', 'US Dollar', 'US$', true)
ON CONFLICT (codigo) DO NOTHING;

INSERT INTO cat_estatus_suscripcion (codigo, nombre, orden) VALUES
  ('vigente', 'Vigente', 1),
  ('pendiente_pago', 'Pendiente de pago', 2),
  ('vencida', 'Vencida', 3),
  ('cancelada', 'Cancelada', 4)
ON CONFLICT (codigo) DO NOTHING;

INSERT INTO cat_estatus_pago_suscripcion (codigo, nombre, orden) VALUES
  ('completado', 'Completado', 1),
  ('pendiente', 'Pendiente', 2),
  ('fallido', 'Fallido', 3),
  ('reembolsado', 'Reembolsado', 4)
ON CONFLICT (codigo) DO NOTHING;

INSERT INTO cat_intervalo_facturacion (codigo, nombre, orden) VALUES
  ('mensual', 'Mensual', 1),
  ('anual', 'Anual', 2)
ON CONFLICT (codigo) DO NOTHING;

INSERT INTO cat_proveedor_pago (codigo, nombre, orden) VALUES
  ('stripe', 'Stripe', 1),
  ('mock', 'Mock / manual', 2)
ON CONFLICT (codigo) DO NOTHING;

INSERT INTO cat_tipo_linea_suscripcion (codigo, nombre, orden) VALUES
  ('plan_base', 'Plan base', 1),
  ('addon_modulo', 'Módulo adicional', 2),
  ('addon_submodulo', 'Submódulo adicional', 3),
  ('addon_cuota', 'Cuota adicional', 4),
  ('bundle', 'Paquete / bundle', 5)
ON CONFLICT (codigo) DO NOTHING;

INSERT INTO cat_tipos_documento (codigo, nombre, orden, activo, f_reg) VALUES
  ('AVISO_PRIVACIDAD', 'Aviso de privacidad', 1, true, NOW()),
  ('TERMINOS_CONDICIONES', 'Términos y condiciones', 2, true, NOW())
ON CONFLICT (codigo) DO NOTHING;

-- Planes demo (solo si la tabla está vacía)
INSERT INTO cat_planes_suscripcion (nombre, precio_mensual, limite_horas_ia, limite_storage_gb, limite_users, activo)
SELECT 'Básico', 499.00, 10, 5, 5, true
WHERE NOT EXISTS (SELECT 1 FROM cat_planes_suscripcion LIMIT 1);

INSERT INTO cat_planes_suscripcion (nombre, precio_mensual, limite_horas_ia, limite_storage_gb, limite_users, activo)
SELECT 'Profesional', 999.00, 50, 25, 25, true
WHERE (SELECT COUNT(*) FROM cat_planes_suscripcion) = 1;

-- Documentos obligatorios para admin institucional y global
INSERT INTO configuracion_documentos (fk_id_cat_tipo_usuario, fk_id_cat_tipo_documento, obligatorio)
SELECT tu.id_cat_tipo_usuario, td.id_cat_tipo_documento, true
FROM cat_tipo_usuario tu
CROSS JOIN cat_tipos_documento td
WHERE tu.id_cat_tipo_usuario IN (5, 6)
  AND td.codigo IN ('AVISO_PRIVACIDAD', 'TERMINOS_CONDICIONES')
ON CONFLICT (fk_id_cat_tipo_usuario, fk_id_cat_tipo_documento) DO NOTHING;
