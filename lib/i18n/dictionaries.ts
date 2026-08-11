export const locales = ["es", "en"] as const;
export type Locale = (typeof locales)[number];
export const defaultLocale: Locale = "es";

const dictionaries = {
  es: {
    nav: { contact: "Contacto", downloadReel: "Descargar reel (PDF)", about: "Sobre mí" },
    hero: {
      reel: "REEL",
      title1: "Cada corte",
      title2: "cuenta algo.",
      subtitle:
        "Dirección, edición y postproducción. Un archivo vivo de lo que fui filmando, con quién, y por qué.",
    },
    featured: { label: "Destacados", sampleNotice: "datos de muestra — conectá DATABASE_URL para ver los reales" },
    category: {
      previewBanner: "Vista previa de admin — incluye borradores y programados que el público no ve todavía",
      empty: "Todavía no hay proyectos cargados en esta categoría.",
      with: "con",
    },
    contact: {
      title: "Hablemos",
      subtitle: "Contame sobre tu proyecto y te respondo en breve.",
      confirmNotice: "Por seguridad, antes de que me llegue tu mensaje te voy a pedir que confirmes tu mail. Si preferís algo más directo, escribime por Instagram.",
      name: "Nombre",
      email: "Email",
      message: "Mensaje",
      send: "Enviar mensaje",
      sending: "Enviando…",
      whatsapp: "Escribime por WhatsApp →",
      instagram: "O escribime por Instagram →",
      success: "¡Casi! Te mandé un mail para confirmar que sos vos — tocá el link de ahí (revisá spam si no lo ves) y recién ahí me llega tu mensaje.",
    },
    footer: { rights: "Todos los derechos reservados." },
    comingSoon: {
      label: "Próximamente",
      hint: "Todavía se está filmando esta historia.",
    },
  },
  en: {
    nav: { contact: "Contact", downloadReel: "Download reel (PDF)", about: "About me" },
    hero: {
      reel: "REEL",
      title1: "Every cut",
      title2: "means something.",
      subtitle:
        "Direction, editing and post-production. A living archive of what I've been shooting, with whom, and why.",
    },
    featured: { label: "Featured", sampleNotice: "sample data — connect DATABASE_URL to see the real one" },
    category: {
      previewBanner: "Admin preview — includes drafts and scheduled posts the public can't see yet",
      empty: "No projects loaded in this category yet.",
      with: "with",
    },
    contact: {
      title: "Let's talk",
      subtitle: "Tell me about your project and I'll get back to you shortly.",
      confirmNotice: "For security, I'll ask you to confirm your email before your message reaches me (one tap, like WeTransfer). If you'd rather skip that, message me on Instagram instead.",
      name: "Name",
      email: "Email",
      message: "Message",
      send: "Send message",
      sending: "Sending…",
      whatsapp: "Message me on WhatsApp →",
      instagram: "Or message me on Instagram →",
      success: "Almost there! I sent you an email to confirm it's you — tap the link there (check spam if you don't see it) and your message will reach me right after.",
    },
    footer: { rights: "All rights reserved." },
    comingSoon: {
      label: "Coming soon",
      hint: "This story is still being filmed.",
    },
  },
} as const;

export function getDictionary(locale: Locale) {
  return dictionaries[locale] ?? dictionaries[defaultLocale];
}
