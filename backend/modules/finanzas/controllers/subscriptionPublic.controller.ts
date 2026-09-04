import type { Request, Response, NextFunction } from 'express';
import bcrypt from 'bcryptjs';
import prisma from '../../../core/db/prisma';
import { stripe, isStripeConfigured } from '../../../shared/services/stripeClient';
import { syncSuscripcionAfterPayment, isPagoYaSincronizado } from '../../../shared/services/subscriptionSyncService';
import { seedRelUsuarioSubmodulosFromPlan } from '../../../shared/services/planUsuarioSeedService';

function slugify(s: string): string {
  return String(s || '')
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 50) || `inst-${Date.now()}`;
}

export async function getPlans(_req: Request, res: Response, next: NextFunction) {
  try {
    const planes = await prisma.cat_planes_suscripcion.findMany({
      where: { activo: true },
      orderBy: { precio_mensual: 'asc' }
    });
    res.status(200).json({
      success: true,
      data: planes.map((p) => ({
        ...p,
        precio_mensual: p.precio_mensual != null ? Number(p.precio_mensual) : null
      }))
    });
  } catch (e) { next(e); }
}

export async function registerInstitution(req: Request, res: Response, next: NextFunction) {
  try {
    const {
      nombre,
      email,
      password,
      institucion_nombre,
      plan_id,
      telefono
    } = req.body || {};

    const adminNombre = String(nombre || '').trim();
    const adminEmail = String(email || '').trim().toLowerCase();
    const instNombre = String(institucion_nombre || '').trim();
    const planId = parseInt(String(plan_id), 10);
    const pass = String(password || '');

    if (!adminNombre || !adminEmail || !instNombre || !pass || Number.isNaN(planId)) {
      return res.status(400).json({
        success: false,
        message: 'nombre, email, password, institucion_nombre y plan_id son requeridos'
      });
    }

    const plan = await prisma.cat_planes_suscripcion.findFirst({
      where: { id_cat_plan_suscripcion: planId, activo: true }
    });
    if (!plan) return res.status(404).json({ success: false, message: 'Plan no encontrado' });

    const existing = await prisma.usuarios.findFirst({ where: { email: adminEmail } });
    if (existing) return res.status(409).json({ success: false, message: 'El email ya está registrado' });

    let slug = slugify(instNombre);
    const slugTaken = await prisma.instituciones.findUnique({ where: { slug } });
    if (slugTaken) slug = `${slug}-${Date.now().toString(36).slice(-4)}`;

    const hash = await bcrypt.hash(pass, 10);
    const pendiente = await prisma.cat_estatus_suscripcion.findFirst({ where: { codigo: 'pendiente_pago' } });

    const result = await prisma.$transaction(async (tx) => {
      const inst = await tx.instituciones.create({
        data: {
          nombre: instNombre.slice(0, 150),
          slug,
          fk_id_cat_plan_suscripcion: planId,
          activo: true,
          f_reg: new Date(),
          configuracion_json: {}
        }
      });

      const user = await tx.usuarios.create({
        data: {
          nombre: adminNombre,
          email: adminEmail,
          telefono: telefono ? String(telefono).slice(0, 50) : null,
          hash_pass: hash,
          fk_id_cat_tipo_usuario: 5,
          fk_id_institucion: inst.id_institucion,
          activo: true,
          campass: false,
          f_reg: new Date(),
          f_mod: new Date()
        }
      });

      await tx.rel_usuario_institucion.create({
        data: {
          fk_id_usuario: user.id_usuario,
          fk_id_institucion: inst.id_institucion,
          activo: true,
          f_reg: new Date()
        }
      });

      if (pendiente) {
        await tx.suscripciones.create({
          data: {
            fk_id_institucion: inst.id_institucion,
            fk_id_cat_plan_suscripcion: planId,
            fk_id_cat_estatus_suscripcion: pendiente.id_cat_estatus_suscripcion,
            fecha_inicio: new Date(),
            precio_total_mensual_snapshot: plan.precio_mensual
          }
        });
      }

      return { inst, user };
    });

    await seedRelUsuarioSubmodulosFromPlan({
      userId: result.user.id_usuario,
      fk_id_institucion: result.inst.id_institucion,
      fk_id_cat_tipo_usuario: 5
    });

    return res.status(201).json({
      success: true,
      data: {
        id_institucion: result.inst.id_institucion,
        slug: result.inst.slug,
        email: adminEmail,
        message: 'Registro exitoso. Inicia sesión y completa el pago de la suscripción.'
      }
    });
  } catch (e) { next(e); }
}

export async function handleWebhook(req: Request, res: Response) {
  const sig = req.headers['stripe-signature'];
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  let event: any;

  try {
    if (webhookSecret && stripe && sig) {
      event = stripe.webhooks.constructEvent(req.body, sig as string, webhookSecret);
    } else {
      event = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
    }
  } catch (err) {
    return res.status(400).send(`Webhook Error: ${(err as Error).message}`);
  }

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object;
    const metadata = session.metadata || {};
    try {
      if (metadata.institution_id && metadata.plan_id) {
        const instId = parseInt(metadata.institution_id, 10);
        if (!(await isPagoYaSincronizado(session.id))) {
          await syncSuscripcionAfterPayment({
            fk_id_institucion: instId,
            fk_id_cat_plan_suscripcion: metadata.plan_id,
            session,
            intervalHint: metadata.interval
          });
          const admins = await prisma.usuarios.findMany({
            where: { fk_id_institucion: instId, fk_id_cat_tipo_usuario: { in: [1, 5] }, activo: true },
            select: { id_usuario: true, fk_id_cat_tipo_usuario: true }
          });
          for (const admin of admins) {
            await seedRelUsuarioSubmodulosFromPlan({
              userId: admin.id_usuario,
              fk_id_institucion: instId,
              fk_id_cat_tipo_usuario: admin.fk_id_cat_tipo_usuario
            });
          }
        }
      }
    } catch (syncErr) {
      console.error('⚠️ webhook sync:', (syncErr as Error).message);
    }
  }

  res.json({ received: true });
}
