/**
 * entitlementsService — Resuelve módulos y submódulos habilitados para una institución
 * según plan de suscripción vigente + addons + dependencias de menú.
 */
import prisma from '../../core/db/prisma';

const MAX_DEP_ITERATIONS = 25;
const MAX_JSON_REQ_ITERATIONS = 40;

interface RequisitosPlan {
  modulos: number[];
  subs: number[];
}

function parseRequisitosPlanJson(raw: unknown): RequisitosPlan {
  if (raw == null || raw === '') {
    return { modulos: [], subs: [] };
  }
  let obj = raw;
  if (typeof raw === 'string') {
    try {
      obj = JSON.parse(raw);
    } catch {
      return { modulos: [], subs: [] };
    }
  }
  if (!obj || typeof obj !== 'object' || Array.isArray(obj)) {
    return { modulos: [], subs: [] };
  }
  const o = obj as Record<string, unknown>;
  const pickArr = (a: unknown): unknown[] => (Array.isArray(a) ? a : []);
  const modSrc = pickArr(o.require_modulos).concat(pickArr(o.requireModulos));
  const subSrc = pickArr(o.require_submodulos).concat(pickArr(o.requireSubmodulos));
  const modulos = [...new Set(modSrc.map((n) => parseInt(String(n), 10)).filter((n) => Number.isInteger(n) && n > 0))];
  const subs = [...new Set(subSrc.map((n) => parseInt(String(n), 10)).filter((n) => Number.isInteger(n) && n > 0))];
  return { modulos, subs };
}

async function filterSubmodulesByPlanJson(moduleSet: Set<number>, submoduleSet: Set<number>): Promise<boolean> {
  if (submoduleSet.size === 0) return false;

  const rows = await prisma.submodulos.findMany({
    where: { id_submodulo: { in: [...submoduleSet] } },
    select: { id_submodulo: true, requisitos_plan_json: true }
  });

  const reqById = new Map<number, RequisitosPlan>();
  let anyRule = false;
  for (const r of rows) {
    const parsed = parseRequisitosPlanJson(r.requisitos_plan_json);
    reqById.set(r.id_submodulo, parsed);
    if (parsed.modulos.length > 0 || parsed.subs.length > 0) anyRule = true;
  }
  if (!anyRule) return false;

  let stripped = false;
  for (let iter = 0; iter < MAX_JSON_REQ_ITERATIONS; iter++) {
    let changed = false;
    for (const sid of [...submoduleSet]) {
      const pr = reqById.get(sid) || { modulos: [], subs: [] };
      if (pr.modulos.length === 0 && pr.subs.length === 0) continue;
      const ok = pr.modulos.every((m) => moduleSet.has(m))
        && pr.subs.every((s) => submoduleSet.has(s));
      if (!ok) {
        submoduleSet.delete(sid);
        changed = true;
        stripped = true;
      }
    }
    if (!changed) break;
  }
  return stripped;
}

async function expandMenuDependencies(moduleSet: Set<number>, submoduleSet: Set<number>): Promise<void> {
  for (let i = 0; i < MAX_DEP_ITERATIONS; i++) {
    const prevM = moduleSet.size;
    const prevS = submoduleSet.size;
    const modArr = [...moduleSet];
    const subArr = [...submoduleSet];

    if (modArr.length > 0) {
      const relMod = await prisma.rel_modulos_modulos.findMany({
        where: { fk_id_modulo: { in: modArr } },
        select: { fk_id_modulo_requerido: true }
      });
      for (const r of relMod) {
        if (r.fk_id_modulo_requerido) moduleSet.add(r.fk_id_modulo_requerido);
      }
    }

    if (subArr.length > 0) {
      const relSubSub = await prisma.rel_submodulos_submodulos.findMany({
        where: { fk_id_submodulo: { in: subArr } },
        select: { fk_id_submodulo_requerido: true }
      });
      for (const r of relSubSub) {
        if (r.fk_id_submodulo_requerido) submoduleSet.add(r.fk_id_submodulo_requerido);
      }

      const relSubMod = await prisma.rel_submodulos_modulos.findMany({
        where: { fk_id_submodulo: { in: subArr } },
        select: { fk_id_modulo: true }
      });
      for (const r of relSubMod) {
        if (r.fk_id_modulo) moduleSet.add(r.fk_id_modulo);
      }
    }

    const modArr2 = [...moduleSet];
    if (modArr2.length > 0) {
      const subRows = await prisma.submodulos.findMany({
        where: { fk_id_modulo: { in: modArr2 }, activo: true },
        select: { id_submodulo: true }
      });
      for (const s of subRows) submoduleSet.add(s.id_submodulo);
    }

    if (moduleSet.size === prevM && submoduleSet.size === prevS) break;
  }
}

interface EntitlementsResult {
  fkIdCatPlanSuscripcion: number | null;
  idModulos: number[];
  idSubmodulos: number[];
  fuente: string;
}

interface EntitlementsOptions {
  omitFallbackAllSubmodules?: boolean;
  skipDependencyExpansion?: boolean;
  fkIdsCatTipoUsuarioForPlanRel?: number[];
}

async function getEntitlementsForInstitucion(
  idInstitucion: number,
  options: EntitlementsOptions = {}
): Promise<EntitlementsResult> {
  const omitFallbackAllSubmodules = options.omitFallbackAllSubmodules === true;
  const skipDependencyExpansion = options.skipDependencyExpansion === true;

  const inst = await prisma.instituciones.findUnique({
    where: { id_institucion: idInstitucion }
  });
  if (!inst) {
    return { idModulos: [], idSubmodulos: [], fkIdCatPlanSuscripcion: null, fuente: 'none' };
  }

  const estatusVigente = await prisma.cat_estatus_suscripcion.findFirst({
    where: { codigo: 'vigente' }
  });

  let planId = inst.fk_id_cat_plan_suscripcion;
  let fuente = 'institucion';
  let susVigente: { id_suscripcion: number; fk_id_cat_plan_suscripcion: number | null } | null = null;

  if (estatusVigente) {
    susVigente = await prisma.suscripciones.findFirst({
      where: {
        fk_id_institucion: idInstitucion,
        fk_id_cat_estatus_suscripcion: estatusVigente.id_cat_estatus_suscripcion
      },
      orderBy: { fecha_inicio: 'desc' },
      select: { id_suscripcion: true, fk_id_cat_plan_suscripcion: true }
    });
    if (susVigente?.fk_id_cat_plan_suscripcion) {
      planId = susVigente.fk_id_cat_plan_suscripcion;
      fuente = 'suscripcion';
    }
  }

  if (!planId) {
    return { idModulos: [], idSubmodulos: [], fkIdCatPlanSuscripcion: null, fuente };
  }

  const relPlanWhere: {
    fk_id_cat_plan_suscripcion: number;
    vigente: boolean;
    fk_id_cat_tipo_usuario?: { in: number[] };
  } = {
    fk_id_cat_plan_suscripcion: planId,
    vigente: true
  };
  const tipoIdsPlanRel = options.fkIdsCatTipoUsuarioForPlanRel;
  if (Array.isArray(tipoIdsPlanRel) && tipoIdsPlanRel.length > 0) {
    relPlanWhere.fk_id_cat_tipo_usuario = { in: tipoIdsPlanRel };
  }

  const relPlan = await prisma.rel_cat_plan_suscripcion_submodulo.findMany({
    where: relPlanWhere,
    select: { fk_id_submodulo: true }
  });
  const planSubIds = [...new Set(relPlan.map((r) => r.fk_id_submodulo))];

  const submoduleSet = new Set<number>();
  const moduleSet = new Set<number>();

  if (planSubIds.length > 0) {
    const planSubsActive = await prisma.submodulos.findMany({
      where: { id_submodulo: { in: planSubIds }, activo: true },
      select: { id_submodulo: true, fk_id_modulo: true }
    });
    for (const s of planSubsActive) {
      submoduleSet.add(s.id_submodulo);
      moduleSet.add(s.fk_id_modulo);
    }
  }

  const extraSubmoduloIds: number[] = [];

  if (susVigente) {
    const detalles = await prisma.suscripciones_detalle.findMany({
      where: { fk_id_suscripcion: susVigente.id_suscripcion },
      include: {
        cat_tipo_linea_suscripcion: {
          select: { id_cat_tipo_linea_suscripcion: true, codigo: true }
        }
      }
    });

    if (detalles.length > 0) {
      fuente = `${fuente}+detalle`;
    }

    for (const d of detalles) {
      const codigo = d.cat_tipo_linea_suscripcion?.codigo;
      if (codigo === 'addon_modulo' && d.fk_id_modulo) {
        moduleSet.add(d.fk_id_modulo);
        const subsAddon = await prisma.submodulos.findMany({
          where: { fk_id_modulo: d.fk_id_modulo, activo: true },
          select: { id_submodulo: true }
        });
        for (const s of subsAddon) submoduleSet.add(s.id_submodulo);
      }
      if (codigo === 'addon_submodulo' && d.fk_id_submodulo) {
        extraSubmoduloIds.push(d.fk_id_submodulo);
      }
    }
  }

  for (const sid of extraSubmoduloIds) {
    submoduleSet.add(sid);
    const row = await prisma.submodulos.findUnique({
      where: { id_submodulo: sid },
      select: { fk_id_modulo: true, activo: true }
    });
    if (row?.activo) moduleSet.add(row.fk_id_modulo);
  }

  if (submoduleSet.size === 0 && !omitFallbackAllSubmodules) {
    const todos = await prisma.submodulos.findMany({
      where: { activo: true },
      select: { id_submodulo: true, fk_id_modulo: true }
    });
    for (const s of todos) {
      submoduleSet.add(s.id_submodulo);
      moduleSet.add(s.fk_id_modulo);
    }
    fuente = `${fuente}+fallback_submodulos`;
  }

  if (!skipDependencyExpansion) {
    const [c1, c2, c3] = await Promise.all([
      prisma.rel_modulos_modulos.count(),
      prisma.rel_submodulos_submodulos.count(),
      prisma.rel_submodulos_modulos.count()
    ]);
    if (c1 + c2 + c3 > 0) {
      await expandMenuDependencies(moduleSet, submoduleSet);
      fuente = `${fuente}+deps`;
    }
  }

  const jsonStripped = await filterSubmodulesByPlanJson(moduleSet, submoduleSet);
  if (jsonStripped) {
    fuente = `${fuente}+req_json`;
  }

  return {
    fkIdCatPlanSuscripcion: planId,
    idModulos: [...moduleSet].sort((a, b) => a - b),
    idSubmodulos: [...submoduleSet].sort((a, b) => a - b),
    fuente
  };
}

export {
  getEntitlementsForInstitucion,
  expandMenuDependencies,
  filterSubmodulesByPlanJson,
  parseRequisitosPlanJson
};
