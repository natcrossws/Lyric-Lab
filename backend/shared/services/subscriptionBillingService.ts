export const GRACE_DAYS = parseInt(process.env.SUBSCRIPTION_GRACE_DAYS || '', 10) || 5;

export function startOfDay(d: Date | string | number): Date {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

export function addMonthsPreserveDay(date: Date, months: number): Date {
  const d = new Date(date);
  const day = d.getDate();
  d.setMonth(d.getMonth() + months);
  if (d.getDate() !== day) d.setDate(0);
  return startOfDay(d);
}

export function addDays(date: Date, days: number): Date {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return startOfDay(d);
}

export function computeProximoCobro(fechaPago: Date, intervalStripe: string = 'month'): Date {
  const base = startOfDay(fechaPago);
  if (intervalStripe === 'year') return addMonthsPreserveDay(base, 12);
  return addMonthsPreserveDay(base, 1);
}

export function computeFechaLimitePago(fechaProximoCobro: Date): Date {
  return addDays(startOfDay(fechaProximoCobro), GRACE_DAYS);
}

export interface EstadoCobro {
  tieneSuscripcionVigente: boolean;
  pagadoAlCorriente: boolean;
  puedePagar: boolean;
  enPeriodoGracia: boolean;
  pagoExtraordinario: boolean;
  fechaProximoPago: Date | null;
  fechaLimitePago: Date | null;
  fechaUltimoPago: Date | string | null;
  diasGracia: number;
}

export function evaluarEstadoCobro(
  suscripcionVigente: { fecha_proximo_cobro?: Date | string | null; fecha_inicio?: Date | string | null } | null | undefined,
  hoy: Date = new Date()
): EstadoCobro {
  const today = startOfDay(hoy);
  if (!suscripcionVigente?.fecha_proximo_cobro) {
    return {
      tieneSuscripcionVigente: false,
      pagadoAlCorriente: false,
      puedePagar: true,
      enPeriodoGracia: false,
      pagoExtraordinario: false,
      fechaProximoPago: null,
      fechaLimitePago: null,
      fechaUltimoPago: suscripcionVigente?.fecha_inicio || null,
      diasGracia: GRACE_DAYS
    };
  }
  const proximo = startOfDay(suscripcionVigente.fecha_proximo_cobro);
  const limite = computeFechaLimitePago(proximo);
  const pagadoAlCorriente = today < proximo;
  const enPeriodoGracia = !pagadoAlCorriente && today <= limite;
  const pagoExtraordinario = !pagadoAlCorriente && today > limite;
  return {
    tieneSuscripcionVigente: true,
    pagadoAlCorriente,
    puedePagar: !pagadoAlCorriente,
    enPeriodoGracia,
    pagoExtraordinario,
    fechaProximoPago: proximo,
    fechaLimitePago: limite,
    fechaUltimoPago: suscripcionVigente.fecha_inicio || null,
    diasGracia: GRACE_DAYS
  };
}

export function mapSuscripcionConCobro(sub: Record<string, any>, pagos: unknown[] = []) {
  const cobro = evaluarEstadoCobro(sub);
  const estatus = sub.cat_estatus_suscripcion || null;
  const plan = sub.cat_planes_suscripcion || null;
  const intervalo = sub.cat_intervalo_facturacion || null;
  return {
    id_suscripcion: sub.id_suscripcion,
    fecha_inicio: sub.fecha_inicio ? new Date(sub.fecha_inicio).toISOString() : null,
    fecha_proximo_cobro: sub.fecha_proximo_cobro ? new Date(sub.fecha_proximo_cobro).toISOString() : null,
    fecha_limite_pago: cobro.fechaLimitePago ? cobro.fechaLimitePago.toISOString() : null,
    fecha_fin: sub.fecha_fin,
    precio_total_mensual_snapshot: sub.precio_total_mensual_snapshot != null ? Number(sub.precio_total_mensual_snapshot) : null,
    estatus: estatus ? { codigo: estatus.codigo, nombre: estatus.nombre } : null,
    plan: plan ? { id_cat_plan_suscripcion: plan.id_cat_plan_suscripcion, nombre: plan.nombre } : null,
    intervalo: intervalo ? { codigo: intervalo.codigo, nombre: intervalo.nombre } : null,
    cobro,
    pagos
  };
}
