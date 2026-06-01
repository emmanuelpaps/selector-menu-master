# Lessons Learnt

Lecciones clave aprendidas durante la integración del Selector de Menú Multi-Semana:

## 1. Manejo de Fechas en Estructuras "Flat" (CSV)
Los archivos provenientes de Google Sheets (descargados vía `/pub?output=csv`) a menudo usan "celdas combinadas" lógicamente, donde la primera fila tiene la fecha y las subsecuentes están vacías.
*   **Lección:** Es imperativo construir un "stateful parser" (como el uso de `lastSeenDates` en `sheetFetcher.ts`) que recuerde en memoria la última fecha válida vista en la columna superior para aplicarla a las filas inferiores vacías. Esto estabiliza los conectores de bases de datos no estructuradas.

## 2. Generación de Mock Data con Python
Al requerir inyecciones masivas de datos para pruebas (ej. 4 semanas de menú).
*   **Lección:** Modificar los datos celda por celda en Excel o Sheets es propenso a errores humanos. La creación de un script como `generator.py` que emplea la librería `datetime.timedelta(days=7)` para desplazar bucles algorítmicos ahorra decenas de horas de trabajo y garantiza integridad de datos para pruebas de carga.

## 3. Limitaciones de Transporte de Meta Etiquetas (Open Graph)
*   **Lección:** Para que aplicaciones como WhatsApp generen la validación "Rich Preview" (la tarjeta visual con foto, título y descripción), el motor de scrapeo de Facebook/WhatsApp no ejecuta JavaScript.
*   Recibir pre-visualizaciones requiere que las directivas `<meta property="og:..." />` estén quemadas de forma estática en el archivo `index.html` original de la carpeta `dist`. Depender de react-helmet o manipulaciones del DOM asíncronas causará que las vistas previas fallen.
