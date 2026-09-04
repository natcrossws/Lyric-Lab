# Tests del backend (Sprint 5.2)

Estructura:

```
__tests__/
├── helpers/
│   ├── auth.js           # signAdminToken / adminHeaders (firma JWT con JWT_SECRET del .env)
│   └── teardown.js       # cierra el pool de Sequelize al terminar integration
├── unit/                 # rápidos, sin DB ni red, sólo lógica + mocks
│   ├── metrics.test.js
│   ├── requestId.test.js
│   ├── inMemoryRateLimit.test.js
│   └── auditAdmin.test.js
└── integration/          # con BD real (mismo .env del backend) y supertest sobre app.js
    ├── health.test.js
    ├── observability.test.js
    ├── publicRoutes.test.js
    ├── loyaltyService.test.js
    └── voucherService.test.js
```

## Comandos

```bash
npm test                # unit + integration (proyectos jest)
npm run test:unit       # solo unit (subsegundos)
npm run test:integration # solo integration (~10s, requiere BD arriba)
npm run test:watch      # modo desarrollo
npm run test:coverage   # con --coverage
```

## Convenciones

- **Unit:** sin requerir `core/db`. Si necesitas un modelo, mockéalo con `jest.mock('../../core/db', () => ({...}))`.
- **Integration:** se permite tocar la BD real, pero limpia tus registros en `afterAll`. Usa emails con timestamp (`jest_xxx_${Date.now()}@example.com`) para evitar colisiones entre corridas.
- **Auth:** los endpoints admin requieren JWT. Usa `adminHeaders()` del helper que firma uno al vuelo con `JWT_SECRET` del `.env`.
- **Tenant:** todos los integration asumen `institucion_id = 1` (MBC) ya sembrada por las migraciones de Fase 1 (`100_seed_marketing_mbc.sql`).
- **Open handles:** el config raíz tiene `forceExit: true` para evitar que Sequelize/Helmet/cron mantengan jest colgado.

## Cobertura mínima del Sprint 5.2

- Observabilidad: `metrics`, `requestId`, `auditAdmin`, `inMemoryRateLimit` cubiertos por unit.
- Servicios críticos: `loyaltyService` (configuracion, getOrCreateCliente, ajusteManual, validate) y `voucherService` (emitir, redimir parcial/total, cancelar, errores) cubiertos por integration.
- HTTP: `/health`, `/health/ready`, `/api/admin/observability/{metrics,errors,errors/:id,audit}` y endpoints públicos clave (`/site-config`, rate-limit por tenant) cubiertos por integration con supertest.
