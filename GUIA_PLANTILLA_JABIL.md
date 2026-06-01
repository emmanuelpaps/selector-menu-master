# Guía de Estructura: Plantilla de Menú Jabil CUU

Este documento describe las reglas estrictas y el orden que debe seguir la plantilla de Google Sheets (Exportable a CSV) para la planta de **Jabil (Chihuahua)**, garantizando que la aplicación web pueda interpretar correctamente los menús divididos en 3 Barras y exportarlos exitosamente a WhatsApp y PDF.

## 1. Reglas Generales de la Estructura Horizontal (Las 3 Barras)

El comedor de Jabil tiene 3 barras simultáneas. Para que la aplicación pueda leer las 3 barras en una sola pestaña de Google Sheets al mismo tiempo, la tabla se divide "hacia la derecha" usando **Prefijos en los Encabezados.**

El sistema detecta y agrupa los platillos dependiendo del prefijo del encabezado de su columna:

1. **Barra Tradicional:** Todas las columnas que empiezan con `T_` (Ej: `T_Category`, `T_Lunes Nombre`).
2. **Barra Grill:** Todas las columnas que empiezan con `G_` (Ej: `G_Category`, `G_Lunes Nombre`).
3. **Barra Light:** Todas las columnas que empiezan con `L_` (Ej: `L_Category`, `L_Lunes Nombre`).

> **Importante:** Cualquier columna que no tenga uno de estos prefijos (a excepción de las columnas globales iniciales como `Category` o `Monday Date`) no será procesada por la App como comida.

---

## 2. Los Encabezados (La Fila de Reconocimiento)

La aplicación web **ignora cualquier fila decorativa inicial** (como la fila combinada grande que pusimos que dice "BARRA TRADICIONAL", "BARRA GRILL", etc.). 

La verdadera lectura comienza en la fila de **Encabezados**, los cuales deben ser exactamente:

| Columnas Generales | Tradicional (`T_`) | Grill (`G_`) | Light (`L_`) |
| :--- | :--- | :--- | :--- |
| `Category` | `T_Category` | `G_Category` | `L_Category` |
| `Monday Date` | `T_Monday Date` | `G_Monday Date` | `L_Monday Date` |
| `Lunes Nombre` | `T_Lunes Nombre` | `G_Lunes Nombre` | `L_Lunes Nombre` |
| ... opciones ... | `T_Martes Nombre` | `G_Martes Nombre` | `L_Martes Nombre` |
| Hasta el ... | `T_Domingo Nombre` | `G_Domingo Nombre` | `L_Domingo Nombre` |

**Regla de Oro:** **NUNCA** elimines las columnas `T_Category`, `G_Category`, `L_Category`, etc. Si las eliminas o les cambias el sufijo, el sistema fallará.

---

## 3. Códigos de Categoría Permitidos (Qué escribir debajo de *X_Category*)

Debajo de las columnas que terminan en `_Category` (ej: `T_Category`, `L_Category`), no debes escribir texto al azar ni nombres inventados, sino las **claves internas** exactas que la aplicación web entiende para agrupar visualmente el menú.

### Para la Barra Tradicional (`T_Category`):
- `tradicional_desayuno` -> (Desayuno & Merienda)
- `tradicional_frutas` -> (Barra de Frutas y Pan)
- `tradicional_bebidas` -> (Bebidas)
- `tradicional_plato` -> (Plato Fuerte)
- `tradicional_guarnicion_1` -> (Guarnición)
- `tradicional_guarnicion_2` -> (Guarnición)
- `tradicional_ensalada` -> (Ensalada)
- `tradicional_sopa` -> (Sopa)
- `tradicional_postre` -> (Postre)
- `tradicional_salsas` -> (Salsas)

### Para la Barra Grill (`G_Category`):
- `grill_plato_1` -> (Plato Fuerte 1)
- `grill_plato_2` -> (Plato Fuerte 2)
- `grill_guarnicion` -> (Guarnición)
- `grill_guarnicion` -> (Guarnición / Ensalada)

### Para la Barra Light (`L_Category`):
Debes utilizar 8 filas e ingresar estas opciones para que empaten exacto con la imagen oficial:
- `light_proteina` -> (Proteína)
- `light_guarnicion` -> (Guarnición)
- `light_caldo` -> (Caldo)
- `light_ensalada` -> (Ensalada)
- `light_topping` -> (Topping 5)
- `light_semilla` -> (Semilla)
- `light_postre` -> (Postre)
- `light_complemento` -> (Complemento)

---

## 4. Agrupación por Fechas y Semanas (`Monday Date`)

El sistema puede cargar varios menús a la vez (Semana 1, Semana 2, Semana X) y separarlos mediante botones desplegables semanales en la interfaz. 

Para que los agrupe correctamente, usa la columna global **`Monday Date`** y/o los repetidores `T_Monday Date`, `G_Monday Date`, `L_Monday Date`.

**Regla:** Basta con que escribas la fecha de arranque de la semana **(Ejemplo: `2026-03-23`)** al inicio del bloque de esa semana (usualmente en la fila que dice "SEMANA 1"). Todos los platillos que estén debajo de esa fecha pertenecen a ese menú, hasta que el sistema encuentre una nueva fecha (Ej: `2026-03-30`) marcando una semana distinta.

El formato de fecha sugerido estrictamente es `YYYY-MM-DD`.

---

## 5. El Switch Maestro (STATUS)

La primera fila después de los encabezados suele ser un Switch Maestro que sirve para "Cerrar" la aplicación, por ejemplo cuando ya finalizó la captura semanal.

```csv
Category, Monday Date, Lunes Nombre
config,   STATUS,      ON
```
- Si en "Lunes Nombre" pones **`ON`**, la aplicación arranca de forma regular.
- Si pones **`OFF`**, la aplicación bloquea la pantalla a una alerta que dice "Acceso Cerrado".

---

## Tip de Llenado
Al igual que en Juárez, tu Google Sheets Jabil es una **pista de carreras de 3 carriles paralelos**. No lo intentes leer todo hacia abajo. Concéntrate trabajando por barras verticales: primero de la A a la O (Tradicional), después te pasas a las columnas de en medio (Grill), y finalmente las de la derecha (Light). El código unirá las tres piezas como magia.
