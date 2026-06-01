# Prompting Guides

Guía para estructurar "prompts" de inteligencia artificial al requerir modificaciones sobre este u otros proyectos similares de AntiGravity:

## 1. Ser Específico con el Scope y Condiciones
*   **Mal Prompt:** "Quita el botón de WhatsApp porque es mucha información."
*   **Buen Prompt:** "Oculta condicionalmente el botón 'Aprobar por WhatsApp' ubicado en `App.tsx` exclusivamente cuando la variable `plant.id` sea igual a 'juarez'. Las demás plantas deben seguir mostrándolo."
*   **¿Por qué?:** Da contexto táctico. La IA no deducirá si la eliminación es absoluta o relacional si no se especifica.

## 2. Inyección de Enlaces de Base de Datos
*   **Mal Prompt:** "Checa este link y dime si el CSV está correcto."
*   **Buen Prompt:** "Usa el comando de background sub-agent o `read_url_content` para analizar este CSV público crudo de Google Sheets: [ENLACE_PUB_OUTPUT_CSV]. Verifica si los delimitadores están alineados con la lógica `sheetFetcher.ts`."
*   **¿Por qué?:** Especificar la ruta de acceso programático facilita al agente el bypass de permisos de OAuth.

## 3. Feedback Visual Inmediato
*   **Mal Prompt:** "Cuando comparto la pantalla en el celular no sale el diseño."
*   **Buen Prompt:** "Requiero que modifiques las etiquetas `<meta og>` del archivo plano `index.html`. Usa el título 'Selector de Menú' e inyecta la ruta de `src/assets/logo_naranja.png` en el `og:image`. Crea un entorno compilado de producción para validarlo."
*   **¿Por qué?:** Ataca directamente el componente raíz. Si se enfoca el problema visual en la tecnología base, los agentes actúan sobre la solución raíz.
