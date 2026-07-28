# DJEZSHADOW — Portfolio (completo + watermark personalizado)

## Watermark personalizado + contacto (última tanda)

- **Logo de watermark propio** (`/admin/configuracion`): subís un PNG con transparencia
  y reemplaza al ícono de diafragma en todas las fotos nuevas que subas con el
  watermark activado. La página tiene la guía completa de specs (formato,
  tamaño recomendado, contenido ideal) directamente en la UI. También podés
  ajustar qué % del ancho de la foto ocupa (escala global), mientras que
  opacidad y posición se siguen eligiendo por foto como antes.
- **Instagram en contacto**: agregué un botón fijo a `instagram.com/djezshadow`
  debajo del de WhatsApp en `/contacto` (siempre visible, no depende de env vars
  — si algún día cambiás de usuario, se puede sobreescribir con
  `NEXT_PUBLIC_INSTAGRAM_HANDLE`).
- Como el schema sumó el modelo `SiteSettings`, corré `npx prisma db push` de nuevo.

## Cómo activar el mail de contacto (Resend)

1. Cuenta gratis en [resend.com](https://resend.com) (alcanza de sobra: 3000
   emails/mes, 100/día).
2. **API Keys → Create API Key** → copiá el valor.
3. En Vercel: Settings → Environment Variables → agregá:
   - `RESEND_API_KEY` = la key que copiaste
   - `CONTACT_EMAIL_TO` = tu email real, donde querés recibir los mensajes
4. **Importante**: mientras no verifiques un dominio propio en Resend, los mails
   solo se pueden enviar **al mismo email con el que te registraste** en Resend
   (limitación de las cuentas sin dominio verificado, no es un bug nuestro).
   Si `CONTACT_EMAIL_TO` es ese mismo email, ya funciona tal cual. Si más
   adelante querés recibirlos en otra casilla o mandar desde
   `hola@djezshadow.com`, hay que verificar tu dominio en Resend → Domains →
   Add Domain (te da registros DNS para cargar donde tengas comprado el dominio).
5. Redeploy después de agregar las variables.

## Edición y borrado (admin)

- **Editar proyecto** (`/admin/proyectos/[id]`, accesible clickeando cualquier
  proyecto desde `/admin`): todos los campos ES/EN, cambiar categoría,
  destacar, re-publicar/reprogramar, **borrar fotos sueltas** (marcá el check
  sobre la miniatura) y agregar fotos nuevas — todo en el mismo formulario.
- **Borrar proyecto**: botón arriba a la derecha en la edición, pide
  confirmación y borra también sus fotos del Blob storage.
- **Editar/borrar colaborador** (`/admin/colaboradores/[id]`, clickeando
  cualquier colaborador de la lista): mismo patrón — editar datos/logo o
  borrarlo (si borrás uno, los proyectos que lo mencionan quedan sin
  colaborador asignado, no se rompen).
- Como el schema cambió (relación colaborador→proyecto explícita), corré de
  nuevo `npx prisma db push`.

## Fase 6 — pulido final

- **Multi-idioma ES/EN (#39)**: el sitio público vive bajo `/es` y `/en`
  (`app/[locale]/...`), con diccionarios en `lib/i18n/dictionaries.ts`. El
  middleware redirige `/` → `/es` automáticamente. El admin se queda solo en
  español (es una herramienta interna, no hace falta traducirlo).
- **Categoría "incógnita" / coming soon (#47)**: en `/admin/categorias` hay un
  checkbox "Categoría incógnita" — esa categoría no aparece en destacados ni en
  el sitemap, y su página muestra un easter egg: un botón "?" que hay que
  clickear 6 veces (como las aspas del watermark) para revelar la pista que
  vos escribas.
- **Descarga de PDF del reel (#48)**: botón "Descargar reel (PDF)" en la home,
  genera al vuelo (`/api/reel-pdf`) un PDF con todos los proyectos publicados
  agrupados por categoría.

### Notas

- Como las páginas públicas cambiaron de ubicación (`app/page.tsx` →
  `app/[locale]/page.tsx`, etc.), si tenías links guardados a `/categoria/...`
  ahora son `/es/categoria/...` o `/en/categoria/...`.
- Corré `npx prisma db push` de nuevo (se agregó `isComingSoon`/`comingSoonHint`
  a `Category`) y `npm install` (sumé `@react-pdf/renderer`).

## Fase 5 — SEO, analytics, contacto, CRUD

- **SEO automático + manual (#42)**: cada categoría genera su `<title>`/`<meta description>`
  y Open Graph (con la primera foto publicada como imagen) automáticamente. Si cargás
  `metaTitle`/`metaDescription` a mano en `/admin/categorias`, esos pisan lo automático.
  El formulario te muestra el largo ideal (50–60 y 150–160 caracteres).
- **Sitemap y robots.txt automáticos (#43)**: `app/sitemap.ts` y `app/robots.ts`, generados
  a partir de las categorías reales en la base. El admin queda bloqueado para buscadores.
- **Contacto (#44)**: `/contacto` con formulario funcional por email (vía Resend) +
  botón de WhatsApp que solo aparece si cargás `NEXT_PUBLIC_WHATSAPP_NUMBER`.
- **Analytics (#46)**: Vercel Analytics ya integrado en el layout.
- **CRUD de categorías** (`/admin/categorias`): crear y editar categorías completas
  (nombre, orden, tema manual/auto, estilo tipográfico, SEO) sin tocar Prisma Studio.
- **CRUD de colaboradores** (`/admin/colaboradores`): crear colaboradores con logo
  (se sube y convierte a WebP igual que las fotos de proyecto).

### Cómo activarlo

1. Cuenta gratis en [resend.com](https://resend.com), copiá tu API key a `RESEND_API_KEY`
   y tu email a `CONTACT_EMAIL_TO` en `.env`.
2. Poné la URL real de tu sitio en `SITE_URL` (afecta SEO, sitemap y OG tags).
3. (Opcional) Si vas a usar WhatsApp, poné el número completo con código de país en
   `NEXT_PUBLIC_WHATSAPP_NUMBER` (ej: `5493511234567`, sin espacios ni el +).
4. Como el schema cambió (SEO en `Category`), corré de nuevo `npx prisma db push`.
5. `npm install` (sumé `@vercel/analytics`).

## Fase 4 — panel de admin

- **Login seguro** en `/admin/login`: password con hash bcrypt (nunca en texto plano),
  sesión con JWT firmado en cookie httpOnly (`lib/auth.ts`), rutas `/admin/*` protegidas
  por `middleware.ts`.
- **Nuevo proyecto** (`/admin/proyectos/nuevo`): formulario con drag & drop de fotos/video
  (`components/admin/media-dropzone.tsx`), watermark opcional (ícono de diafragma de
  cámara — la forma que se definió en el spec), con opacidad y posición configurables.
- Al subir una foto: se aplica el watermark si lo activaste, se convierte a **WebP
  calidad 82** (según la guía de export del spec) y se sube a **Vercel Blob**
  (`app/admin/proyectos/nuevo/actions.ts`).
- **Programar publicación (#38)**: cada proyecto puede ser Borrador / Publicado ahora /
  Programado a una fecha futura (`publishedAt` en el schema). El sitio público solo
  muestra lo ya publicado.
- **Vista previa (#37)**: si estás logueado como admin, `/categoria/[slug]` te muestra
  también los borradores y programados con un banner que lo aclara — no hace falta una
  ruta de preview separada.
- Dashboard (`/admin`) con el estado de cada proyecto (Borrador/Programado/Publicado).

### Cómo activarlo

1. Generá el hash de tu contraseña:
   ```bash
   npx tsx scripts/hash-password.ts "tuPasswordSegura"
   ```
   Pegá el resultado en `.env` como `ADMIN_PASSWORD_HASH`.
2. Generá un secreto para firmar las sesiones y ponelo en `ADMIN_JWT_SECRET`
   (cualquier string larga random sirve, ej: `openssl rand -base64 32`).
3. En tu proyecto de Vercel: **Storage → Blob → Create Store**, copiá el token
   a `BLOB_READ_WRITE_TOKEN` en `.env` (en local funciona igual apuntando al store de Vercel).
4. Como cambió el schema (se agregó `publishedAt`), corré de nuevo:
   ```bash
   npx prisma db push
   npm run db:seed
   ```
5. `npm run dev` → entrá a `/admin/login` con tu contraseña.

## Fase 3 — base de datos real

- **Prisma + Postgres** (`prisma/schema.prisma`): modelos `Category`, `CategoryStyle`,
  `Project`, `Media`, `Collaborator`, `Tag` — cubre items #1 a #8, #22, #23, #30-#33.
- Cada `Category` tiene su propio `themeMode` (auto/manual) y `themeName`, y un
  `CategoryStyle` (color, tipografía, bold, tachado, alineación, stroke) real
  en base de datos — ya no hardcodeado.
- Página dinámica `/categoria/[slug]` (`app/categoria/[slug]/page.tsx`) trae los
  datos con Prisma y los renderiza con `components/category-view.tsx`, que:
  - resuelve el tema final combinando el switch global (`useTheme`) con el
    override de la categoría (`resolveCategoryTheme`)
  - aplica el estilo tipográfico de esa categoría al título
  - muestra fotos (Next/Image, ya optimizado a WebP/AVIF por Next) y videos
    (facade con `components/video-embed.tsx`: no carga el iframe pesado de
    YouTube/Vimeo hasta hacer click)
- La home (`app/page.tsx`) intenta traer categorías reales; si todavía no
  configuraste la base, cae automáticamente a datos de muestra (no se rompe).

### Cómo activar la base de datos

1. Creá una cuenta gratis en [neon.tech](https://neon.tech) (Postgres serverless,
   tiene un plan free que alcanza de sobra para esto).
2. Copiá `.env.example` a `.env` y pegá tu connection string en `DATABASE_URL`.
3. Corré:
   ```bash
   npx prisma db push   # crea las tablas
   npm run db:seed      # carga datos de muestra (1 categoría auto + 1 manual/neón)
   ```
4. `npm run dev` y entrá a `/categoria/cortometrajes` o `/categoria/musica`.

Para ver/editar los datos con una interfaz visual: `npm run db:studio`.

## Fase 2 — agregado

- **Cursor custom** (`components/custom-cursor.tsx`): blob líquido con inercia (spring)
  que se infla y se atrae hacia elementos marcados `data-cursor="magnetic"`. Se
  desactiva solo en touch y respeta `prefers-reduced-motion`.
- **Carrusel liquid glass** (`components/carousel.tsx`): configurable, entre 3 y 10
  ítems (`minItems`/`maxItems`), scroll horizontal con snap + flechas.
- **Reveal** (`components/reveal.tsx`): wrapper reutilizable para animaciones de
  scroll (fade + desplazamiento), usado en el hero y secciones de home.
- **Preloader** (`components/preloader.tsx`): intro animada con el nombre de marca,
  se muestra una vez por sesión (`sessionStorage`), respeta reduced motion al no
  tener movimiento brusco.

## Qué incluye la Fase 1 (setup base)

- Next.js 15 + TypeScript + Tailwind v4
- Sistema de temas **Noir (claro) / Neón (oscuro)**, con Manual/Automático a nivel global
  (la lógica por categoría ya está preparada en `components/theme-provider.tsx`,
  se conecta a la base de datos en la Fase 3)
- Estilo **liquid glass** vía la clase utilitaria `.glass` en `app/globals.css`
- Tipografías: **Fraunces** (display/títulos), **Geist Sans** (UI/cuerpo), **Geist Mono** (timecodes/metadata)
- Elemento firma: **barra de timecode** (`components/timecode-bar.tsx`) — el scroll de la
  página se lee como un timecode SMPTE (00:00:00:00), con un playhead que recorre una
  línea tipo film-strip. Reemplaza el típico progress bar genérico.
- Home de muestra con hero + tarjetas de categoría (datos hardcodeados por ahora)

## Cómo correrlo

```bash
npm install
npm run dev
```

Abrí http://localhost:3000

## Spec completo ✅

Con esta fase quedaron cubiertos los 50 ítems del spec original. De acá en más
es iteración/pulido de detalles puntuales (diseño, contenido real, ajustes que
vayan surgiendo al usarlo) más que fases nuevas.

## Notas de diseño

- El acento ámbar/bronce (`--accent` en modo Noir) referencia luz de tungsteno (3200K),
  no un naranja genérico.
- El modo Neón usa violeta + cian sobre un fondo casi negro, evitando el cliché
  verde ácido/negro puro.
- Los timecodes (mono, tabular-nums) se usan en vez de fechas planas o numeración
  01/02/03 genérica, porque en este proyecto sí tienen sentido narrativo (cine).
