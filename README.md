# Odontologia MG — Agente Web

Chat asistente basado en Claude para gestión de turnos, recetas y consultas odontológicas.

## Inicio rápido

### 1. Clonar y configurar localmente

```bash
# Copiar el proyecto (ya hecho)
cd odontologiamg

# Instalar dependencias
pip install -r requirements.txt

# Copiar .env.example a .env y completar ANTHROPIC_API_KEY
cp .env.example .env
# Editar .env con tu API key de Anthropic
```

### 2. Ejecutar localmente

```bash
# Iniciar servidor de desarrollo
uvicorn agent.main:app --reload --port 8000

# Visitar http://localhost:8000/docs para probar endpoints
```

### 3. Crear repositorio en GitHub

```bash
# En la raíz del proyecto (ya inicializado con git)
git remote add origin https://github.com/tuusuario/odontologiamg.git
git branch -M main
git push -u origin main
```

### 4. Configurar en Railway

1. Ve a [railway.app](https://railway.app) y crea una nueva cuenta si no tienes
2. Haz clic en "New Project" → "Deploy from GitHub"
3. Autoriza Railway a acceder a tu GitHub
4. Selecciona el repositorio `odontologiamg`
5. Railway detectará el Dockerfile automáticamente

#### Variables de entorno en Railway Dashboard

En el panel de Railway, ve a **Variables** y agrega:

```
ANTHROPIC_API_KEY=tu_api_key_de_anthropic
ENVIRONMENT=production
ALLOWED_ORIGINS=https://www.odontologiamg.ar/
```

6. Haz clic en "Deploy" y espera 2-3 minutos

### 5. Obtener la URL de tu agente

Una vez deployado, Railway te asignará una URL como:
```
https://odontologiamg-production.up.railway.app
```

Úsala para configurar el widget.

## Integración en tu sitio web

En tu página HTML, agrega antes de `</body>`:

```html
<script>
  window.AgentKitConfig = {
    apiUrl: "https://tu-railway-url.up.railway.app",
    title: "Odontologia MG",
    subtitle: "¿En qué te puedo ayudar?",
    primaryColor: "#1d4ed8"
  };
</script>
<script src="https://tu-railway-url.up.railway.app/widget/widget.js"></script>
```

## Estructura del proyecto

- `agent/` — Backend FastAPI
  - `main.py` — Servidor y endpoints
  - `brain.py` — Integración con Claude API
  - `memory.py` — Base de datos de conversaciones
  - `turnos.py` — Cliente del sistema de turnos
  - `tools.py` — Herramientas auxiliares

- `config/` — Configuración
  - `prompts.yaml` — System prompt del agente
  - `business.yaml` — Datos del negocio

- `widget/` — Frontend embebible
  - `widget.js` — Chat widget JavaScript

- `knowledge/` — Base de conocimiento
  - `base de conocimiento.txt` — Info del centro

## Personalización

### Cambiar el nombre del centro
Edita `config/prompts.yaml` y `config/business.yaml` con tu información.

### Cambiar el avatar del widget
En `widget/widget.js`, línea ~296: cambiar `🦷` por otro emoji.

### Cambiar médicos/especialidades
1. Actualiza `config/prompts.yaml` (tabla de médicos)
2. Actualiza `agent/turnos.py` (dict MEDICOS)
3. Actualiza el prompt del sistema con los horarios correspondientes

## Deployment

Ver `DEPLOY_RAILWAY.md` para detalles completos.

## Debugging

### Ver logs locales
```bash
uvicorn agent.main:app --reload --log-level debug
```

### Ver logs en Railway
Ve al dashboard → **Logs** tab

### Probar API localmente
```bash
curl -X POST http://localhost:8000/chat \
  -H "Content-Type: application/json" \
  -d '{"session_id":"test-123","message":"Hola"}'
```

## Documentación técnica

Ver `CLAUDE.md` para arquitectura y patrones de código.
