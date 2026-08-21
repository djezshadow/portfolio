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
      subtitle: "Podés contactarme por acá y te respondo en breve.",
      confirmNotice: "Por seguridad, cuando envíes el formulario vas a recibir un mail de confirmación. Tu mensaje me llegará recién después de que confirmes tu dirección de correo electronico. Si preferís algo más directo, escribime por Instagram.",
      name: "Nombre",
      email: "Email",
      message: "Mensaje",
      send: "Enviar mensaje",
      sending: "Enviando…",
      whatsapp: "Escribime por WhatsApp →",
      instagram: "O escribime por Instagram →",
      success: "Revisá tu correo para confirmar tu dirección. Una vez completada la verificación, tu mensaje será enviado. Si no ves el correo, revisá la carpeta de spam.",
    },
    footer: { rights: "Todos los derechos reservados." },
    comingSoon: {
      label: "Próximamente",
      hint: "Todavía se está filmando esta historia.",
    },
    instagram: { label: "Instagram", feed: "Feed", highlights: "Destacadas", followOn: "Seguime en" },
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
      subtitle: "You can contact me here, and I’ll get back to you shortly.",
      confirmNotice: "For security reasons, when you submit the form, you’ll receive a confirmation email. Your message will only reach me after you confirm your email address. If you prefer a more direct way to get in touch, feel free to message me on Instagram.",
      name: "Name",
      email: "Email",
      message: "Message",
      send: "Send message",
      sending: "Sending…",
      whatsapp: "Message me on WhatsApp →",
      instagram: "Or message me on Instagram →",
      success: "Check your email to confirm your address. Once the verification is complete, your message will be sent. If you don’t see the email, check your spam folder.",
    },
    footer: { rights: "All rights reserved." },
    comingSoon: {
      label: "Coming soon",
      hint: "This story is still being filmed.",
    },
    instagram: { label: "Instagram", feed: "Feed", highlights: "Highlights", followOn: "Follow on" },
  },
} as const;

export function getDictionary(locale: Locale) {
  return dictionaries[locale] ?? dictionaries[defaultLocale];
}
