# Instructions

Instrucciones técnicas esenciales y rutinas de operación:

## Compilación y Despliegue para Hostinger

1.  **Construir variables del sitio:** Ejecutar en el servidor local el comando de Vite mapeado a la variable de planta.
    ```bash
    npm run build -- --mode juarez
    ```
    *(Reemplazar `juarez` con `monclova`, `tijuana`, etc).*
2.  **Empaquetar:** Comprimir el folder de salida resultante (`dist`).
    ```bash
    zip -r juarez_dist_update.zip dist/
    ```
3.  **Desplegar:**
    *   Subir el archivo `.zip` al hPanel de Hostinger (Carpeta `public_html`).
    *   Extraer en el servidor web.
    *   Mover los compendiados del directorio `/dist` al nivel raíz y borrar el ZIP.

## Inyección de Datos Masivos desde Backend Python

Para generar rápidamente escenarios semanales de prueba en las sábanas de cálculo:
1.  Modificar los valores semilla del formato Base 0 en el script local.
2.  Ejecutar el script de auto-offset:
    ```bash
    python3 generator.py
    ```
3.  Tomar el recurso `plantilla_final_juarez.csv`.
4.  Subir e Importar como Reemplazo Total a la Google Sheet maestra.

## Manipulación del Open Graph (Favicons y Meta Tags)
Las imágenes isologotipo de la barra superior son independientes del Favicon.
Si se cambia el branding de una planta, asegúrese de:
1. Reemplazar `logo_naranja.png` o equivalente en `src/assets/`.
2. Modificar la cabecera obligatoria de `index.html` para enlazar hacia Whatsapp y Messenger.
