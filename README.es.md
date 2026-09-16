<!-- LANG-NAV -->
[English](README.md) · [Português](README.pt.md) · **Español** · [Deutsch](README.de.md) · [Français](README.fr.md) · [Italiano](README.it.md)

# 🪙 Trevi

> Un gestor de listas de deseos para Obsidian. Lanza una moneda a la fuente y pide un deseo: cada deseo es un elemento guardado en tu propia bóveda. Sin funciones sociales, sin IA: local, portable y elegante.

Trevi convierte tu bóveda en una colección personal de listas de deseos. Crea listas con nombre, añade elementos con foto, precio y enlace, mantén un historial de precios y visualízalo todo en un panel SVG ligero, con todo almacenado en archivos sencillos que te pertenecen por completo y que se sincronizan sin esfuerzo entre dispositivos, móvil incluido.

## Características

- **Piazza** — una pantalla de inicio con cada lista como una tarjeta (portada, número de elementos, valor total).
- **Listas y elementos** — CRUD completo, búsqueda de texto, filtros (estado, prioridad, etiqueta) y ordenación (precio, prioridad, fecha, título). Toca un elemento para abrirlo.
- **«Lanza una moneda»** — el flujo para añadir elementos, con **captura de metadatos desde una URL** (Open Graph + JSON-LD, obtenidos mediante el `requestUrl` de Obsidian, de modo que funciona en móvil y sortea el CORS), y entrada manual como alternativa.
- **Imágenes** — almacenadas en una carpeta plana, nombradas por UUID y referenciadas solo por UUID en el archivo de datos. Añádelas desde tu dispositivo o descárgalas desde una URL.
- **Precios** — actualizaciones solo manuales (por elemento o todos a la vez). Cada cambio se añade a un historial de precios que alimenta los minigráficos de tendencia.
- **Estadísticas** — totales por moneda, recuentos por estado/prioridad/etiqueta y tendencias de precios. Acota el panel a todas las listas o a una sola.
- **Portada de lista** — establece la portada de una lista a partir de una imagen del dispositivo o de la foto de cualquier elemento.
- **Mover · Duplicar · Marcar como comprado · Abrir enlace · Exportar** — a un toque de distancia desde cada elemento o desde el menú de una lista.
- **Exportar a Markdown** — convierte cualquier lista en una nota con una tabla de sus elementos.
- **Papelera** — eliminación segura y recuperable con un periodo de retención configurable; restaura o purga; las imágenes huérfanas se limpian solo cuando lo pides.
- **Paleta** — la serena paleta «Trevi» más los preajustes (Travertino, Acquamarina, Notturno) y ajustes por color. El color se aplica solo a los datos; todo lo demás hereda tu tema, en claro y oscuro.
- **Copias de seguridad y recuperación** — escrituras atómicas, un `.bak`, instantáneas diarias rotativas, recuperación automática desde la copia legible más reciente y un modo seguro de solo lectura que nunca sobrescribe datos ilegibles.
- **Internacionalización** — English, Português, Español, Deutsch, Français, Italiano.
- **Accesible y mobile-first** — navegable con teclado, adaptable al tema y responsive hasta el ancho de un móvil.

## Capturas de pantalla

<p align="center">
  <img src="docs/en-piazza.png" width="24%" alt="Piazza">
  <img src="docs/en-list.png" width="24%" alt="List view">
  <img src="docs/en-stats.png" width="24%" alt="Statistics">
  <img src="docs/en-modal.png" width="24%" alt="Item editor">
</p>

## Primeros pasos

**Instalación manual**

1. Copia `main.js`, `manifest.json` y `styles.css` en `<your vault>/.obsidian/plugins/trevi/`.
2. En Obsidian: Ajustes → Complementos de la comunidad → activa **Trevi**.

**BRAT (beta)**

Añade el repositorio en el complemento BRAT para recibir actualizaciones sin copiarlo manualmente.

**Complementos de la comunidad**

Una vez listado, instálalo desde Ajustes → Complementos de la comunidad → Explorar.

## Uso

1. Abre **Trevi** desde la barra lateral (el icono de la fuente) o la paleta de comandos (`Trevi: Open Piazza`).
2. Crea una lista y luego **Lanza una moneda** para añadir un elemento: pega la URL de un producto y pulsa **Obtener**, o rellénalo a mano.
3. Toca un elemento para editarlo; usa el menú **⋯** de un elemento para abrir su enlace, actualizar su precio, moverlo, duplicarlo, establecerlo como portada de la lista o eliminarlo.
4. Usa el menú **⋯** de la lista para establecer una portada, renombrar, exportar a Markdown o eliminar.
5. Abre **Estadísticas** para ver totales y tendencias de precios.

## Datos, almacenamiento y privacidad

- **Única fuente de verdad**: un archivo JSON en tu bóveda (por defecto `core/trevi/trevi.json`), escrito de forma atómica.
- **Imágenes**: una carpeta plana (por defecto `core/trevi/assets`), un archivo por UUID.
- **Sin red salvo por acción tuya**: las únicas peticiones son las obtenciones de metadatos/precios/imágenes que tú inicias, todas a través de `requestUrl`. Sin telemetría, sin tareas en segundo plano, sin cuentas.
- **Sin IA, sin funciones sociales** — sin recomendaciones, sin compartir, sin reservas ni regalos.
- Ambas rutas se pueden configurar en los Ajustes; cambiarlas migra de forma segura tus datos existentes.

## Copias de seguridad y recuperación

- Cada guardado conserva un `.bak` y, una vez al día, una instantánea fechada rotativa (se conservan las cinco más recientes).
- Al iniciarse, Trevi carga el archivo legible más reciente, probando `trevi.json` → `.bak` → instantáneas diarias.
- Si todo resulta ilegible, Trevi entra en un **modo seguro de solo lectura** y nunca sobrescribe tus archivos, para que puedas recuperarlos a mano.
- Si detecta archivos de conflicto de sincronización en la carpeta de datos, te avisa.

## Ajustes

| Ajuste | Qué hace |
|---|---|
| Archivo de datos | Ruta del JSON en tu bóveda (mueve los datos existentes al cambiarla). |
| Carpeta de imágenes | Dónde se almacenan las imágenes, por UUID (mueve las imágenes existentes al cambiarla). |
| Moneda por defecto | Código ISO 4217 usado para los nuevos elementos. |
| Idioma | Idioma de la interfaz (6 admitidos). |
| Retención de la papelera (días) | Cuánto tiempo permanecen recuperables los elementos eliminados. |
| Registrar precio inicial | Guarda la primera entrada de precio al crear un elemento, para que las tendencias tengan datos. |
| Paleta | Preajuste + ajuste por color para los colores de los gráficos. |
| Limpiar imágenes huérfanas | Elimina las imágenes sin referencia, solo cuando lo pides. |

## Compatibilidad

- **Escritorio y móvil.** `isDesktopOnly` es `false`; el complemento no usa módulos de Node y toda la red pasa por `requestUrl`.
- Los gráficos son SVG dibujados a mano que heredan las variables de tu tema y funcionan en claro y oscuro.

## Desarrollo

Trevi se distribuye como un único `main.js` escrito a mano (más `manifest.json` y `styles.css`), sin necesidad de paso de compilación. La especificación funcional se encuentra en `trevi-spec.md`.

## Objetivos excluidos

- Sin funciones sociales (compartir, reservas de regalos, amigo invisible, regalos en dinero).
- Sin IA (recomendaciones, descubrimiento, generación de contenido).
- Sin procesos en segundo plano: nada se ejecuta mientras Obsidian está cerrado.

## Licencia

[MIT](LICENSE) © Fagner Candido
