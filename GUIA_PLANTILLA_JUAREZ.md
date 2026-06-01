7# Guía de Estructura: Plantilla de Menú Juárez

Este documento describe las reglas estrictas y el orden que debe seguir la plantilla de Google Sheets (Exportable a CSV) para la planta de **Juárez**, garantizando que la aplicación web pueda interpretar correctamente los menús divididos en 5 Barras y exportarlos exitosamente a WhatsApp y PDF.

## 1. Reglas Generales de la Estructura Horizontal (Las 5 Barras)

A diferencia de otras plantas que usan una lista vertical simple ("hacia abajo"), el comedor de Juárez tiene 5 barras simultáneas. Para que la aplicación pueda leer las 5 barras en una sola pestaña de Google Sheets, la tabla se divide "hacia la derecha" usando **Prefijos en los Encabezados.**

El sistema detecta y agrupa los platillos dependiendo del prefijo del encabezado de su columna:

1. **Barra Desayuno:** Todas las columnas que empiezan con `D_` (Ej: `D_Category`, `D_Lunes Nombre`).
2. **Barra Tradicional:** Todas las columnas que empiezan con `T_` (Ej: `T_Category`, `T_Lunes Nombre`).
3. **Barra SHOW:** Todas las columnas que empiezan con `S_` (Ej: `S_Category`, `S_Lunes Nombre`).
4. **Barra Variedad:** Todas las columnas que empiezan con `V_` (Ej: `V_Category`, `V_Lunes Nombre`).
5. **Barra Burritos:** Todas las columnas que empiezan con `B_` (Ej: `B_Category`, `B_Lunes Nombre`).

> **Importante:** Cualquier columna que no tenga uno de estos prefijos (a excepción de las columnas globales iniciales como `Category` o `Monday Date`) no será procesada como comida.

---

## 2. Los Encabezados (La Fila de Reconocimiento)

La aplicación web ahora es "inteligente" gracias a una reciente actualización: **Ignorará cualquier fila decorativa inicial** (como una fila combinada grande que diga "BARRA DESAYUNO", "BARRA TRADICIONAL", etc.). 

La verdadera lectura comienza en la primera fila donde el sistema detecta que están escritas las palabras clave de las columnas. Tus verdaderos **Encabezados** deben ser exactamente:

| Categorías Generales | Desayuno (`D_`) | Tradicional (`T_`) | SHOW (`S_`) | Variedad (`V_`) | Burritos (`B_`) |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `Category` | `D_Category` | `T_Category` | `S_Category` | `V_Category` | `B_Category` |
| `Monday Date` | `D_Monday Date` | `T_Monday Date` | `S_Monday Date` | `V_Monday Date` | `B_Monday Date` |
| `Lunes Nombre` | `D_Lunes Nombre` | `T_Lunes Nombre` | `S_Lunes Nombre` | `V_Lunes Nombre` | `B_Lunes Nombre` |
| ... opciones ... | `D_Martes Nombre` | `T_Martes Nombre` | ... etc ... | ... etc ... | ... etc ... |

**Regla de Oro:** **NUNCA** elimines las columnas `D_Category`, `B_Category`, `T_Category`, etc. Si las eliminas, el sistema no sabrá si la comida que tipeaste pertenece al plato principal o a una guarnición, y fallará.

---

## 3. Códigos de Categoría Permitidos (Qué escribir debajo de *X_Category*)

Debajo de las columnas que terminan en `_Category` (ej: `D_Category`, `B_Category`), no debes escribir texto al azar, sino las **claves internas** exactas que la aplicación web entiende para agrupar visualmente el PDF y la interfaz.

### Para la Barra Desayuno (`D_Category`):
- `desayuno_principal` -> (Se mostrará como "Plato Principal")
- `desayuno_opcion1` -> (Se mostrará como "Opción 1")
- `desayuno_opcion2` -> (Se mostrará como "Opción 2")
- `guarnicion_1` -> (Guarnición)
- `acompañamiento` -> (Acompañamiento)
- `bebida_desayuno` -> (Bebida)

### Para la Barra Tradicional (`T_Category`):
- `plato_fuerte`
- `antojito`
- `guarnicion_1`
- `guarnicion_2`
- `sopa`
- `postre`

### Para la Barra SHOW (`S_Category`):
- `show_principal`
- `guarnicion_1`
- `guarnicion_2`

### Para la Barra Variedad (`V_Category`):
- `variedad_tipo` -> (Mostrado como "Especialidad del Día")

### Para la Barra Burritos (`B_Category`) [ACTUALIZADO]:
**Debes utilizar 8 filas** e ingresar estas 8 opciones exactas para habilitar el selector múltiple:
- `burrito_1` 
- `burrito_2` 
- `burrito_3` 
- `burrito_4` 
- `burrito_5` 
- `burrito_6` 
- `burrito_7` 
- `burrito_8` 

*(Con esta actualización, ya no necesitas usar "burrito_principal" ni "guarnicion" en la barra de burritos, a menos que uses el modo Legacy)*.

---

## 4. Agrupación por Fechas y Semanas (`Monday Date`)

El sistema web puede cargar varios menús a la vez (Semana 1, Semana 2, Semana X) y separarlos mediante botones en la parte superior. 

Para que los agrupe correctamente, usa la columna global **`Monday Date`** (o los repetidores `D_Monday Date`, `B_Monday Date`).

**Regla:** Basta con que escribas la fecha de arranque de la semana **(Ejemplo: `2026-02-16`)** al inicio del bloque de esa semana (usualmente en la fila que dice "SEMANA 1").
Todos los platillos que estén por debajo de esa fecha heredan esa "etiqueta semanal" automáticamente hasta que el sistema detecte la fila que diga "SEMANA 2" con una nueva fecha (Ej: `2026-02-23`).

El formato de fecha sugerido es `YYYY-MM-DD` (Ej: `2026-02-16`).

---

## 5. El Switch Maestro (STATUS)

La primera fila de datos reales tras de los encabezados suele ser un Switch Maestro que sirve para "Cerrar" la aplicación, por ejemplo cuando ya pasó el tiempo de seleccionar el menú o es feriado.

```csv
Category, Monday Date, Lunes Nombre
config,   STATUS,      ON
```
- Si en "Lunes Nombre" pones **`ON`**, la aplicación permite entrar a ver la semana.
- Si pones **`OFF`**, la aplicación bloquea la pantalla en toda la planta Juárez con una alerta que dice "Acceso Cerrado".

---

## Tip de Llenado Diestro
Cuando planees la semana, imagina que la hoja electrónica tiene **5 Bloques Paralelos**. 
No intentes leerla toda de jalón; concéntrate trabajando solo de la A la O (Desayuno), luego muévete a la extrema derecha solo a trabajar la P a la AB (Tradicional), etc. La aplicación se encargará por sí sola de ensamblar todas estas columnas paralelas en los menús que salen en WhatsApp y PDF.
