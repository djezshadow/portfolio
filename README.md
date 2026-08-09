# DJEZSHADOW — Portfolio (completo + watermark personalizado).

## Fase 8 — watermark horneado, subcategorías como cuadro, portadas propias,
## mover contenido entre proyectos, navbar rediseñada, y el mail de contacto
## roto

**El bug crítico: el mail de contacto nunca funcionó.** El flujo pedía
confirmación por mail al VISITANTE (no a vos) antes de mandarte el mensaje —
eso requiere un dominio propio verificado en Resend, así que en modo
sandbox (sin dominio verificado) siempre fallaba con "No se pudo enviar el
mail". Se simplificó: ahora manda directo a tu casilla (`CONTACT_EMAIL_TO` /
lo que pongas en Configuración), con "responder a" apuntando a quien
escribió. Se borró el paso de confirmación (`/contacto/confirmar`,
`lib/contact-token.ts`).

**El bug del carrusel/hero "cambio algo y no pasa nada":** la home
(`/[locale]/page.tsx`) era la única página pública sin
`export const dynamic = "force-dynamic"` — Vercel podía servir una versión
vieja en caché después de guardar cambios en Configuración. Ya se agregó,
igual que en el resto de las páginas.

**Watermark: vuelta al esquema horneado (no más al vuelo).** Cada foto
ahora guarda:
- `url` — el original SIN marca, se conserva siempre (por si cambiás
  posición/opacidad y hay que rehornear).
- `bakedThumbUrl` (800px) y `bakedFullUrl` (2000px) — versiones YA
  procesadas con el watermark adentro, listas para servir directo desde
  Vercel Blob sin tocar `sharp` en cada visita.

Las fotos nuevas se hornean solas al subirlas. Si cambiás algo del
watermark (posición, opacidad, logo) en Configuración, apretás
**"Aplicar marca de agua a todas las fotos"** y reprocesa todo, borrando
las versiones viejas y reemplazándolas — puede tardar si tenés muchas
fotos (corre secuencial, no en paralelo, para no saturar la función de
Vercel; en plan Hobby el timeout puede cortarlo a mitad de camino, no pasa
nada, las que ya se procesaron quedan bien, apretás de nuevo). El logo del
watermark ahora también acepta WebP además de PNG.

**Subcategorías como "cuadro nuevo".** Si un proyecto tiene subcategorías,
el visor público ya no entra directo a las fotos: primero muestra una
grilla con una card por subcategoría (portada + nombre + cantidad de
fotos), y ahí elegís cuál mirar. Cada subcategoría tiene su propia
portada — subís una personalizada (recomendado **1600×900px**, se recorta
a 16:9) o si no subís nada usa la primera foto de esa subcategoría.

**Mover contenido entre proyectos/categorías:**
- Mover un **proyecto** a otra categoría: ya funcionaba (el dropdown
  "Categoría" en `/admin/proyectos/[id]`), no hizo falta nada nuevo.
- Mover una **subcategoría completa** (con todas sus fotos) a **otro
  proyecto**: nuevo, desde el panel de subcategorías en
  `/admin/proyectos/[id]`.

**Navbar rediseñada:** antes todo (logo, links, EN, tema) vivía en una
sola píldora. Ahora en desktop son 3 piezas separadas — logo arriba a la
izquierda, links al centro, EN + tema arriba a la derecha. En celular el
logo se centra arriba, y en vez de EN+tema aparece un botón de
hamburguesa (☰) que abre un sidebar deslizable desde la derecha (se cierra
tocando afuera, con la cruz, o arrastrando el panel hacia la derecha con
el dedo) con todos los links + EN + tema adentro.

**Importante — schema cambió de nuevo, pero esta vez sin riesgo de
pérdida de datos** (todo lo nuevo son columnas opcionales y tablas
nuevas): `Media.bakedThumbUrl`, `Media.bakedFullUrl`,
`MediaGroup.coverImageUrl`, `Category.coverImageUrl`. Si ya corriste la
migración de `Collaborator.type` de la fase anterior, esta vez alcanza
con `npx prisma db push` directo, sin pasos extra.

## Fase 7 — lista de pedidos completa + rendimiento (última tanda)

Todo lo que se agregó respondiendo a la lista de 22 pedidos, más un par de
arreglos de rendimiento y estética que salieron probando el sitio.

**Nuevo (features):**
- **Sección "Sobre mí / About Me"** (`/admin/sobre-mi` + página pública
  `/[locale]/sobre-mi`): se puede prender/apagar del todo, el contenido se
  escribe en Markdown propio (`lib/markdown.ts`, sin dependencias externas —
  soporta `##` subtítulos, listas con viñetas y numeradas, negrita, links) con
  preview en vivo, y admite CSS personalizado (pensado para cuando esto se
  venda como plantilla a otros clientes).
- **Subcategorías dentro de proyectos** (modelo `MediaGroup`): en
  `/admin/proyectos/[id]` se crean/renombran/borran, y cada foto se asigna a
  una desde un selector. En el lightbox público se ven agrupadas con su
  nombre como separador en la tira de miniaturas.
- **Portadas** (`Category.coverImageUrl` + `Media.isThumbnail`, este último ya
  existía en el schema pero no se usaba en ningún lado): las categorías
  tienen portada subible desde `/admin/categorias/[id]` (se ve en el carrusel
  de la home), y cada proyecto elige cuál de sus fotos es la portada con un
  radio "Portada" en `/admin/proyectos/[id]` — antes siempre se forzaba la
  primera foto subida.
- **Tipos de relación personalizables** (`/admin/tipos-colaborador`, modelo
  `CollaboratorTypeOption`): reemplaza el enum fijo `client`/`creative`. Cada
  tipo tiene un flag "Es Cliente" que decide si cae en la sección Clientes o
  Colaboradores de la vista pública. No se puede borrar un tipo en uso.
- **Participantes dentro de colaboradores** (modelo `Participant`): nombre,
  rol ES/EN, Instagram y website, todo opcional. Se cargan desde
  `/admin/colaboradores/[id]` y se muestran en el popup público del
  colaborador, debajo de sus propios links.
- **Barras de progreso al subir fotos** (`media-dropzone.tsx`): porcentaje
  real por foto vía `onUploadProgress` de Vercel Blob, más una barra global
  del promedio.
- **Estados de carga en botones del admin** (`components/admin/submit-button.tsx`,
  usa `useFormStatus`): spinner + "Guardando…" en los formularios principales
  (proyecto, colaborador, categoría, logos, watermark, contacto, hero, About Me).

**Rendimiento (fotos lentas en producción):**
- El visor grande (lightbox) pedía la imagen a resolución ORIGINAL sin tope —
  ahora tiene un techo de 2000px (`LIGHTBOX_WIDTH` en `project-lightbox.tsx`).
- Al abrir una foto se precargaba el proyecto ENTERO a resolución completa de
  una — ahora solo precarga la foto siguiente y la anterior.
- El logo de watermark personalizado se volvía a descargar y reprocesar en
  cada foto servida — se cachea en memoria (`lib/watermark.ts`).
- La configuración del sitio (para saber si aplicar watermark) se consultaba
  en la base de datos en cada foto — se cachea 60s (`app/api/media/[id]/route.ts`).
- **Progreso de carga también en el sitio público**: `components/progressive-image.tsx`
  muestra el % real de descarga en el lightbox (no un spinner genérico) —
  ojo, el componente que lo use no debe disparar OTRO pedido a la misma URL
  al mismo tiempo (el navegador los une y el progreso deja de reportarse de a poco).

**Fixes puntuales:**
- Cursor "magnético" (`custom-cursor.tsx`) — ya estaba sin usar en el código,
  se borró el archivo.
- Popup de colaborador (Instagram/Website) muy transparente contra el fondo —
  pasó de `.glass` a `.nav-surface` (mismo fix que ya se había hecho en el navbar).
- Nombre de colaborador muy largo desacomodaba la grilla — cada ítem tiene
  ancho fijo ahora, el nombre se acomoda en hasta 2 líneas adentro.
- Tipografía de "Clientes"/"Colaboradores" en `/colaboradores` (página
  dedicada) se veía igual de grande y pesada que el título — bajada a
  etiqueta chica en mono con líneas a los costados, a propósito distinta de
  cómo se ve la misma sección en la home.

**Importante — cambió el schema.** Además de `npx prisma db push`, si tenías
colaboradores cargados hacé el paso extra que evita perder el tipo
(Cliente/Colaborador) de cada uno: correr
`npx prisma db execute --file ./prisma/fix-collaborator-type.sql --schema ./prisma/schema.prisma`
ANTES del `db push` (convierte la columna de enum a texto sin perder los
valores existentes). El archivo `.sql` se armó puntualmente para esa
migración — si ya lo corriste una vez, no hace falta de nuevo.

## Watermark personalizado + contacto

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
