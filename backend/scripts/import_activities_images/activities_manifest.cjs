/**
 * Catálogo de actividades del landing MargaritaBeach_WebSite
 * (`src/data/activitiesCatalog.ts`). Mantener en sync al cambiar el sitio.
 *
 * - `file`: PNG/JPG en `MargaritaBeach_WebSite/src/assets/` → subir a R2
 * - `unsplashPhoto`: id Unsplash (`photo-…`) → `imagen_url_externa`
 */

function unsplashUrl(photoId, w = 1600) {
  return `https://images.unsplash.com/${photoId}?fm=jpg&q=85&w=${w}&auto=format&fit=crop&ixlib=rb-4.1.0`;
}

const ACTIVITIES_MANIFEST = [
  {
    slug: 'masajes',
    categoriaCodigo: 'relax',
    unsplashPhoto: 'photo-1544161515-4ab6ce6db874',
    titulo: { es: 'Masajes', en: 'Massages' },
    eyebrow: { es: 'Relax Envo + Wellness', en: 'Relax Envo + Wellness' },
    descripcion: {
      es: 'Relájate y disfruta de un reconfortante masaje justo en la playa.',
      en: 'Relax and enjoy a soothing massage right on the beach.',
    },
    priceMxn: 850,
  },
  {
    slug: 'motos-acuaticas',
    categoriaCodigo: 'adrenalina',
    file: 'motos_acuaticas_custom.png',
    titulo: { es: 'Motos acuáticas', en: 'Jet skis' },
    eyebrow: { es: 'Adrenalina + Mar', en: 'Adrenaline + Sea' },
    descripcion: {
      es: 'Experimenta la emoción de deslizarte a toda velocidad sobre el agua en una moto acuática.',
      en: 'Feel the thrill of skimming the water at top speed on a jet ski.',
    },
    priceMxn: 1200,
  },
  {
    slug: 'parasailing',
    categoriaCodigo: 'adrenalina',
    unsplashPhoto: 'photo-1632904074880-b77f02b6d01e',
    titulo: { es: 'Parasailing', en: 'Parasailing' },
    eyebrow: { es: 'Sky Envo + Vistas', en: 'Sky Envo + Views' },
    descripcion: {
      es: 'Surca los cielos y contempla vistas impresionantes mientras vuelas en paracaídas sobre el océano.',
      en: 'Soar the skies and take in breathtaking views as you fly above the ocean.',
    },
    priceMxn: 1500,
  },
  {
    slug: 'banana-boat',
    categoriaCodigo: 'familiar',
    file: 'banana_boat_custom.png',
    titulo: { es: 'Paseos en banana boat', en: 'Banana boat rides' },
    eyebrow: { es: 'Fun Envo + Friends', en: 'Fun Envo + Friends' },
    descripcion: {
      es: 'Agárrate fuerte mientras saltas sobre las olas en un banana boat.',
      en: 'Hold on tight as you bounce over the waves on a banana boat.',
    },
    priceMxn: 600,
  },
  {
    slug: 'henna',
    categoriaCodigo: 'beauty',
    file: 'henna_tattoo_custom.png',
    titulo: { es: 'Tatuajes de henna', en: 'Henna tattoos' },
    eyebrow: { es: 'Beach Art + Style', en: 'Beach Art + Style' },
    descripcion: {
      es: 'Obtén un tatuaje temporal que capture el espíritu de tus aventuras en la playa.',
      en: 'Get a temporary tattoo to capture the spirit of your beach adventures.',
    },
    priceMxn: 450,
  },
  {
    slug: 'trenzas',
    categoriaCodigo: 'beauty',
    unsplashPhoto: 'photo-1681387744797-4eb711161586',
    titulo: { es: 'Trenzas en el cabello', en: 'Hair braiding' },
    eyebrow: { es: 'Island Look + Beauty', en: 'Island Look + Beauty' },
    descripcion: {
      es: 'Agrega un toque de estilo isleño a tus vacaciones con trenzas expertamente realizadas.',
      en: 'Add island style to your vacation with expertly made braids.',
    },
    priceMxn: 500,
  },
];

ACTIVITIES_MANIFEST.unsplashUrl = unsplashUrl;
module.exports = ACTIVITIES_MANIFEST;
