# BEATSTORE

Plataforma web para catálogos de instrumentales de productores independientes. Kido Beats es el primer caso piloto.

## Estado actual

- Prototipo web estático.
- Diseño responsive para escritorio y móvil.
- Catálogo de ejemplo con búsqueda y filtros.
- Interfaz de reproductor persistente.
- Enlaces de consulta por Instagram.
- Sin backend ni servicios pagos en esta primera etapa.

## Ejecutar localmente

Abrí `index.html` en un navegador. Para probar reproducción, configurá `audioUrl` en el objeto `CONFIG` dentro de `index.html` con una URL de audio accesible y compatible con reproducción web.

## Próximas etapas

1. Confirmar la identidad de Kido y su usuario exacto de Instagram.
2. Diseñar la sincronización de Google Drive.
3. Resolver las preescuchas con una fuente de audio estable; Drive no siempre se comporta como un servidor de streaming.
4. Implementar conexión de Drive por OAuth o carpeta compartida con permisos mínimos.
5. Añadir el modelo multi-productor y configuración por tienda.
6. Evaluar pagos online opcionales.

## Seguridad y privacidad

- No guardar claves ni tokens en el código del frontend.
- No publicar enlaces de archivos originales destinados a la venta.
- Cada productor debe acceder únicamente a su propia carpeta y catálogo.
- Verificar permisos, cuotas y condiciones de los servicios gratuitos antes de activar la sincronización automática.

## Coste

El objetivo del prototipo es $0 usando herramientas y planes gratuitos. La disponibilidad y los límites de servicios externos pueden cambiar.
