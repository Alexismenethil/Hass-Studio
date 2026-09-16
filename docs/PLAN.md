# HASS Studio — plan de trabajo

## Dirección aprobada
Alexis Huamani Rivera. Estudio de diseño y desarrollo de webs, sistemas internos y aplicaciones móviles. Inglés principal con español accesible desde todas las páginas. Estética editorial clara, cálida y cinematográfica, con naturaleza. El diseño es la prioridad; no hay una fecha límite. Trabajo sin subagentes.

## Fases
1. Dirección de arte: marfil, carbón y oliva; tipografía editorial, imágenes originales y composiciones de proyectos. Wordmark provisional reemplazable por logo. Foto personal opcional.
2. Experiencia pública: home inmersiva, carrusel de categorías, work, casos de estudio, studio, contacto y links; responsive y movimiento reducido.
3. Contenido: datos personales, textos bilingües, imágenes, categorías, redes y proyectos editables en administración. Vídeos y enlaces opcionales. Contenido inicial se usa solo hasta conectar la base de datos; los conceptos se identifican como tales.
4. Administración: Supabase Auth, autorización en servidor y RLS. Clientes, proyectos, hitos, actualizaciones persistentes, previsualización de email, confirmación y reintentos. Portfolio separado de información privada.
5. Calidad: build, tipado, pruebas de validación/autorización y envío; inspección visual desktop/móvil, teclado, reduced motion y rendimiento.
6. Activación: migraciones, configuración segura de Supabase/Resend, variables de Vercel y dominio cuando se elija. Ninguna compra automática. Vercel Hobby limita uso comercial; seleccionar hosting adecuado al lanzamiento.

## Implementación
Next.js App Router + TypeScript, pnpm/Turborepo, CSS Modules/CSS, GSAP/ScrollTrigger solo público, con scroll nativo. Supabase PostgreSQL/Auth/Storage. Resend + React Email. Contenido bilingüe estructurado, con endpoints públicos que solo leen publicaciones y ajustes públicos.

## Dependencias externas pendientes
URL y clave publicable de Supabase, usuario administrador creado en Supabase, migraciones aplicadas; proveedor/remitente de correo verificado; dominio y contacto públicos. No se almacenan secretos en git ni se solicitan por chat.

## Criterio de entrega
Experiencia local real y navegable, editor conectado a persistencia cuando se configure Supabase, esquema/migraciones/documentación entregados, estados vacíos honestos y sin enlaces de contacto inventados. No se publican métricas, testimonios ni trabajos ficticios como reales.

## Refinamiento final
Paleta original marfil/oliva recuperada. Laptops únicamente en el detalle de proyecto, con fotografía frontal fina, pantalla HTML/vídeo y cambio manual de vistas. Inicio con composiciones libres. Recorrido de categorías más corto, sin tiempos muertos, scroll nativo y menor retardo de seguimiento.
