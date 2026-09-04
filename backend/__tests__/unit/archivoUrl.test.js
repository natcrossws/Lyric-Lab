/**
 * Unit tests para `shared/services/archivoUrl`.
 *
 * Verificamos:
 *   - El cache evita firmar la misma `ruta` dos veces (segunda llamada → hit).
 *   - `invalidate(ruta)` fuerza una nueva firma en la siguiente llamada.
 *   - `attachUrl(obj)` enriquece el objeto con `.url`.
 *
 * Mockeamos `s3Client.getSignedDownloadUrl` para no depender de R2 ni de red.
 */

jest.mock('../../shared/services/s3Client', () => {
    const fn = jest.fn(async (key) => `https://signed.example/${key}?sig=xyz`);
    return {
        getSignedDownloadUrl: fn,
        isR2Configured:       true,
        __mock:               fn
    };
});

const s3 = require('../../shared/services/s3Client');
const archivoUrl = require('../../shared/services/archivoUrl');

beforeEach(() => {
    archivoUrl.reset();
    s3.__mock.mockClear();
});

describe('archivoUrl cache', () => {
    test('firma una sola vez por ruta (hit en cache)', async () => {
        const a = await archivoUrl.getCachedSignedUrl('marketing/inst_1/foo.png');
        const b = await archivoUrl.getCachedSignedUrl('marketing/inst_1/foo.png');
        expect(a).toMatch(/signed\.example\/marketing\/inst_1\/foo\.png/);
        expect(a).toBe(b);
        expect(s3.__mock).toHaveBeenCalledTimes(1);
    });

    test('rutas distintas → dos firmas distintas', async () => {
        await archivoUrl.getCachedSignedUrl('a/1.png');
        await archivoUrl.getCachedSignedUrl('a/2.png');
        expect(s3.__mock).toHaveBeenCalledTimes(2);
    });

    test('invalidate(ruta) fuerza nueva firma', async () => {
        await archivoUrl.getCachedSignedUrl('a/inv.png');
        archivoUrl.invalidate('a/inv.png');
        await archivoUrl.getCachedSignedUrl('a/inv.png');
        expect(s3.__mock).toHaveBeenCalledTimes(2);
    });

    test('attachUrl agrega .url al objeto archivo', async () => {
        const a = { id_archivo: 9, ruta: 'a/attach.png' };
        const r = await archivoUrl.attachUrl(a);
        expect(r).toBe(a);
        expect(a.url).toMatch(/signed\.example\/a\/attach\.png/);
    });

    test('attachUrl es idempotente si url ya existe', async () => {
        const a = { id_archivo: 9, ruta: 'a/idem.png', url: 'preset' };
        await archivoUrl.attachUrl(a);
        expect(a.url).toBe('preset');
        expect(s3.__mock).not.toHaveBeenCalled();
    });

    test('null/undefined y rutas vacías devuelven null sin firmar', async () => {
        expect(await archivoUrl.getCachedSignedUrl('')).toBeNull();
        expect(await archivoUrl.getCachedSignedUrl(null)).toBeNull();
        expect(s3.__mock).not.toHaveBeenCalled();
    });
});
