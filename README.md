# Microsoft Copilot for VS Code

Extensión de VS Code para abrir Microsoft Copilot junto al editor y hacerle preguntas rápidas sin gastar peticiones de GitHub Copilot.

## Comandos

- `Open Microsoft Copilot`: abre Copilot según `copilotWeb.openMode`. Por defecto, en una ventana de aplicación de Microsoft Edge (sin pestañas ni barra de direcciones) para colocarla junto a VS Code. Si Edge no está instalado, usa el navegador predeterminado.
- `Open Microsoft Copilot in Browser`: abre Copilot en el navegador predeterminado.
- `Ask Microsoft Copilot About Selection`: copia el texto seleccionado al portapapeles con una frase inicial (`copilotWeb.selectionPrompt`), abre Copilot y solo tienes que pegar con `Ctrl+V`.
- `Ask Microsoft Copilot With Context Files`: abre un selector de archivos del workspace con el archivo activo y las pestañas abiertas ya marcados. Copia los elegidos como `ruta + contenido`, abre Copilot y solo tienes que pegar y escribir la pregunta. Funciona con cualquier lenguaje. Incluye los cambios sin guardar y omite carpetas, binarios y archivos de más de 1 MB.

## Dónde están

| Acceso | Acción |
| --- | --- |
| Command Palette | Todos los comandos |
| Clic derecho en el Explorer (archivos o carpetas) | `Ask Microsoft Copilot With Context Files`, con los archivos marcados en el Explorer ya preseleccionados en el selector |
| Clic derecho en el editor | `Ask Microsoft Copilot With Context Files`, y `Ask Microsoft Copilot About Selection` si hay texto seleccionado |
| `Ctrl+Alt+Shift+M` (`Cmd+Alt+Shift+M` en macOS) | Con selección en el editor pregunta sobre ella; si no, abre Copilot |
| Barra de estado, `M365 Copilot` | `Open Microsoft Copilot` |

## Ajustes

| Ajuste | Por defecto | Descripción |
| --- | --- | --- |
| `copilotWeb.openMode` | `appWindow` | `appWindow` (ventana de Edge) o `browser` (navegador predeterminado). |
| `copilotWeb.url` | `https://copilot.cloud.microsoft/` | Cuenta de trabajo, o `https://copilot.microsoft.com/` para cuenta personal. Solo ajustes de usuario. |
| `copilotWeb.edgeProfile` | vacío | Carpeta del perfil de Edge, por ejemplo `Profile 1` (ver `edge://version`). Solo ajustes de usuario. |
| `copilotWeb.showStatusBar` | `true` | Muestra u oculta el botón de la barra de estado. |
| `copilotWeb.selectionPrompt` | `Explain this {language} code:` | Frase antes del código seleccionado. `{language}` se sustituye por el lenguaje del editor. |
| `copilotWeb.contextPrompt` | `Use these files as context for my question:` | Frase antes de los archivos de contexto. |
| `copilotWeb.contextMaxChars` | `30000` | Pide confirmación si el contexto copiado supera este número de caracteres. |
| `copilotWeb.contextExclude` | `node_modules`, `.git`, `out`, `dist`, `.venv`, `.env`, claves, imágenes... | Patrones ocultos en el selector, además de `files.exclude` y `search.exclude`. Un patrón por entrada, sin grupos `{}`. |

`copilotWeb.url` y `copilotWeb.edgeProfile` solo se leen de los ajustes de usuario para que un repositorio no pueda redirigir la extensión a otra web. La URL además se limita a los dos sitios oficiales.

## Autenticación

La extensión no gestiona autenticación, OAuth, cookies ni tokens. Microsoft Copilot muestra su propio login cuando lo necesita y el usuario lo completa manualmente.

En ambas opciones el login lo hace Microsoft dentro de la propia ventana, sin depender de la cuenta de VS Code, y la sesión se conserva entre aperturas.

## Privacidad

Los comandos `Ask ...` envían a Microsoft Copilot el código seleccionado o los archivos elegidos cuando los pegas. El selector oculta por defecto `.env`, claves y certificados, pero los archivos que marques en el Explorer o tengas abiertos aparecen preseleccionados aunque estén excluidos; revisa la lista antes de pulsar Enter. Con una cuenta de trabajo en `copilot.cloud.microsoft` normalmente aplica la protección de datos empresarial, pero revisa la política de tu organización antes de pegar código.

## MCP

No se necesita `.vscode/mcp.json` ni `.mcp.json` para abrir Copilot Web. Esta primera versión no crea ni modifica configuraciones MCP.

## Desarrollo

```bash
npm install
npm run compile
npm test
```

Pulsa `F5` en VS Code para iniciar un Extension Development Host y prueba los comandos desde cualquiera de los accesos anteriores.

## Limitaciones

Microsoft Copilot no se puede mostrar dentro de una pestaña de VS Code: responde con `X-Frame-Options: SAMEORIGIN` y `frame-ancestors 'self'`, que impiden cargarlo en un iframe/WebView. Por eso la extensión lo abre en una ventana externa.
