# Deploy en Railway — Odontologia MG

## Configuración rápida en Railway

### 1. Crear proyecto en Railway
1. Ve a [railway.app](https://railway.app)
2. Conecta tu repositorio GitHub: `tuusuario/odontologiamg`
3. Railway detectará automáticamente el Dockerfile

### 2. Variables de entorno en Railway
En el dashboard de Railway, agrega estas variables:

```
ANTHROPIC_API_KEY=tu_api_key_aqui
ENVIRONMENT=production
ALLOWED_ORIGINS=https://www.odontologiamg.ar/
DATABASE_URL=sqlite+aiosqlite:///./agentkit.db
PORT=8000
```

**Importante:** La API key debe tener permisos para usar Claude Sonnet 4.6

### 3. Deploy automático
- Railway detecta cambios en `main` automáticamente
- Toma ~2-3 minutos en buildear y deployar
- Verifica el estado en el dashboard

### 4. URLs de tu agente
Una vez deployado, obtendrás una URL tipo: `https://tuproyecto.railway.app/`

**Health check:** `https://tuproyecto.railway.app/health`

**API Docs:** `https://tuproyecto.railway.app/docs`

### 5. Integración en tu web
En tu página web, cambia la URL del widget:

```javascript
window.AgentKitConfig = {
  apiUrl: "https://tuproyecto.railway.app",
  title: "Odontologia MG",
  subtitle: "¿En qué te puedo ayudar?",
  primaryColor: "#1d4ed8"
};
```

## Endpoints disponibles

- `GET /health` — Health check
- `POST /chat` — Enviar mensaje y obtener respuesta
- `DELETE /chat/{session_id}` — Limpiar historial
- `POST /paciente` — Guardar datos de paciente
- `GET /paciente/{session_id}` — Obtener datos de paciente

## Logs en Railway
En el dashboard ve a "Logs" para ver errores y actividad en tiempo real.

## Troubleshooting

**Error de API Key:** Verifica que `ANTHROPIC_API_KEY` esté configurada en Railway
**CORS bloqueado:** Verifica que `ALLOWED_ORIGINS` incluye tu dominio
**Base de datos no se crea:** SQLite se crea automáticamente en el primer request
