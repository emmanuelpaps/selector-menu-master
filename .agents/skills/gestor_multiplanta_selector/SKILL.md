---
name: gestor_multiplanta_selector
description: Instrucciones y contexto clave operativo para el ecosistema "Selector de Menú - MASTER". Contiene reglas estrictas sobre el manejo de las 4 plantas (Juárez, Monclova, Tijuana, Guadalajara).
---

# Contexto Tecnológico Base
Esta aplicación es una Single-Page Application (SPA) en React/Vite. Existe una **única base de código**, y de ella se construyen 4 "aplicaciones" distintas (una para cada Ciudad/Planta).
- Nunca asumas que un cambio visual o lógico aplica para todas. Siempre envuelve lógica condicional basándote en la variable `plant.id` (importada usualmente vía Contexto/Hooks globales).
- El diccionario maestro de reglas de plantas se encuentra en `src/config/plants.ts`.

# Procedimiento de Compilación (Deploy)
Jamás utilices un `npm run build` básico. Siempre debe ir apuntado a un ambiente específico:
1. `npm run dev -- --mode [planta]` (Para pruebas locales).
2. `npm run build -- --mode [planta]` (Para Producción).
3. Para Hostinger: Empaquetar la salida `dist` en un `.zip` y extraer su contenido directamente en la carpeta destino (`public_html` u homóloga).

# Reglas Específicas por Planta (¡Crítico!)

## 1. Planta Juárez (`juarez`)
- **Tiempo:** Modulada para parsear y desplegar **4 Semanas Consecutivas** a la vez, utilizando la navegación tabular superior.
- **Exportación WhatsApp:** El componente de "Aprobar por WhatsApp" debe **permanecer oculto** (`App.tsx`). Mandar las 4 barras con las 4 semanas a la API de WhatsApp Web revienta el Payload URI de los navegadores.
- **Renderizado PDF:** Juárez no utiliza el color "Ave" institucional estándar. Las celdas del PDF (vía `jspdf-autotable` en `pdfService.ts`) deben pintarse extrayendo y convirtiendo los códigos hexadecimales mapeados en el objeto `JUAREZ_BARS`.

## 2. Planta Monclova (`monclova`)
- **Exportación WhatsApp:** Activa y altamente requerida. Genera resúmenes compactos semanales.
- **Estructura CSV:** ¡Única planta en tener operación diurna y nocturna los viernes! Monclova expone una columna extra obligatoria llamada **"Viernes 3er Turno"**. Al manipular los parsers (`sheetFetcher.ts`) hay que asegurarse de extraer `friday3` y mapearlo correctamente sin romper las otras 3 plantas.

## 3. Planta Tijuana (`tijuana`)
- **Formatos de Fecha Fronterizos:** Por su ubicación geográfica, los orígenes de datos suelen empujar fechas en formato anglosajón `MM/DD/YYYY` (ej. `02/09/2026` significando 9 de Febrero en vez del 2 de Septiembre). El motor en `dateUtils.ts` contiene heurísticas específicas para Tijuana que resuelven esta ambigüedad previendo desfazamientos de calendario.
- **Desayunos Extendidos:** Admite hasta 5 elementos en la fila de desayuno del CSV. Si el 5to elemento se escanea (ej. "Café/Avena") y el CSV no traía explícitamente la categoría `bebida_caliente`, el parser (`sheetFetcher.ts`) captura este 5to elemento de la celda de desayuno y lo promueve autómaticamente a la categoría de Bebida Caliente.
- **Categorías Estructurales Base:** A diferencia del estándar, la columna "Category" en el CSV de Tijuana espera mapear específicamente contra este string array: `['desayuno_1', 'desayuno_2', 'desayuno_3', 'desayuno_4', 'bebida_caliente', 'barra_de_frutas', 'platillo_especial', 'plato_fuerte', 'plato_fuerte_2', 'antojito', 'guarnicion_1', 'guarnicion_2', 'barra_de_ensaladas', 'sopa_ensalada', 'postre', 'bebida']`. Nótese la existencia de `plato_fuerte_2`, `antojito` y `bebida` como llaves únicas de esta planta.

## 4. Planta Guadalajara (`guadalajara`)
- **Nomenclatura Única (Guisado Fuerte):** Los usuarios de Guadalajara escriben `main` o `plato_fuerte` en el CSV, pero por reglas de negocio locales, el parser (`sheetFetcher.ts`) intercepta y re-bautiza programáticamente este valor a `guisado_fuerte`.
- **Desayunos Extendidos:** Comparte con Tijuana la heurística de los desayunos de 5 elementos. Si se escanea un 5to item, se auto-promueve a `bebida_caliente`.
- **Categorías Estructurales Base:** El array interno para identificar renglones en la ingesta es específico para esta planta: `['desayuno_1', 'desayuno_2', 'desayuno_3', 'desayuno_4', 'guisado_fuerte', 'antojito', 'guarnicion_1', 'guarnicion_2', 'sopa_ensalada', 'postre', 'bebida']`. Nótese estructuralmente que Guadalajara carece de `bebida_caliente` y `barra_de_ensaladas` en su definición base, pero comparte la llave `antojito` y `bebida` con Tijuana.
- **Aspectos Visuales:** Emplea el esquema clásico de color institucional y el botón de WhatsApp se mantiene absolutamente visible.

# Manejo de Mock Data Falsa (Testing)
La base de datos se alimenta exclusivamente como texto plano vía "Google Sheets CSV Export url".
Si necesitas fabricar volúmenes masivos de registros para pruebas (ej. para Juárez):
1. Manipula el archivo `generator.py` ubicado en la raíz del proyecto.
2. Este script usa offsets aditivos de `timedelta` (+7 días) para clonar esquemas y empujar variables.
3. El output recaerá en el CSV local que deberás copiar a Google Sheets oficial o servir localmente.

# Manipulaciones DOM (Open Graph / SEO)
- Al compilar, todos interactúan sobre un solo `index.html`.
- Si reestructuraste logotipos, actualiza dinámicamente o de forma plana (según te lo exija WhatsApp View) los tags `og:image`, `og:title` y `og:description` antes de tirar tu `npm run build`.
