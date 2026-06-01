# Estándar de Cambios Generales - Selectores de Menú

Este documento centraliza las mejoras y ajustes técnicos que deben aplicarse a todos los selectores de menú de las plantas (Monclova, Tijuana, Guadalajara, Juárez, etc.) para mantener la consistencia en los reportes y la experiencia de usuario.

---

## 1. Estándar de Reporte PDF (Oficial)
Todos los reportes PDF deben migrar al nuevo formato de aprobación formal:
- **Bloque de Firmas:** Los datos de validación (Nombre, Cargo, Empresa y Fecha) deben aparecer en la parte inferior del documento con una línea de firma de conformidad legible.
- **Identificador de Semana:** Incluir en el encabezado (esquina superior izquierda) la etiqueta `SEMANA X DE Y` para facilitar el archivo y control administrativo.
- **Contenido Dinámico:** El reporte debe incluir todas las categorías configuradas para la planta específica (ej. Desayunos 1-4, Guisado Fuerte, Antojitos, Guarniciones, Sopa/Ensalada, Postre y Bebida del Día).

## 2. Nomenclatura de Archivos Descargables
Para mejorar la organización de archivos en los equipos de los usuarios, el nombre del archivo PDF generado debe seguir el formato dinámico:
- **Formato:** `Menu_[NombrePlanta]_Semana_[DiaInicio]_al_[DiaFin]_[Mes].pdf`
- **Ejemplo:** `Menu_Guadalajara_Semana_02_al_06_Feb.pdf`
- *Nota: El nombre de la planta debe estar limpio de espacios y caracteres especiales.*

## 3. Robustez en el Procesamiento de Datos (Fechas)
Para evitar el error de "Fecha Inválida" en diferentes navegadores:
- Se debe implementar una limpieza de strings en el servicio de datos que reemplace las diagonales (`/`) por guiones (`-`) antes de procesar cualquier fecha proveniente de Google Sheets.
- Esto asegura que el constructor `new Date()` sea compatible tanto en Chrome como en Safari y navegadores móviles.

## 4. Control de Calendario por Operación
- El generador de fechas en la interfaz debe ajustarse individualmente a la jornada laboral de cada comedor.
- Si el comedor solo labora de Lunes a Viernes, el sistema no debe generar columnas vacías para el sábado, terminando el cálculo estrictamente en el día 5 (índice 4).

---
*Última actualización: 12 de Febrero de 2026*
