# DJEZSHADOW — Portfolio (completo + watermark personalizado).

## Fase 14 — bug de tipos de colaborador, nombres del navbar editables,
## reordenar fotos, CV con @usuario, kicker del hero editable

**Bug real corregido: tipos de colaborador custom caían siempre en
"Colaboradores".** El sistema solo tenía 2 baldes fijos (Clientes/
Colaboradores) según un flag `isClient`. Si creabas un tipo nuevo (ej.
"Prensa") sin marcarlo como cliente, quedaba mezclado en el balde
genérico "Colaboradores" en vez de tener su propia sección. Ahora tanto
la home como `/colaboradores` agrupan dinámicamente **por cada tipo**,
en el orden en que están definidos en `/admin/tipos-colaborador` — ya
no son 2 secciones fijas, son tantas como tipos tengas con al menos un
colaborador cargado.

**Nombres del navbar editables.** En `/admin/navbar`, los 5 ítems fijos
(Home, Sobre mí, Colaboradores, Contacto, CV) tienen un lápiz ✏️ para
renombrarlos en ES/EN — las categorías/proyectos siguen usando su
nombre real (se editan en su propia sección). De paso: el botón Home
decía "Home" en los dos idiomas por error de copy/paste — ahora dice
"Inicio" en español por default.

**Reordenar fotos/videos subidos** — flechas arriba/abajo en la grilla
de `/admin/proyectos/[id]`, mismo patrón que categorías/subcategorías.

**CV: Instagram/LinkedIn ahora piden solo tu usuario** (ej. `djezshadow`,
no la URL completa) — se limpia automáticamente si pegás una URL por
costumbre. En el PDF aparecen como chips con "IG ·" / "in ·" (react-pdf
no soporta bien logos SVG de marca reales sin bundlear assets de imagen,
así que usé esta versión minimalista en vez de los logos oficiales).

**El "REEL — 00:00:00:00" del hero ahora es editable.** Es 100%
decorativo — simula el timecode de un editor de video para la estética
"cada corte cuenta algo", no tiene ninguna función. Podés cambiar la
palabra (ES/EN) o apagar el "— 00:00:00:00" desde Configuración, con
la explicación en el propio panel.

**Fix: logo pegado al "REEL" en mobile horizontal** — le agregué
separación.

**Importante — schema nuevo, aditivo:** `SiteSettings.navLabels`,
`heroKicker(En)`, `heroKickerShowTimecode`.

## Fase 13 — botón Home, links custom del navbar, ojito de mostrar/ocultar,
## confirmación de descarga del CV, fix de cruz en álbum, fix de footer
## duplicado, ajustes de horizontal (PDF "Correcciones y mejoras v2")

Arrancando a implementar el PDF que mandaste. Lo que quedó cerrado esta
tanda:

- **1.1 Botón Home** en el navbar (desktop + sidebar mobile).
- **1.2 Links personalizados del navbar** — modelo nuevo `CustomNavLink`,
  con su propio panel en `/admin/navbar` (nombre ES/EN + URL, para
  internos o externos).
- **1.3 Confirmación antes de descargar el CV** — los 4 lugares donde
  aparecía el link de CV (nav desktop, sidebar mobile, home, sobre-mí)
  ahora abren un popup "¿Descargar el CV?" con Cancelar/Descargar; la
  descarga arranca recién al confirmar.
- **Ojito de mostrar/ocultar en el navbar** (pedido tuyo, no estaba en
  el PDF): cada ítem de `/admin/navbar` — categorías, proyectos, Sobre
  mí, Colaboradores, Contacto, CV — tiene un toggle 👁️/🚫 para
  prender/apagarlo sin ir a buscarlo a otra sección. Sumé
  `colaboradoresInNav`/`contactoInNav` porque esos dos no tenían forma
  de ocultarse antes.
- **5.1 La cruz dentro de un álbum ahora vuelve a las subcategorías**
  en vez de cerrar todo el visor — y saqué el link "← Subcategorías"
  que ya no hace falta (la cruz cumple esa función).
- **Bug encontrado: footer duplicado.** Cuando armé el `Footer` nuevo
  (fase 11), no vi que ya existía un footer viejo con el copyright en
  `app/layout.tsx` — por eso en mobile se veían dos textos de copyright
  pegados/superpuestos. Saqué el viejo.
- **2.1/8.2 Footer responsive real**: en mobile vertical (y horizontal
  angosto) se ve solo el copyright corto; en desktop, o mobile
  horizontal con espacio real (≥700px de ancho), se ve todo (links +
  redes + copyright).
- **8.4 Espacio navbar↔contenido en horizontal**: un poco más de aire
  en landscape con poca altura, para que no se pisen.
- **8.5 Íconos gigantes en horizontal**: revisé todo el código y no
  encontré ningún ícono medido en `vw`/`vh` que lo explique — todos
  usan px fijos. Necesito una captura del problema puntual para poder
  arreglarlo (puede ser algo de un navegador/dispositivo específico).

**Importante — schema nuevo, aditivo:** modelo `CustomNavLink`, y en
`SiteSettings`: `colaboradoresInNav`, `contactoInNav`.

## Fase 12 — 5 diseños de carrusel nuevos + reordenar todo

**5 presets nuevos de carrusel** (+ preview en vivo en admin): Filmstrip
(tiras tipo negativo 35mm), Editorial (grid asimétrico tipo revista),
Marquee (loop horizontal automático, se pausa al hover), Split (imagen +
panel de color con efecto cortina al hover), Polaroid (fotos apiladas y
rotadas al azar, se enderezan al hover). Se suman a los 3 que ya
existían (Cards/Minimal/Stack) — 8 en total, todos con soporte de
portada. De paso: bug encontrado — la validación del preset en la home
solo reconocía "minimal"/"stack" a mano, cualquier otro valor caía
siempre a "cards"; ahora valida contra la lista completa.

**Reordenar categorías, subcategorías y navbar** — con flechas
arriba/abajo (no drag-and-drop, más confiable y sin dependencias
nuevas):
- Categorías: en `/admin/categorias`.
- Subcategorías de un proyecto: en el panel de subcategorías dentro de
  `/admin/proyectos/[id]`.
- Orden del navbar completo (categorías, proyectos con acceso directo,
  Sobre mí, Colaboradores, Contacto, CV): nueva página `/admin/navbar`.
  Se guarda como JSON (`SiteSettings.navOrder`) — los ítems nuevos que
  no estén todavía en ese orden guardado van al final, en su orden
  natural.

**Importante — schema nuevo, aditivo:** solo se agregó
`SiteSettings.navOrder` (texto, JSON). El resto de esta fase usa campos
`order` que ya existían en Category/MediaGroup.

## Fase 11 — footer, Coming Soon por proyecto, confirmación de mail estilo
## WeTransfer

**Footer nuevo** al pie de todas las páginas: link a Sobre mí (si está
habilitado) + Contacto, y hasta 4 íconos de redes sociales (Instagram,
TikTok, LinkedIn, YouTube) configurables desde Configuración — vacío =
no se muestra ese ícono.

**Coming Soon también a nivel proyecto** (antes solo existía para
categorías): en `/admin/proyectos/[id]` y `/nuevo` hay un toggle
"Proyecto en pausa" con mensaje ES/EN propio. Se ve gris/con candado
dentro de su categoría, y tocarlo muestra el popup en vez de abrir el
visor. También se puede dar de alta como **acceso directo en el
navbar** (`showInNav`) — como los proyectos no tienen página propia
(viven dentro de su categoría), el link usa
`/categoria/[slug]?proyecto=<id>` y `category-view.tsx` lo detecta al
cargar para abrir ese proyecto solo (o el popup, si sigue en pausa).

**Mensaje del easter egg de 6 toques, independiente del popup.** Antes
usaba el mismo texto que el popup de destacados/nav (`comingSoonHint`).
Ahora es un campo separado (`easterEggMessage`/`En`) — la pista pública
puede ser una cosa, y el secreto que se descubre tocando 6 veces el
signo de pregunta (cuando entrás por la URL directa de una categoría
en pausa) puede ser otra completamente distinta.

**Confirmación de mail estilo WeTransfer, reactivada.** Ahora que hay
dominio propio verificado en Resend (djezshadow.com), el flujo de doble
confirmación que se había sacado por el bug del sandbox vuelve, esta
vez andando: alguien escribe → se le manda un mail para confirmar que
es su casilla real → recién al tocar ese link te llega el mensaje a
vos. El formulario avisa esto ANTES de mandar (con la alternativa de
Instagram si prefieren algo directo) y confirma DESPUÉS que hay que
revisar el mail. Nuevo: `RESEND_FROM_EMAIL` en `.env` para mandar desde
tu propio dominio en vez del sandbox de Resend (ej:
`"DJEZSHADOW <hola@djezshadow.com>"`) — sin configurar, sigue usando el
sandbox como respaldo.

**Importante — schema nuevo, aditivo:** `Project.isComingSoon`,
`comingSoonHint(En)`, `showInNav`; `Category.easterEggMessage(En)`;
`SiteSettings.footer*Url` (4 campos).

## Fase 10 — Coming Soon rediseñado, carrusel real en la home, swipe,
## animación de carga personalizable, watermark manual por foto

**Bug real encontrado: el carrusel nunca se usaba con datos reales.**
Con categorías de verdad cargadas, la home mostraba una grilla fija en
vez del componente `Carousel` — por eso el selector "Estilo del
carrusel" (Cards/Minimal/Stack) en Configuración no se notaba nunca.
Arreglado: ahora `Carousel` se usa siempre.

**Coming Soon rediseñado.** Antes: la categoría se escondía del todo de
destacados, y solo mostraba un "coming soon" si entrabas directo por
URL. Ahora: aparece en destacados Y en la navbar, en gris con candado
🔒, y tocarla abre un popup con tu pista en vez de navegar — tanto en
la home (`Carousel`) como en el nav (`NavLinksDesktop` / `MobileNav`).

**Swipe en el visor.** El lightbox ahora tiene `drag="x"` (Framer
Motion) sobre la imagen/video — deslizás con el dedo (o arrastrás con
mouse) para pasar de foto.

**Reel y CV: agrupados por categoría + subcategorías.** Los dos PDFs
ahora muestran el portfolio organizado por categoría, y cada proyecto
lista sus subcategorías si tiene.

**CV: Instagram + LinkedIn** agregados al perfil y al PDF.

**Énfasis visual en "CV"** dentro de la navbar (desktop y sidebar
mobile) — fondo de color en vez de texto plano.

**Animación de carga personalizable (`/admin/carga`).** Next.js ya
muestra esto solo (`loading.tsx`) mientras una página tarda en traer
datos — pensado para Vercel free, que a veces tarda. Podés subir un gif
o webp animado (se guarda tal cual, SIN comprimir, para no perder la
animación), elegir posición y tamaño por separado para desktop y
celular, con dos marcos de preview en vivo (uno tipo PC, uno tipo
celular). Sin nada subido, usa un spinner default con la estética del
sitio.

**Watermark manual por foto individual.** En `/admin/proyectos/[id]`,
cada foto tiene un link "Ajustar watermark" — podés pisar la posición
y/o la opacidad SOLO para esa foto (el resto sigue la config global de
Configuración). Al guardar, esa foto se rehornea sola al toque.

**Importante — schema nuevo, aditivo, sin riesgo de pérdida de datos:**
`SiteSettings.loadingAnimation*` (5 campos), `Media.watermarkPositionOverride`,
`Media.watermarkOpacityOverride`, `Profile.instagram`, `Profile.linkedin`.

## Fase 9 — CV descargable, logo ajustable, un solo botón de optimizar,
## fix navbar admin

**CV descargable (nuevo).** Sección `/admin/cv` para cargar: nombre
completo, especialidad, bio, foto, aptitudes, experiencia laboral (con
fechas), y opcionalmente mail/teléfono/dirección/website — estos dos
últimos quedan vacíos y AFUERA del CV a menos que vos mismo los
completes. El botón "Descargar CV" (home, `/sobre-mi`, y nav si está
habilitado) genera un PDF al vuelo (`/api/cv-pdf`, mismo motor
`@react-pdf/renderer` que ya usás para el reel) que combina tu perfil +
experiencia cargada a mano + **todos los proyectos del portfolio con sus
fechas automáticamente** — no hace falta cargar las fechas de proyectos
dos veces.

**Logo ajustable con preview.** Nuevo control en Configuración: modo
"Incrustado en la home" (sin caja, más grande, item pedido) vs "Flotante"
(como estaba, fijo arriba-izquierda con su caja), tamaño en px separado
para desktop y celular con preview en vivo de los dos. En celular el
logo SIEMPRE es fijo arriba centrado y SIN caja (se le sacó el contorno
liquid glass), independiente del modo elegido para desktop.

**Un solo botón para optimizar + hornear watermark.** El botón
"Optimizar fotos ya subidas" ahora hace las dos cosas en una pasada:
achica el original a 2400px si venía más grande, Y vuelve a hornear la
versión pública de cada foto con el watermark actual ya IMPRESO adentro
(comprimida a WebP). Antes esto estaba separado en dos acciones
(`optimizeExistingPhotos` + un botón de "aplicar watermark" que ni
siquiera llegué a conectar a ninguna página) — se unificó en una sola.

**Fix: navbar de admin pegada a la barra de timecode.** Mismo problema
(y mismo arreglo) que ya se había hecho en la navbar pública.

**Importante — schema nuevo, sin riesgo de pérdida de datos** (todo
aditivo): modelos `Profile`, `Skill`, `WorkExperience`, y en
`SiteSettings`: `logoFloating`, `logoSize`, `logoSizeMobile`.

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
