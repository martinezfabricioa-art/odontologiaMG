# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**Odontologia MG** — AI-powered chatbot for medical appointment management. The agent handles turn booking, cancellations, consultations, and recipe requests for a dental clinic.

Stack: FastAPI (backend) + JavaScript widget (frontend) + Claude API (AI) + SQLAlchemy ORM + agenteWeb007.php (external turnos API)

## Architecture

### Backend (Python/FastAPI)
- **agent/main.py** — FastAPI server. Endpoints: `/chat`, `/paciente/*`, `/turnos/*`
- **agent/brain.py** — Claude API integration. Loads system prompt from `config/prompts.yaml`, handles async message generation
- **agent/memory.py** — SQLAlchemy ORM. Two tables: `Mensaje` (chat history), `Paciente` (patient data). Supports SQLite (dev) or PostgreSQL (prod via `DATABASE_URL` env var)
- **agent/turnos.py** — HTTP client for external turnos API (`http://odontologiamg.ar/assets/agenteWeb007.php`). Functions: buscar turnos (func 1), ver mis turnos (func 2), reservar (func 3), cancelar (func 4)
- **agent/tools.py** — (currently unused, can be extended for agent tools)

### Frontend (JavaScript widget)
- **widget/widget.js** — Embeddable chat widget (~350 lines). Key features:
  - Detects markers in assistant messages: `[BUSCAR_TURNOS_WIDGET:X]`, `[VER_MIS_TURNOS_WIDGET]`
  - Auto-fetches turnos from backend, renders HTML with event handlers
  - Extracts patient DNI from chat history regex (`\d{7,8}`)
  - Handles button clicks: `.btn-cancelar`, `.btn-reservar` (events delegated)
  - Session management: `localStorage` for `agentkit_session_id`

### Configuration
- **config/prompts.yaml** — System prompt for Claude. Defines agent identity, clinic info, doctor restrictions, turnos workflow (markers for auto-fetch), fallback messages
- **config/business.yaml** — Business metadata (name, location, hours). Not actively used in code but kept for reference
- **knowledge/base de conocimiento.txt** — Knowledge base for RAG context (doctors, specialties, procedures). Currently not injected into prompts but available for future use

## Key Workflows

### Turn Booking Workflow
1. User: "Quiero un turno"
2. Agent: Collects patient data (name, surname, DNI, obra social)
3. Agent: Asks doctor preference (Romero=3, Saieg=4, Manzano=5)
4. Agent: Responds with `[BUSCAR_TURNOS_WIDGET:3]`
5. Widget: Auto-fetches `/turnos/buscar-html/3`, renders HTML with `btn-reservar` buttons
6. User: Clicks "Reservar Turno"
7. Widget: Auto-reserves via `/turnos/reservar` (POST DNI + idTurno)

### Check My Turnos Workflow
1. User: "¿Cuándo es mi turno?" or "Quiero cancelar"
2. Agent: Responds with `[VER_MIS_TURNOS_WIDGET]`
3. Widget: Auto-fetches `/turnos/mis-turnos?dni={DNI}`, renders turnos list with cancel buttons
4. User: Clicks "Cancelar Turno"
5. Widget: Auto-cancels via `/turnos/cancelar` (POST idTurno)

## Development Commands

```bash
# Install dependencies
pip install -r requirements.txt

# Run local server (auto-reload on changes)
uvicorn agent.main:app --reload --port 8000

# Run with debug logging
uvicorn agent.main:app --reload --port 8000 --log-level debug

# Run tests
pytest tests/test_local.py

# Run a specific test
pytest tests/test_local.py::test_name -v

# Run tests with coverage
pytest tests/test_local.py --cov=agent

# Check API docs (when server running)
# Visit http://localhost:8000/docs

# Reset local SQLite database
rm agentkit.db
# (Recreates on next server start)

# Inspect database (if sqlite3 installed)
sqlite3 agentkit.db ".tables"
sqlite3 agentkit.db "SELECT * FROM mensaje LIMIT 5;"
```

## Environment Variables

```
ANTHROPIC_API_KEY=sk-ant-...           # Required for Claude API (Sonnet 4.6+)
PORT=8000                              # Server port (Railway overrides dynamically)
ENVIRONMENT=development|production     # Controls logging level
DATABASE_URL=sqlite+aiosqlite:///./agentkit.db  # SQLite for dev, PostgreSQL for prod
ALLOWED_ORIGINS=*                      # CORS whitelist (*, or comma-separated URLs)
```

### Local Setup (.env file)
1. Copy `.env.example` to `.env`
2. Add your `ANTHROPIC_API_KEY`
3. Server auto-loads from `.env` on startup (via python-dotenv)

### Production (Railway)
Use Dashboard → Variables:
- `ANTHROPIC_API_KEY` — Your Anthropic API key
- `ENVIRONMENT=production`
- `ALLOWED_ORIGINS=https://www.odontologiamg.ar/` (or comma-separated list)
- `DATABASE_URL` — Leave empty to use Railway's default PostgreSQL

### Database Backends
- **Development:** SQLite (`DATABASE_URL=sqlite+aiosqlite:///./agentkit.db`) — no setup needed
- **Production:** PostgreSQL — Railway provisions automatically when using default DATABASE_URL

## Common Tasks

### Add a new doctor
1. Update `config/prompts.yaml` (doctor table in system_prompt + ID mapping)
2. Update `agent/turnos.py` (MEDICOS dict)
3. Update `knowledge/base de conocimiento.txt` (for context)
4. Update system prompt markers: `[BUSCAR_TURNOS_WIDGET:X]` uses the new ID

### Change system prompt or business info
- Edit `config/prompts.yaml` → Auto-reloads on next request (no restart needed)
- System prompt is loaded fresh on every `/chat` call via `cargar_system_prompt()` in brain.py

### Debug turnos API failures
- Check Railway logs: `tail /var/log/... error.log` or via Dashboard → Logs
- Test agenteWeb007.php directly: `curl -X POST http://odontologiamg.ar/assets/agenteWeb007.php -d "funcion=1&idProfesional=3"`
- If 500 error: check agenteWeb007.php DB connection, enable `error_reporting(E_ALL)` in PHP

### Deploy to Railway
- Push to `main` branch → Railway auto-detects and builds (Dockerfile auto-detected)
- Monitor in Dashboard → Deployments
- Check health: `https://<railway-url>/health` → `{"status":"ok","service":"..."}`

## Code Patterns & Conventions

- **System prompt markers:** `[BUSCAR_TURNOS_WIDGET:X]` and `[VER_MIS_TURNOS_WIDGET]` are special strings the widget detects. Agent should output them exactly, widget strips them and makes async calls
- **DNI extraction:** Widget scans user messages regex `\d{7,8}` to find patient DNI. Assumes users provide DNI naturally in chat
- **Widget event delegation:** `.btn-cancelar` and `.btn-reservar` buttons from agenteWeb007.php HTML are auto-bound with `querySelectorAll` + `addEventListener` after render
- **Async/await:** FastAPI endpoints are all `async def` for concurrency. Use `await` for DB/HTTP calls
- **ORM lazy loading:** Avoid N+1 queries; pass `limite=20` to `obtener_historial()` to limit message fetch

## Third-Party Integration

**agenteWeb007.php** — External PHP API at `http://odontologiamg.ar/assets/agenteWeb007.php`
- POST parameters: `funcion` (1-4), `dni`, `idProfesional`, `idTurno`
- Returns JSON with `status` + `data` (HTML string or error message)
- Wrapping HTTP client in `agent/turnos.py` + backend endpoints `/turnos/*` to handle errors + add logging

## Testing

### Backend API Tests
**Local test file:** `tests/test_local.py` — Manual/integration tests for chat endpoint.

Run tests while server is running:
```bash
uvicorn agent.main:app --reload --port 8000  # Terminal 1
pytest tests/test_local.py  # Terminal 2
```

Or use FastAPI `/docs` Swagger UI at `http://localhost:8000/docs` to test endpoints interactively.

### Frontend Widget Testing
To test the widget locally, embed it in an HTML file:

1. Create `test_widget.html`:
```html
<html>
<head>
  <title>Widget Test</title>
  <script>
    window.AgentKitConfig = {
      apiUrl: "http://localhost:8000",
      title: "Odontologia MG",
      subtitle: "¿En qué te puedo ayudar?",
      primaryColor: "#1d4ed8"
    };
  </script>
  <script src="http://localhost:8000/widget/widget.js"></script>
</head>
<body>
  <h1>Widget Test</h1>
</body>
</html>
```

2. Open in browser: `file:///path/to/test_widget.html`
3. Open DevTools (F12) to check console for errors
4. Test the chat flow: DNI extraction, turnos markers, button clicks

## Project Structure Quick Reference

```
odontologiamg/
├── agent/              # FastAPI backend
│   ├── main.py         # Endpoints: /chat, /turnos/*, /paciente/*
│   ├── brain.py        # Claude API + system prompt loader
│   ├── memory.py       # SQLAlchemy ORM (Mensaje, Paciente tables)
│   ├── turnos.py       # agenteWeb007.php HTTP client
│   └── tools.py        # Reserved for agent tools (unused)
├── widget/             # JavaScript chatbot UI
│   └── widget.js       # Embeddable widget (~350 lines)
├── config/             # Configuration files
│   ├── prompts.yaml    # System prompt + doctor ID mappings
│   └── business.yaml   # Clinic metadata (unused but available)
├── knowledge/          # Knowledge base
│   └── base de conocimiento.txt  # Clinic info (not yet injected in prompts)
├── tests/              # Test suite
│   └── test_local.py   # Integration tests
├── Dockerfile          # Container build config
├── requirements.txt    # Python dependencies
└── CLAUDE.md           # This file
```

## Session & Authentication Flow

1. **Frontend** — Widget initializes with random `agentkit_session_id` → stored in `localStorage`
2. **POST /chat** — Widget sends `{"session_id": "...", "message": "..."}`
3. **Backend** — FastAPI creates/retrieves `Paciente` record by session_id, stores chat in `Mensaje` table
4. **Marker Detection** — Agent outputs `[BUSCAR_TURNOS_WIDGET:X]` → widget strips marker and calls `/turnos/buscar-html/X`
5. **DNI Extraction** — Widget regex-scans chat history for 7-8 digit number, stores as patient DNI
6. **Turno Operations** — Clicks send POST to `/turnos/reservar` or `/turnos/cancelar` with DNI + idTurno

**No API authentication** — Trust is via CORS (ALLOWED_ORIGINS env var).

## Troubleshooting

### Widget doesn't show up on page
- Check `window.AgentKitConfig.apiUrl` points to correct backend URL
- Check console (F12) for CORS errors — verify `ALLOWED_ORIGINS` env var includes the widget domain
- Verify `widget/widget.js` loads (check Network tab in DevTools)

### Session not preserved between page reloads
- Check if localStorage is enabled in browser (DevTools → Application → Local Storage)
- Check if browser is in private/incognito mode (localStorage disabled)
- Verify backend is persisting session in database (check `agentkit.db`)

### DNI not detected or turnos not showing
- Widget searches chat history for regex `\d{7,8}` — user must type a 7-8 digit number naturally
- Marker detection is case-sensitive: must be exactly `[BUSCAR_TURNOS_WIDGET:X]` or `[VER_MIS_TURNOS_WIDGET]`
- Check backend logs: `uvicorn agent.main:app --log-level debug`

### Turnos API returning errors
- Test agenteWeb007.php directly: `curl -X POST http://odontologiamg.ar/assets/agenteWeb007.php -d "funcion=1&idProfesional=3"`
- Check Railway logs if deployed: Dashboard → Logs tab
- Verify MEDICOS dict in `agent/turnos.py` matches doctor IDs in prompts.yaml

### Database issues
- SQLite file location: `./agentkit.db` (relative to current working directory)
- Reset database: `rm agentkit.db` (recreates on next server start)
- Check tables: `sqlite3 agentkit.db ".tables"`
- Inspect messages: `sqlite3 agentkit.db "SELECT * FROM mensaje ORDER BY id DESC LIMIT 10;"`

## Known Limitations & TODOs

- Widget DNI extraction is regex-based; assumes user provides it naturally. Fails silently if not found
- Widget markers (`[...]_WIDGET`) are fragile if agent accidentally outputs them in non-marker context; consider namespacing or escaping
- Knowledge base (`knowledge/base de conocimiento.txt`) is not currently injected into prompts; can be added to brain.py for RAG
- No authentication/rate-limiting on turnos endpoints (trust network security via ALLOWED_ORIGINS CORS)
- Widget only supports one session per browser (localStorage `agentkit_session_id`); multi-session not tested

## Files to Edit Most Often

- `config/prompts.yaml` — Agent behavior, clinic info, turnos workflow
- `widget/widget.js` — Chat UI, button handlers, API integration
- `agent/main.py` — API endpoints, response models
- `knowledge/base de conocimiento.txt` — Context for future RAG feature
