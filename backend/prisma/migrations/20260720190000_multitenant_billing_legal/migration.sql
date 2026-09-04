-- Incremental migration: multitenant billing + legal
-- Assumes base template tables already exist

CREATE TABLE "cat_locale" (
    "id_cat_locale" SERIAL NOT NULL,
    "codigo" VARCHAR(16) NOT NULL,
    "nombre" VARCHAR(100) NOT NULL,
    "activo" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "cat_locale_pkey" PRIMARY KEY ("id_cat_locale")
);

CREATE TABLE "cat_moneda" (
    "id_cat_moneda" SERIAL NOT NULL,
    "codigo" VARCHAR(8) NOT NULL,
    "nombre" VARCHAR(100) NOT NULL,
    "simbolo" VARCHAR(8),
    "activo" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "cat_moneda_pkey" PRIMARY KEY ("id_cat_moneda")
);

CREATE TABLE "cat_planes_suscripcion" (
    "id_cat_plan_suscripcion" SERIAL NOT NULL,
    "nombre" VARCHAR(50) NOT NULL,
    "precio_mensual" DECIMAL(10,2) NOT NULL,
    "limite_horas_ia" INTEGER DEFAULT 0,
    "limite_storage_gb" INTEGER DEFAULT 0,
    "limite_users" INTEGER DEFAULT 0,
    "activo" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "cat_planes_suscripcion_pkey" PRIMARY KEY ("id_cat_plan_suscripcion")
);

CREATE TABLE "cat_estatus_suscripcion" (
    "id_cat_estatus_suscripcion" SERIAL NOT NULL,
    "codigo" VARCHAR(50) NOT NULL,
    "nombre" VARCHAR(100) NOT NULL,
    "orden" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "cat_estatus_suscripcion_pkey" PRIMARY KEY ("id_cat_estatus_suscripcion")
);

CREATE TABLE "cat_estatus_pago_suscripcion" (
    "id_cat_estatus_pago_suscripcion" SERIAL NOT NULL,
    "codigo" VARCHAR(50) NOT NULL,
    "nombre" VARCHAR(100) NOT NULL,
    "orden" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "cat_estatus_pago_suscripcion_pkey" PRIMARY KEY ("id_cat_estatus_pago_suscripcion")
);

CREATE TABLE "cat_intervalo_facturacion" (
    "id_cat_intervalo_facturacion" SERIAL NOT NULL,
    "codigo" VARCHAR(50) NOT NULL,
    "nombre" VARCHAR(100) NOT NULL,
    "orden" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "cat_intervalo_facturacion_pkey" PRIMARY KEY ("id_cat_intervalo_facturacion")
);

CREATE TABLE "cat_proveedor_pago" (
    "id_cat_proveedor_pago" SERIAL NOT NULL,
    "codigo" VARCHAR(50) NOT NULL,
    "nombre" VARCHAR(100) NOT NULL,
    "orden" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "cat_proveedor_pago_pkey" PRIMARY KEY ("id_cat_proveedor_pago")
);

CREATE TABLE "cat_tipo_linea_suscripcion" (
    "id_cat_tipo_linea_suscripcion" SERIAL NOT NULL,
    "codigo" VARCHAR(50) NOT NULL,
    "nombre" VARCHAR(100) NOT NULL,
    "orden" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "cat_tipo_linea_suscripcion_pkey" PRIMARY KEY ("id_cat_tipo_linea_suscripcion")
);

CREATE TABLE "cat_paquetes_cuota" (
    "id_cat_paquete_cuota" SERIAL NOT NULL,
    "codigo" VARCHAR(64) NOT NULL,
    "nombre" VARCHAR(200) NOT NULL,
    "tipo" VARCHAR(32) NOT NULL,
    "cantidad" INTEGER NOT NULL,
    "precio_mensual_mxn" DECIMAL(12,2) NOT NULL,
    "orden" INTEGER NOT NULL DEFAULT 0,
    "activo" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "cat_paquetes_cuota_pkey" PRIMARY KEY ("id_cat_paquete_cuota")
);

CREATE TABLE "cat_tipos_documento" (
    "id_cat_tipo_documento" SERIAL NOT NULL,
    "codigo" VARCHAR(64) NOT NULL,
    "nombre" VARCHAR(150) NOT NULL,
    "orden" INTEGER NOT NULL DEFAULT 0,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "f_reg" TIMESTAMPTZ(6),

    CONSTRAINT "cat_tipos_documento_pkey" PRIMARY KEY ("id_cat_tipo_documento")
);

CREATE TABLE "suscripciones" (
    "id_suscripcion" SERIAL NOT NULL,
    "fk_id_institucion" INTEGER NOT NULL,
    "fk_id_cat_plan_suscripcion" INTEGER,
    "fk_id_cat_estatus_suscripcion" INTEGER NOT NULL,
    "fk_id_cat_intervalo_facturacion" INTEGER,
    "fk_id_cat_proveedor_pago" INTEGER,
    "fecha_inicio" TIMESTAMPTZ(6) NOT NULL,
    "fecha_fin" TIMESTAMPTZ(6),
    "fecha_proximo_cobro" TIMESTAMPTZ(6),
    "stripe_subscription_id" VARCHAR(255),
    "stripe_customer_id" VARCHAR(255),
    "precio_total_mensual_snapshot" DECIMAL(12,2),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "suscripciones_pkey" PRIMARY KEY ("id_suscripcion")
);

CREATE TABLE "suscripciones_detalle" (
    "id_suscripcion_detalle" SERIAL NOT NULL,
    "fk_id_suscripcion" INTEGER NOT NULL,
    "fk_id_cat_tipo_linea_suscripcion" INTEGER NOT NULL,
    "fk_id_modulo" INTEGER,
    "fk_id_submodulo" INTEGER,
    "fk_id_cat_paquete_cuota" INTEGER,
    "cantidad" INTEGER,
    "precio_unitario_mensual" DECIMAL(12,2),
    "precio_linea_mensual" DECIMAL(12,2),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "suscripciones_detalle_pkey" PRIMARY KEY ("id_suscripcion_detalle")
);

CREATE TABLE "pagos_suscripciones" (
    "id_pago_suscripcion" SERIAL NOT NULL,
    "fk_id_institucion" INTEGER NOT NULL,
    "monto" DECIMAL(10,2) NOT NULL,
    "moneda" VARCHAR(10) NOT NULL DEFAULT 'mxn',
    "status" VARCHAR(50) NOT NULL,
    "fecha_pago" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "metodo_pago" VARCHAR(50) NOT NULL DEFAULT 'stripe',
    "stripe_session_id" VARCHAR(255),
    "intervalo" VARCHAR(20),
    "fk_id_suscripcion" INTEGER,
    "fk_id_cat_estatus_pago_suscripcion" INTEGER,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "pagos_suscripciones_pkey" PRIMARY KEY ("id_pago_suscripcion")
);

CREATE TABLE "rel_cat_plan_suscripcion_submodulo" (
    "id_rel_cat_plan_suscripcion_submodulo" SERIAL NOT NULL,
    "fk_id_cat_plan_suscripcion" INTEGER NOT NULL,
    "fk_id_submodulo" INTEGER NOT NULL,
    "fk_id_cat_tipo_usuario" INTEGER NOT NULL,
    "f_reg" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "vigente" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "rel_cat_plan_suscripcion_submodulo_pkey" PRIMARY KEY ("id_rel_cat_plan_suscripcion_submodulo")
);

CREATE TABLE "aceptacion_documentos" (
    "id" SERIAL NOT NULL,
    "fk_id_usuario" INTEGER NOT NULL,
    "fk_id_cat_tipo_documento" INTEGER NOT NULL,
    "version" TEXT NOT NULL,
    "ip_address" TEXT,
    "fecha_aceptacion" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "aceptacion_documentos_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "configuracion_documentos" (
    "id" SERIAL NOT NULL,
    "fk_id_cat_tipo_usuario" INTEGER NOT NULL,
    "fk_id_cat_tipo_documento" INTEGER NOT NULL,
    "obligatorio" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "configuracion_documentos_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "tenant_documentos_legales" (
    "id_tenant_documento_legal" SERIAL NOT NULL,
    "fk_id_institucion" INTEGER NOT NULL,
    "fk_id_cat_tipo_documento" INTEGER NOT NULL,
    "version" VARCHAR(32) NOT NULL,
    "titulo" JSONB,
    "contenido_html" JSONB,
    "fk_id_archivo" INTEGER,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "vigente_desde" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "f_reg" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "f_mod" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "tenant_documentos_legales_pkey" PRIMARY KEY ("id_tenant_documento_legal")
);

CREATE UNIQUE INDEX "cat_locale_codigo_key" ON "cat_locale"("codigo");
CREATE UNIQUE INDEX "cat_moneda_codigo_key" ON "cat_moneda"("codigo");
CREATE UNIQUE INDEX "cat_estatus_suscripcion_codigo_key" ON "cat_estatus_suscripcion"("codigo");
CREATE UNIQUE INDEX "cat_estatus_pago_suscripcion_codigo_key" ON "cat_estatus_pago_suscripcion"("codigo");
CREATE UNIQUE INDEX "cat_intervalo_facturacion_codigo_key" ON "cat_intervalo_facturacion"("codigo");
CREATE UNIQUE INDEX "cat_proveedor_pago_codigo_key" ON "cat_proveedor_pago"("codigo");
CREATE UNIQUE INDEX "cat_tipo_linea_suscripcion_codigo_key" ON "cat_tipo_linea_suscripcion"("codigo");
CREATE UNIQUE INDEX "cat_paquetes_cuota_codigo_key" ON "cat_paquetes_cuota"("codigo");
CREATE UNIQUE INDEX "cat_tipos_documento_codigo_key" ON "cat_tipos_documento"("codigo");
CREATE INDEX "instituciones_fk_id_cat_plan_suscripcion_idx" ON "instituciones"("fk_id_cat_plan_suscripcion");
CREATE INDEX "suscripciones_fk_id_institucion_idx" ON "suscripciones"("fk_id_institucion");
CREATE INDEX "suscripciones_fk_id_cat_estatus_suscripcion_idx" ON "suscripciones"("fk_id_cat_estatus_suscripcion");
CREATE INDEX "suscripciones_detalle_fk_id_suscripcion_idx" ON "suscripciones_detalle"("fk_id_suscripcion");
CREATE INDEX "pagos_suscripciones_fk_id_institucion_idx" ON "pagos_suscripciones"("fk_id_institucion");
CREATE INDEX "pagos_suscripciones_stripe_session_id_idx" ON "pagos_suscripciones"("stripe_session_id");
CREATE INDEX "rel_cat_plan_suscripcion_submodulo_fk_id_cat_plan_suscripci_idx" ON "rel_cat_plan_suscripcion_submodulo"("fk_id_cat_plan_suscripcion");
CREATE INDEX "rel_cat_plan_suscripcion_submodulo_fk_id_submodulo_idx" ON "rel_cat_plan_suscripcion_submodulo"("fk_id_submodulo");
CREATE INDEX "aceptacion_documentos_fk_id_usuario_idx" ON "aceptacion_documentos"("fk_id_usuario");
CREATE UNIQUE INDEX "aceptacion_documentos_fk_id_usuario_fk_id_cat_tipo_document_key" ON "aceptacion_documentos"("fk_id_usuario", "fk_id_cat_tipo_documento", "version");
CREATE UNIQUE INDEX "configuracion_documentos_fk_id_cat_tipo_usuario_fk_id_cat_t_key" ON "configuracion_documentos"("fk_id_cat_tipo_usuario", "fk_id_cat_tipo_documento");
CREATE INDEX "tenant_documentos_legales_fk_id_institucion_idx" ON "tenant_documentos_legales"("fk_id_institucion");
CREATE INDEX "tenant_documentos_legales_fk_id_cat_tipo_documento_idx" ON "tenant_documentos_legales"("fk_id_cat_tipo_documento");
ALTER TABLE "instituciones" ADD CONSTRAINT "instituciones_fk_id_cat_plan_suscripcion_fkey" FOREIGN KEY ("fk_id_cat_plan_suscripcion") REFERENCES "cat_planes_suscripcion"("id_cat_plan_suscripcion") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "instituciones" ADD CONSTRAINT "instituciones_fk_id_cat_locale_default_fkey" FOREIGN KEY ("fk_id_cat_locale_default") REFERENCES "cat_locale"("id_cat_locale") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "instituciones" ADD CONSTRAINT "instituciones_fk_id_cat_moneda_fkey" FOREIGN KEY ("fk_id_cat_moneda") REFERENCES "cat_moneda"("id_cat_moneda") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "suscripciones" ADD CONSTRAINT "suscripciones_fk_id_institucion_fkey" FOREIGN KEY ("fk_id_institucion") REFERENCES "instituciones"("id_institucion") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "suscripciones" ADD CONSTRAINT "suscripciones_fk_id_cat_plan_suscripcion_fkey" FOREIGN KEY ("fk_id_cat_plan_suscripcion") REFERENCES "cat_planes_suscripcion"("id_cat_plan_suscripcion") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "suscripciones" ADD CONSTRAINT "suscripciones_fk_id_cat_estatus_suscripcion_fkey" FOREIGN KEY ("fk_id_cat_estatus_suscripcion") REFERENCES "cat_estatus_suscripcion"("id_cat_estatus_suscripcion") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "suscripciones" ADD CONSTRAINT "suscripciones_fk_id_cat_intervalo_facturacion_fkey" FOREIGN KEY ("fk_id_cat_intervalo_facturacion") REFERENCES "cat_intervalo_facturacion"("id_cat_intervalo_facturacion") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "suscripciones" ADD CONSTRAINT "suscripciones_fk_id_cat_proveedor_pago_fkey" FOREIGN KEY ("fk_id_cat_proveedor_pago") REFERENCES "cat_proveedor_pago"("id_cat_proveedor_pago") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "suscripciones_detalle" ADD CONSTRAINT "suscripciones_detalle_fk_id_suscripcion_fkey" FOREIGN KEY ("fk_id_suscripcion") REFERENCES "suscripciones"("id_suscripcion") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "suscripciones_detalle" ADD CONSTRAINT "suscripciones_detalle_fk_id_cat_tipo_linea_suscripcion_fkey" FOREIGN KEY ("fk_id_cat_tipo_linea_suscripcion") REFERENCES "cat_tipo_linea_suscripcion"("id_cat_tipo_linea_suscripcion") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "suscripciones_detalle" ADD CONSTRAINT "suscripciones_detalle_fk_id_cat_paquete_cuota_fkey" FOREIGN KEY ("fk_id_cat_paquete_cuota") REFERENCES "cat_paquetes_cuota"("id_cat_paquete_cuota") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "suscripciones_detalle" ADD CONSTRAINT "suscripciones_detalle_fk_id_modulo_fkey" FOREIGN KEY ("fk_id_modulo") REFERENCES "modulos"("id_modulo") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "suscripciones_detalle" ADD CONSTRAINT "suscripciones_detalle_fk_id_submodulo_fkey" FOREIGN KEY ("fk_id_submodulo") REFERENCES "submodulos"("id_submodulo") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "pagos_suscripciones" ADD CONSTRAINT "pagos_suscripciones_fk_id_institucion_fkey" FOREIGN KEY ("fk_id_institucion") REFERENCES "instituciones"("id_institucion") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "pagos_suscripciones" ADD CONSTRAINT "pagos_suscripciones_fk_id_suscripcion_fkey" FOREIGN KEY ("fk_id_suscripcion") REFERENCES "suscripciones"("id_suscripcion") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "pagos_suscripciones" ADD CONSTRAINT "pagos_suscripciones_fk_id_cat_estatus_pago_suscripcion_fkey" FOREIGN KEY ("fk_id_cat_estatus_pago_suscripcion") REFERENCES "cat_estatus_pago_suscripcion"("id_cat_estatus_pago_suscripcion") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "rel_cat_plan_suscripcion_submodulo" ADD CONSTRAINT "rel_cat_plan_suscripcion_submodulo_fk_id_cat_plan_suscripc_fkey" FOREIGN KEY ("fk_id_cat_plan_suscripcion") REFERENCES "cat_planes_suscripcion"("id_cat_plan_suscripcion") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "rel_cat_plan_suscripcion_submodulo" ADD CONSTRAINT "rel_cat_plan_suscripcion_submodulo_fk_id_submodulo_fkey" FOREIGN KEY ("fk_id_submodulo") REFERENCES "submodulos"("id_submodulo") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "rel_cat_plan_suscripcion_submodulo" ADD CONSTRAINT "rel_cat_plan_suscripcion_submodulo_fk_id_cat_tipo_usuario_fkey" FOREIGN KEY ("fk_id_cat_tipo_usuario") REFERENCES "cat_tipo_usuario"("id_cat_tipo_usuario") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "aceptacion_documentos" ADD CONSTRAINT "aceptacion_documentos_fk_id_usuario_fkey" FOREIGN KEY ("fk_id_usuario") REFERENCES "usuarios"("id_usuario") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "aceptacion_documentos" ADD CONSTRAINT "aceptacion_documentos_fk_id_cat_tipo_documento_fkey" FOREIGN KEY ("fk_id_cat_tipo_documento") REFERENCES "cat_tipos_documento"("id_cat_tipo_documento") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "configuracion_documentos" ADD CONSTRAINT "configuracion_documentos_fk_id_cat_tipo_usuario_fkey" FOREIGN KEY ("fk_id_cat_tipo_usuario") REFERENCES "cat_tipo_usuario"("id_cat_tipo_usuario") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "configuracion_documentos" ADD CONSTRAINT "configuracion_documentos_fk_id_cat_tipo_documento_fkey" FOREIGN KEY ("fk_id_cat_tipo_documento") REFERENCES "cat_tipos_documento"("id_cat_tipo_documento") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "tenant_documentos_legales" ADD CONSTRAINT "tenant_documentos_legales_fk_id_institucion_fkey" FOREIGN KEY ("fk_id_institucion") REFERENCES "instituciones"("id_institucion") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "tenant_documentos_legales" ADD CONSTRAINT "tenant_documentos_legales_fk_id_cat_tipo_documento_fkey" FOREIGN KEY ("fk_id_cat_tipo_documento") REFERENCES "cat_tipos_documento"("id_cat_tipo_documento") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "tenant_documentos_legales" ADD CONSTRAINT "tenant_documentos_legales_fk_id_archivo_fkey" FOREIGN KEY ("fk_id_archivo") REFERENCES "archivos"("id_archivo") ON DELETE SET NULL ON UPDATE CASCADE;

