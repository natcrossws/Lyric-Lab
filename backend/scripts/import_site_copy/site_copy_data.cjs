/**
 * Espejo CommonJS de MargaritaBeach_WebSite/src/i18n/siteCopy.ts
 *
 * IMPORTANTE: este archivo se mantiene a mano mientras `siteCopy.ts` siga
 * siendo la fuente del frontend. Una vez que el sitio público consuma
 * /api/public/site-config (Sprint 1.3) podremos eliminar ambos.
 *
 * Cualquier cambio en siteCopy.ts debe replicarse aquí antes de re-importar.
 */

function buildSiteCopy(ui) {
  const isEs = ui === 'es';

  const nav = isEs
    ? {
        home: 'Inicio',
        activities: 'Actividades',
        menu: 'Menú',
        beachClub: 'Beach Club',
        contact: 'Contacto',
        fullMenu: 'Carta completa',
      }
    : {
        home: 'Home',
        activities: 'Activities',
        menu: 'Menu',
        beachClub: 'Beach Club',
        contact: 'Contact',
        fullMenu: 'Full menu',
      };

  return {
    nav,
    navReserve: isEs ? 'Reservar' : 'Book',
    navReserveMobile: isEs ? 'Reservar ahora' : 'Book now',
    navLanguage: isEs ? 'Idioma' : 'Language',
    navOpenMenu: isEs ? 'Abrir menú' : 'Open menu',
    navCloseMenu: isEs ? 'Cerrar menú' : 'Close menu',

    hero: {
      reserveNow: isEs ? 'Reserva ahora' : 'Book now',
      viewMenu: isEs ? 'Ver menú' : 'View menu',
      discover: isEs ? 'Descubre' : 'Discover',
    },

    introClub: {
      floatAlt: isEs ? 'Ambiente en Margarita Beach Club' : 'Atmosphere at Margarita Beach Club',
      tagline: isEs
        ? 'Donde el mar abraza la calma y cada día sabe a sal, sol y buena mesa.'
        : 'Where the sea hugs the calm and every day tastes like salt, sun, and a great table.',
      body: isEs
        ? 'Margarita Beach Club es un refugio frente al océano pensado para desconectar del ruido y volver a lo esencial: conversaciones largas bajo la palapa, aromas de cocina recién hecha y el rumor de las olas como banda sonora. Aquí el tiempo se estira, la hospitalidad se nota en cada detalle y los recuerdos se quedan contigo mucho después de partir.'
        : 'Margarita Beach Club is an oceanfront hideaway made to unplug from the noise and return to the essentials: long conversations under the palapa, the smell of fresh cooking, and the waves as your soundtrack. Here time slows down, hospitality shows in every detail, and the memories stay with you long after you leave.',
    },

    actividades: {
      title: isEs ? 'Actividades' : 'Activities',
      intro: isEs
        ? '¿Buscas añadir emoción a tus vacaciones en la playa? ¡No busques más! Ofrecemos una variedad de actividades llenas de aventura por un costo adicional. Aquí tienes algunas opciones:'
        : 'Want to add a little excitement to your beach vacation? Look no further. We offer a variety of adventure-filled activities for an additional cost. Here are a few options:',
      bookingHintPrefix: isEs ? 'La selección de actividades se refleja en la página' : 'Selected activities appear on the',
      bookingHintLink: isEs ? 'Reservar' : 'Book',
      bookingHintSuffix: isEs ? '.' : ' page.',
    },

    beachClub: {
      subtitle: isEs
        ? 'Experimenta el paraíso en nuestra playa privada con servicio de primera clase'
        : 'Experience paradise on our private beach with first-class service',
      features: isEs
        ? [
            { title: 'Playa privada', description: 'Acceso exclusivo a 500 metros de arena blanca' },
            { title: 'Servicio premium', description: 'Camastros, sombrillas y toallas de cortesía' },
            { title: 'Bar de playa', description: 'Cócteles tropicales y snacks todo el día' },
          ]
        : [
            { title: 'Private beach', description: 'Exclusive access to 500m of white sand' },
            { title: 'Premium service', description: 'Loungers, umbrellas, and complimentary towels' },
            { title: 'Beach bar', description: 'Tropical cocktails and snacks all day' },
          ],
      cta: isEs ? 'Reserva tu día en la playa' : 'Book your beach day',
    },

    menuHome: {
      kicker: isEs ? 'Explora la carta' : 'Explore the menu',
      titleLine1: isEs ? 'Experiencias' : 'Culinary',
      titleLine2: isEs ? 'Gastronómicas' : 'experiences',
      sub: isEs
        ? 'Navega por categorías con el slider y descubre recomendaciones rápidas.'
        : 'Browse categories with the slider and discover quick recommendations.',
    },

    menuExplorer: {
      menuTypeTabs: isEs ? 'Tipo de menú' : 'Menu type',
      aLaCarteTab: isEs ? 'MENÚ A LA CARTA' : 'À LA CARTE MENU',
      allInclusiveTab: isEs ? 'MENÚ TODO INCLUIDO' : 'ALL-INCLUSIVE MENU',
      aLaCarteOpenTitle: isEs ? 'Menú a la carta' : 'À la carte menu',
      allInclusiveOpenTitle: isEs ? 'Menú todo incluido' : 'All-inclusive menu',
      soonBadge: isEs ? 'pronto' : 'soon',
      empty: isEs ? 'No hay categorías disponibles por el momento.' : 'No categories are available right now.',
      categoriesGroup: isEs ? 'Categorías del menú' : 'Menu categories',
      sliderNav: isEs ? 'Navegación de categorías' : 'Category navigation',
      prevCategory: isEs ? 'Categoría anterior' : 'Previous category',
      nextCategory: isEs ? 'Siguiente categoría' : 'Next category',
      categoryEyebrow: isEs ? 'Categoría' : 'Category',
      cta: isEs ? 'Ver platillos y precios' : 'View dishes and prices',
      ctaAria: isEs ? 'Ver platillos y precios de esta categoría' : 'View dishes and prices for this category',
      lightboxClose: isEs ? 'Cerrar visor de menú' : 'Close menu viewer',
      lightboxAriaPrefix: isEs ? 'Visor' : 'Viewer',
    },

    testimonials: {
      title: isEs ? 'Experiencias de nuestros huéspedes' : 'Guest experiences',
      subtitle: isEs ? 'Lo que dicen quienes nos han visitado' : 'What visitors say about us',
      items: isEs
        ? [
            {
              name: 'María González',
              location: 'Ciudad de México',
              text: 'Una experiencia inolvidable. El servicio es excepcional y las instalaciones son de primer nivel. Definitivamente regresaremos.',
              date: 'Enero 2026',
            },
            {
              name: 'Carlos Ramírez',
              location: 'Guadalajara',
              text: 'El lugar perfecto para una escapada romántica. La vista al mar desde nuestra suite era espectacular. Altamente recomendado.',
              date: 'Diciembre 2025',
            },
            {
              name: 'Ana Martínez',
              location: 'Monterrey',
              text: 'Desde el momento en que llegamos nos sentimos como en casa. El personal es amable y atento. La comida del restaurante es exquisita.',
              date: 'Noviembre 2025',
            },
          ]
        : [
            {
              name: 'María González',
              location: 'Mexico City',
              text: 'An unforgettable experience. Service is exceptional and the facilities are top-notch. We will definitely return.',
              date: 'January 2026',
            },
            {
              name: 'Carlos Ramírez',
              location: 'Guadalajara',
              text: 'The perfect place for a romantic getaway. The ocean view from our suite was spectacular. Highly recommended.',
              date: 'December 2025',
            },
            {
              name: 'Ana Martínez',
              location: 'Monterrey',
              text: 'From the moment we arrived we felt at home. The staff is kind and attentive. The restaurant food is exquisite.',
              date: 'November 2025',
            },
          ],
    },

    contact: {
      chip: isEs ? 'Estamos para ayudarte' : 'We are here to help',
      title: isEs ? 'Contáctanos' : 'Contact us',
      lead: isEs ? '¿Tienes preguntas? Escríbenos y te responderemos a la brevedad.' : 'Have questions? Write to us and we will reply as soon as possible.',
      thanks: isEs ? '¡Gracias por tu mensaje! Te contactaremos pronto.' : 'Thank you for your message! We will contact you soon.',
      name: isEs ? 'Nombre *' : 'Name *',
      namePh: isEs ? 'Tu nombre' : 'Your name',
      email: isEs ? 'Correo *' : 'Email *',
      phone: isEs ? 'Teléfono' : 'Phone',
      subject: isEs ? 'Asunto *' : 'Subject *',
      subjectPlaceholder: isEs ? 'Selecciona un asunto' : 'Select a subject',
      subjectReservations: isEs ? 'Reservaciones' : 'Reservations',
      subjectInfo: isEs ? 'Información general' : 'General information',
      subjectEvents: isEs ? 'Eventos especiales' : 'Special events',
      subjectOther: isEs ? 'Otro' : 'Other',
      message: isEs ? 'Mensaje *' : 'Message *',
      messagePh: isEs ? '¿En qué podemos ayudarte?' : 'How can we help?',
      submit: isEs ? 'Enviar mensaje' : 'Send message',
      infoTitle: isEs ? 'Información de contacto' : 'Contact information',
      phoneLabel: isEs ? 'Teléfono' : 'Phone',
      phoneHours: isEs ? 'Lun - Dom: 24 hrs' : 'Mon - Sun: 24 hrs',
      emailLabel: 'Email',
      emailSub: isEs ? 'Respuesta en menos de 24 hrs' : 'Reply in under 24 hours',
      locationLabel: isEs ? 'Ubicación' : 'Location',
      locationLine1: isEs ? 'Playa del Carmen, Quintana Roo' : 'Playa del Carmen, Quintana Roo',
      locationLine2: isEs ? 'Riviera Maya, México' : 'Riviera Maya, Mexico',
    },

    footer: {
      blurb: isEs
        ? 'Tu destino de lujo frente al mar. Experiencias inolvidables en el paraíso mexicano.'
        : 'Your luxury destination by the sea. Unforgettable experiences in the Mexican paradise.',
      quickLinks: isEs ? 'Enlaces rápidos' : 'Quick links',
      contactTitle: isEs ? 'Contacto' : 'Contact',
      newsletterTitle: 'Newsletter',
      newsletterLead: isEs ? 'Suscríbete para recibir ofertas exclusivas' : 'Subscribe for exclusive offers',
      newsletterPlaceholder: isEs ? 'Tu email' : 'Your email',
      newsletterCta: isEs ? 'Suscribirse' : 'Subscribe',
      rights: isEs ? 'Todos los derechos reservados.' : 'All rights reserved.',
      privacy: isEs ? 'Privacidad' : 'Privacy',
      terms: isEs ? 'Términos' : 'Terms',
      cancellation: isEs ? 'Política de cancelación' : 'Cancellation policy',
    },

    menuPage: {
      kicker: 'Margarita Beach Club Menu',
      title: isEs ? 'Explora nuestro menú' : 'Explore our menu',
      lead: isEs
        ? 'Secciones por tipo de comida y bebida para una navegación clara. Cada bloque corresponde a un slide.'
        : 'Sections by food and drink type for clear navigation. Each block matches a home slide.',
      viewPrices: isEs ? 'Ver platillos y precios' : 'View dishes and prices',
      bookTable: isEs ? 'Reservar mesa' : 'Book a table',
    },

    menuCategory: {
      notFoundTitle: isEs ? 'Categoría no encontrada' : 'Category not found',
      notFoundBody: isEs
        ? 'Revisa el enlace o vuelve a la carta para elegir otra sección.'
        : 'Check the link or return to the menu to pick another section.',
      backToMenu: isEs ? 'Ver toda la carta' : 'View full menu',
      backLink: isEs ? 'Carta completa' : 'Full menu',
      categoryEyebrow: isEs ? 'Categoría' : 'Category',
      dishesHeading: isEs ? 'Platillos y precios de ejemplo' : 'Sample dishes and prices',
      dishesNote: isEs
        ? 'Precios orientativos; la carta en salón puede variar según temporada.'
        : 'Indicative prices; in-venue menu may vary by season.',
      exploreMore: isEs ? 'Explorar otras categorías' : 'Explore other categories',
      bookTable: isEs ? 'Reservar mesa' : 'Book a table',
    },

    concierge: {
      welcomeText: isEs
        ? '¡Hola! Soy el asistente de Margarita Beach Club. Puedo orientarte para reservar un day pass, armar tu visita con actividades o explorar la carta. ¿Qué te gustaría hacer?'
        : 'Hi! I am the Margarita Beach Club assistant. I can help you book a day pass, plan your visit with activities, or explore the menu. What would you like to do?',
      welcomeLinks: isEs
        ? [
            { label: 'Ir a reservar', href: '/reservar' },
            { label: 'Ver menú en la web', href: '/menu' },
            { label: 'Actividades en inicio', href: '/#actividades' },
          ]
        : [
            { label: 'Go to booking', href: '/reservar' },
            { label: 'View menu online', href: '/menu' },
            { label: 'Activities on home', href: '/#actividades' },
          ],
      headerEyebrow: isEs ? 'Asistente' : 'Assistant',
      closeChat: isEs ? 'Cerrar chat' : 'Close chat',
      conversationHint: isEs ? 'Te guío paso a paso. Elige una opción o escribe tu pregunta.' : 'I will guide you step by step. Pick an option or type your question.',
      typingLabel: isEs ? 'Escribiendo...' : 'Typing...',
      followUpQuestion: isEs ? 'Si quieres, te llevo directo con un toque:' : 'If you want, I can take you there in one tap:',
      shortcutsTitle: isEs ? 'Atajos' : 'Shortcuts',
      shortcutReserve: isEs ? 'Reservar / pase' : 'Book / pass',
      shortcutMenu: isEs ? 'Menú' : 'Menu',
      shortcutActivities: isEs ? 'Actividades' : 'Activities',
      shortcutContact: isEs ? 'Contacto' : 'Contact',
      quickReserveUser: isEs ? 'Quiero reservar' : 'I want to book',
      quickReserveBot: isEs
        ? 'Perfecto. En Reservar puedes elegir fecha, huéspedes, extras y ver un resumen (demo, sin pago todavía).'
        : 'Great. On Booking you can pick dates, guests, add-ons, and see a summary (demo, no payment yet).',
      quickReserveLink: isEs ? 'Ir a reservar' : 'Go to booking',
      quickMenuUser: isEs ? 'Ver menú' : 'View menu',
      quickMenuBot: isEs
        ? 'Abre la carta por categorías o vuelve al inicio y usa el buscador del explorador gastronómico.'
        : 'Open the menu by category, or go home and use the menu explorer search.',
      quickMenuLinks: isEs
        ? [
            { label: 'Carta completa', href: '/menu' },
            { label: 'Explorador', href: '/#menu-slider' },
          ]
        : [
            { label: 'Full menu', href: '/menu' },
            { label: 'Explorer', href: '/#menu-slider' },
          ],
      quickActivitiesUser: isEs ? 'Actividades' : 'Activities',
      quickActivitiesBot: isEs
        ? 'Añade actividades con el botón +; se sincronizan con tu reserva en la demo.'
        : 'Add activities with the + button; they sync with your booking in this demo.',
      quickActivitiesLink: isEs ? 'Actividades' : 'Activities',
      inputLabel: isEs ? 'Escribe tu pregunta' : 'Write your question',
      inputPlaceholder: isEs ? 'Ej. ¿cómo reservo un pase?' : 'e.g. How do I book a pass?',
      send: isEs ? 'Enviar' : 'Send',
      disclaimer: isEs
        ? 'Asistente de demostración: sin IA en servidor. Las respuestas son orientativas.'
        : 'Demo assistant: no server-side AI. Answers are indicative.',
      fabClose: isEs ? 'Cerrar asistente' : 'Close assistant',
      fabOpen: isEs ? 'Abrir asistente de reservas y menú' : 'Open booking and menu assistant',
      ariaDialog: isEs ? 'Asistente Margarita Beach Club' : 'Margarita Beach Club assistant',

      replies: {
        reserve: {
          text: isEs
            ? 'Para reservar o armar un day pass (demo en la web), abre la página de reservas: elige fecha, número de huéspedes y extras. Cuando tengamos pagos en línea, aquí mismo te indicaremos el siguiente paso.'
            : 'To book or build a day pass (web demo), open the booking page: choose dates, guest count, and add-ons. When online payments are available, we will guide you through the next step here.',
          link: isEs ? 'Abrir reservas' : 'Open booking',
        },
        menu: {
          text: isEs
            ? 'Tenemos la carta completa por categorías y un explorador en la página de inicio. Si buscas algo concreto, usa el buscador en “Experiencias gastronómicas”.'
            : 'We have the full menu by categories and an explorer on the home page. If you want something specific, use the search in the culinary experiences section.',
          links: isEs
            ? [
                { label: 'Carta completa', href: '/menu' },
                { label: 'Explorador en inicio', href: '/#menu-slider' },
              ]
            : [
                { label: 'Full menu', href: '/menu' },
                { label: 'Explorer on home', href: '/#menu-slider' },
              ],
        },
        activities: {
          text: isEs
            ? 'En la sección Actividades puedes ver opciones con un toque. Lo que marques con “+” se refleja en tu reserva (vista previa).'
            : 'In Activities you can browse options with one tap. What you mark with “+” shows up on your booking (preview).',
          link: isEs ? 'Ir a actividades' : 'Go to activities',
        },
        contact: {
          text: isEs
            ? 'Para ubicación, teléfono o mensaje directo, usa la sección de contacto al final del sitio.'
            : 'For location, phone, or a direct message, use the contact section at the bottom of the site.',
          link: isEs ? 'Ir a contacto' : 'Go to contact',
        },
        fallback: {
          text: isEs
            ? 'Puedo ayudarte con reservas y day pass, la carta / menú o actividades. Elige una opción rápida abajo o reformula tu pregunta.'
            : 'I can help with bookings and day passes, the menu, or activities. Pick a quick option below or rephrase your question.',
          links: isEs
            ? [
                { label: 'Reservar', href: '/reservar' },
                { label: 'Menú', href: '/menu' },
                { label: 'Actividades', href: '/#actividades' },
              ]
            : [
                { label: 'Book', href: '/reservar' },
                { label: 'Menu', href: '/menu' },
                { label: 'Activities', href: '/#actividades' },
              ],
        },
      },
    },

    booking: {
      heroTitle: isEs ? 'Reserva tu día en el paraíso' : 'Book your day in paradise',
      heroSubtitle: isEs
        ? 'Arma tu día en Margarita Beach Club: elige fecha, beach crew y extras. Experiencia guiada, clara y lista para cuando conectemos pagos reales.'
        : 'Plan your day at Margarita Beach Club: pick dates, your beach crew, and add-ons. A guided, clear flow—ready for when we connect real payments.',
      backHome: isEs ? 'Volver al inicio' : 'Back to home',
      stepperAria: isEs ? 'Pasos de reserva' : 'Booking steps',
      stepper: isEs
        ? {
            dates: 'Fechas',
            crew: 'Beach crew',
            pkg: 'Paquete',
            location: 'Ubicación',
            review: 'Resumen',
          }
        : {
            dates: 'Dates',
            crew: 'Beach crew',
            pkg: 'Package',
            location: 'Location',
            review: 'Review',
          },

      wizard: isEs
        ? [
            { title: 'Selecciona una fecha', subtitle: 'Elige tu día de playa o estancia perfecta' },
            { title: '¿Cuántas personas vienen al club?', subtitle: 'Arma tu beach crew y ajusta cantidades con un toque.' },
            { title: 'Diversión extra en el paraíso', subtitle: 'Suma actividades y upgrades como en los mejores beach clubs del Caribe.' },
            {
              title: 'Day beds',
              subtitle: 'Solo con paquete all inclusive. Toca el número para reservar (demo: algunas ocupadas).',
            },
            {
              title: 'Resumen de tu reserva',
              subtitle: 'Confirma cada detalle antes de continuar al pago seguro.',
            },
          ]
        : [
            { title: 'Pick a date', subtitle: 'Choose your perfect beach day or stay' },
            { title: 'How many people are coming?', subtitle: 'Build your beach crew and adjust counts with a tap.' },
            { title: 'Extra fun in paradise', subtitle: 'Add activities and upgrades like the best Caribbean beach clubs.' },
            {
              title: 'Day beds',
              subtitle: 'All-inclusive package only. Tap a number to reserve (demo: some are taken).',
            },
            {
              title: 'Your booking summary',
              subtitle: 'Confirm every detail before continuing to secure payment.',
            },
          ],

      review: {
        kicker: isEs ? 'Tu día en Margarita' : 'Your Margarita day',
        packageSection: isEs ? 'Paquete' : 'Package',
        activitiesSection: isEs ? 'Actividades extra' : 'Extra activities',
        extrasSection: isEs ? 'Upgrades opcionales' : 'Optional upgrades',
        funPassLabel: 'Fun Pass',
        topShelfLabel: 'Top Shelf',
        dayBedsSection: isEs ? 'Day beds' : 'Day beds',
        spotsLabel: isEs ? 'Camastros' : 'Spots',
        passesLine: isEs ? 'Pases y accesos' : 'Passes & access',
        activitiesLine: isEs ? 'Actividades' : 'Activities',
        addonsLine: isEs ? 'Upgrades y day beds' : 'Upgrades & day beds',
        totalEstimated: isEs ? 'Total estimado' : 'Estimated total',
        payNow: isEs ? 'Pagar ahora' : 'Pay now',
        payDisclaimer: isEs
          ? 'Demo: el pago es simulado; no se realizará ningún cargo real.'
          : 'Demo: payment is simulated; no real charge will be made.',
        payThanks: isEs
          ? '¡Listo! En producción aquí irías al checkout con tu método de pago.'
          : 'Done! In production you would continue to checkout with your payment method.',
        noneActivities: isEs ? 'Sin actividades extra' : 'No extra activities',
        crewHeading: isEs ? 'Tu beach crew' : 'Your beach crew',
      },

      calendar: {
        pickDateEyebrow: isEs ? 'Selecciona tu fecha' : 'Pick your date',
        prevMonth: isEs ? 'Mes anterior' : 'Previous month',
        nextMonth: isEs ? 'Mes siguiente' : 'Next month',
        startLabel: isEs ? 'Inicio' : 'Start',
        endLabel: isEs ? 'Fin' : 'End',
        weekdaysEs: ['Do', 'Lu', 'Ma', 'Mi', 'Ju', 'Vi', 'Sa'],
        weekdaysEn: ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'],
      },

      monthsEs: [
        'Enero',
        'Febrero',
        'Marzo',
        'Abril',
        'Mayo',
        'Junio',
        'Julio',
        'Agosto',
        'Septiembre',
        'Octubre',
        'Noviembre',
        'Diciembre',
      ],
      monthsEn: [
        'January',
        'February',
        'March',
        'April',
        'May',
        'June',
        'July',
        'August',
        'September',
        'October',
        'November',
        'December',
      ],

      guests: {
        adults: isEs ? 'Adultos' : 'Adults',
        teens: isEs ? 'Jóvenes 12-17' : 'Teens 12-17',
        kids: isEs ? 'Niños 5–11' : 'Kids 5–11',
        infants: isEs ? 'Infantes 0–4' : 'Infants 0–4',
        free: isEs ? 'Sin cargo' : 'No charge',
        each: isEs ? 'c/u' : 'ea',
        totalCrew: isEs ? 'Total beach crew' : 'Total beach crew',
        policy: isEs
          ? 'Política flexible del club: puedes ajustar tu crew hasta un día antes de tu visita.'
          : 'Flexible club policy: you can adjust your crew up to one day before your visit.',
        counterDecreaseAria: isEs ? 'Menos' : 'Decrease',
        counterIncreaseAria: isEs ? 'Más' : 'Increase',
      },

      packages: {
        fullBenefits: isEs
          ? ['Acceso completo de 9am a 6pm', 'Pool y beach access', 'Toalla de cortesía', '10% en comida y bebidas']
          : ['Full access 9am–6pm', 'Pool and beach access', 'Complimentary towel', '10% off food and drinks'],
        halfBenefits: isEs
          ? ['4 horas de acceso', 'Beach lounge chair', 'Pool y beach access', '5% en comida y bebidas']
          : ['4 hours of access', 'Beach lounge chair', 'Pool and beach access', '5% off food and drinks'],
        dayBedsBenefits: isEs
          ? [
              'Acceso todo el día',
              'Day bed premium',
              'Servicio preferente',
              'Jarra de margaritas de cortesía',
            ]
          : ['All-day access', 'Premium day bed', 'Priority service', 'Complimentary pitcher of margaritas'],
        mostPopular: isEs ? 'Más popular' : 'Most popular',
        featureWavesTitle: 'Crystal Clear Waters',
        featureBarTitle: 'Margarita Bar',
        featureSunTitle: 'Endless Sunshine',
        featureWaves: isEs ? 'Agua turquesa todo el año' : 'Turquoise water year-round',
        featureBar: isEs ? 'Cócteles y cocina frente al mar' : 'Cocktails and kitchen by the sea',
        featureSun: isEs ? 'Ambiente cálido y relajado' : 'Warm, relaxed vibe',
        selectPackage: isEs ? 'Seleccionar paquete' : 'Select package',
        selectedPackage: isEs ? 'Seleccionado' : 'Selected',
        cards: {
          full: {
            title: 'Full Pass',
            subtitle: isEs ? 'Todo el día' : 'All day',
            pricePerPerson: isEs ? '$89 / persona' : '$89 / person',
          },
          half: {
            title: 'Half Day',
            subtitle: isEs ? '4 horas' : '4 hours',
            pricePerPerson: isEs ? '$59 / persona' : '$59 / person',
          },
          dayBeds: {
            title: 'Day Beds',
            subtitle: 'Premium VIP',
            pricePerPerson: isEs ? '$149 / persona' : '$149 / person',
          },
        },
        names: {
          fullPass: 'Full Pass',
          halfDay: 'Half Day',
          dayBedsPremium: isEs ? 'Day beds premium' : 'Day beds premium',
        },
      },

      activitiesPicker: {
        title: isEs ? 'Actividades extra' : 'Extra activities',
        lead: isEs
          ? 'Las mismas experiencias que en inicio. Toca una tarjeta para sumarla o quitarla de tu reserva (demo).'
          : 'The same experiences as on the home page. Tap a card to add or remove it from your booking (demo).',
        tapToToggle: isEs ? 'Toca para añadir o quitar' : 'Tap to add or remove',
        inBooking: isEs ? 'En tu reserva' : 'In your booking',
        subtotalLabel: isEs ? 'Subtotal actividades (demo)' : 'Activities subtotal (demo)',
        noneSelected: isEs ? 'Ninguna actividad seleccionada aún.' : 'No activities selected yet.',
      },

      dayBeds: {
        yours: isEs ? 'Tus day beds' : 'Your day beds',
        maxDemo: isEs ? 'Máximo en demo' : 'Demo max',
        canAddMore: isEs ? 'Puedes añadir más' : 'You can add more',
        available: isEs ? 'Disponible' : 'Available',
        selected: isEs ? 'Seleccionado' : 'Selected',
        taken: isEs ? 'Ocupado' : 'Taken',
        beachViewEyebrow: isEs ? 'Vista playa' : 'Beach view',
        selectedLegendTemplate: isEs ? 'Seleccionado ({count}/{max})' : 'Selected ({count}/{max})',
        ariaTemplates: {
          left: isEs ? 'Day bed izquierda {n}' : 'Day bed left {n}',
          right: isEs ? 'Day bed derecha {n}' : 'Day bed right {n}',
          center: isEs ? 'Day bed centro {n}' : 'Day bed center {n}',
        },
        note: isEs
          ? 'Los lugares se asignan por orden de llegada. Tu selección quedará reservada al completar la reserva.'
          : 'Spots are assigned on a first-come basis. Your selection will be reserved once you complete booking.',
      },

      navButtons: {
        prev: isEs ? 'Anterior' : 'Back',
        next: isEs ? 'Siguiente' : 'Next',
        reviewArrow: isEs ? 'Continúa al resumen →' : 'Continue to summary →',
        reviewTitle: isEs ? 'Revisa tu selección y total estimado' : 'Review your selection and estimated total',
      },

      summary: {
        dates: isEs ? 'Fechas' : 'Dates',
        crew: isEs ? 'Beach crew' : 'Beach crew',
        peopleCountTemplate: isEs ? '{n} personas' : '{n} people',
        pkg: isEs ? 'Paquete' : 'Package',
        dayBeds: 'Day beds',
        selectedCountTemplate: isEs ? '{n} seleccionados' : '{n} selected',
        none: isEs ? 'Sin selección' : 'None selected',
        demoNote: isEs ? 'Estimado demo en MXN, sin cobro real.' : 'Demo estimate in MXN, no real charge.',
      },

      packageLabels: {
        none: isEs ? 'Sin seleccionar' : 'Not selected',
        noDate: isEs ? 'Sin fecha' : 'No date',
        oneWay: isEs ? '(solo ida)' : '(one way)',
      },
    },
  };
}

module.exports = { buildSiteCopy };
