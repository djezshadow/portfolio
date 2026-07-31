export const locales = ["es", "en"] as const;
export type Locale = (typeof locales)[number];
export const defaultLocale: Locale = "es";

const dictionaries = {
  es: {
    nav: { contact: "Contacto", downloadReel: "Descargar reel (PDF)" },
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
      name: "Nombre",
      email: "Email",
      message: "Mensaje",
      send: "Enviar mensaje",
      sending: "Enviando…",
      whatsapp: "Escribime por WhatsApp →",
      instagram: "O escribime por Instagram →",
      success: "Mensaje enviado — te respondo a la brevedad.",
      confirmSent: "¡Casi! Te mandamos un mail para confirmar que sos vos — revisá tu bandeja de entrada (y spam) y tocá el botón de ahí.",
    },
    footer: { rights: "Todos los derechos reservados." },
    comingSoon: {
      label: "Próximamente",
      hint: "Todavía se está filmando esta historia.",
    },
  },
  en: {
    nav: { contact: "Contact", downloadReel: "Download reel (PDF)" },
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
      name: "Name",
      email: "Email",
      message: "Message",
      send: "Send message",
      sending: "Sending…",
      whatsapp: "Message me on WhatsApp →",
      instagram: "Or message me on Instagram →",
      success: "Message sent — I'll reply soon.",
      confirmSent: "Almost there! We sent you an email to confirm it's you — check your inbox (and spam) and tap the button there.",
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
