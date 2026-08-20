# agent/main.py — Servidor FastAPI para el agente web Odontologia MG

"""
API REST del agente web. Expone endpoints para el widget de chat embebible.
"""

import os
import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel
from dotenv import load_dotenv

from agent.brain import generar_respuesta
from agent.memory import inicializar_db, guardar_mensaje, obtener_historial, limpiar_historial, guardar_paciente, obtener_paciente
from agent.turnos import buscar_turnos, ver_mis_turnos, reservar_turno, cancelar_turno, get_medico_info

load_dotenv()

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s"
)
logger = logging.getLogger("agentkit")


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Inicializa la base de datos al arrancar."""
    await inicializar_db()
    logger.info("Base de datos inicializada")
    yield


app = FastAPI(
    title="Odontologia MG Agente Web",
    description="API del asistente virtual Odontologia MG",
    version="1.0.0",
    lifespan=lifespan
)

# CORS — permite peticiones desde cualquier origen (configurable via env)
allowed_origins = os.getenv("ALLOWED_ORIGINS", "*")
origins = ["*"] if allowed_origins == "*" else allowed_origins.split(",")

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=False,
    allow_methods=["GET", "POST", "DELETE"],
    allow_headers=["Content-Type"],
)

# Servir el widget como archivo estático
if os.path.exists("widget"):
    app.mount("/widget", StaticFiles(directory="widget"), name="widget")


# ── Modelos de request/response ──────────────────────────────────────────────

class ChatRequest(BaseModel):
    session_id: str
    message: str


class ChatResponse(BaseModel):
    session_id: str
    response: str


class PacienteRequest(BaseModel):
    session_id: str
    nombre: str
    apellido: str
    dni: str
    obra_social: str = None
    es_paciente: bool = False


class PacienteResponse(BaseModel):
    session_id: str
    nombre: str
    apellido: str
    dni: str
    obra_social: str = None
    es_paciente: bool


# ── Endpoints ─────────────────────────────────────────────────────────────────

@app.get("/health")
async def health():
    """Health check."""
    return {"status": "ok", "service": "Odontologia MG Agente Web"}


@app.post("/chat", response_model=ChatResponse)
async def chat(req: ChatRequest):
    """
    Recibe un mensaje del widget y retorna la respuesta del agente.

    Body: { "session_id": "uuid", "message": "texto del usuario" }
    """
    if not req.session_id or not req.session_id.strip():
        raise HTTPException(status_code=400, detail="session_id es requerido")

    if not req.message or not req.message.strip():
        raise HTTPException(status_code=400, detail="message es requerido")

    session_id = req.session_id.strip()
    mensaje = req.message.strip()

    logger.info(f"[{session_id[:8]}...] Usuario: {mensaje[:80]}")

    # Guardar mensaje del usuario
    await guardar_mensaje(session_id, "user", mensaje)

    # Obtener historial previo (sin el mensaje recién guardado)
    historial = await obtener_historial(session_id, limite=20)
    # El historial incluye el mensaje actual al final — lo excluimos para no duplicar
    historial_previo = historial[:-1] if historial else []

    # Generar respuesta
    respuesta = await generar_respuesta(mensaje, historial_previo)

    # Guardar respuesta del asistente
    await guardar_mensaje(session_id, "assistant", respuesta)

    logger.info(f"[{session_id[:8]}...] Asistente: {respuesta[:80]}")

    return ChatResponse(session_id=session_id, response=respuesta)


@app.delete("/chat/{session_id}")
async def limpiar_chat(session_id: str):
    """Borra el historial de conversación de una sesión."""
    await limpiar_historial(session_id)
    logger.info(f"Historial limpiado para sesión {session_id[:8]}...")
    return {"status": "ok", "message": "Historial borrado"}


@app.post("/paciente", response_model=PacienteResponse)
async def crear_paciente(req: PacienteRequest):
    """Guarda los datos de un paciente."""
    if not req.session_id or not req.dni:
        raise HTTPException(status_code=400, detail="session_id y dni son requeridos")

    await guardar_paciente(
        session_id=req.session_id,
        nombre=req.nombre,
        apellido=req.apellido,
        dni=req.dni,
        obra_social=req.obra_social,
        es_paciente=req.es_paciente
    )

    logger.info(f"[{req.session_id[:8]}...] Paciente guardado: {req.nombre} {req.apellido} (DNI: {req.dni})")

    return PacienteResponse(
        session_id=req.session_id,
        nombre=req.nombre,
        apellido=req.apellido,
        dni=req.dni,
        obra_social=req.obra_social,
        es_paciente=req.es_paciente
    )


@app.get("/paciente/{session_id}", response_model=PacienteResponse)
async def obtener_datos_paciente(session_id: str):
    """Obtiene los datos guardados de un paciente."""
    paciente = await obtener_paciente(session_id)
    if not paciente:
        raise HTTPException(status_code=404, detail="Paciente no encontrado")

    return PacienteResponse(
        session_id=session_id,
        **paciente
    )


# ── Endpoints de Turnos ────────────────────────────────────────────────────────

@app.get("/turnos/buscar/{id_profesional}")
async def buscar_turnos_endpoint(id_profesional: int):
    """Busca turnos disponibles para un médico (devuelve JSON)."""
    resultado = await buscar_turnos(id_profesional)
    medico = get_medico_info(id_profesional)

    if medico:
        resultado["medico"] = medico

    logger.info(f"Búsqueda de turnos para médico {id_profesional}: {resultado.get('status')}")
    return resultado


@app.get("/turnos/buscar-html/{id_profesional}")
async def buscar_turnos_html(id_profesional: int):
    """Busca turnos y retorna HTML formateado."""
    resultado = await buscar_turnos(id_profesional)
    medico = get_medico_info(id_profesional)

    if resultado.get("status") != "success":
        return {"html": f"<p style='color: red;'>❌ Error: {resultado.get('message', 'Error desconocido')}</p>"}

    medico_nombre = medico["nombre"] if medico else "Médico"
    html = f"<strong>📅 Turnos disponibles con {medico_nombre}:</strong><br>"
    html += resultado.get("data", "<p>No hay datos disponibles</p>")

    return {"html": html}


@app.get("/turnos/mis-turnos")
async def mis_turnos_endpoint(dni: str = None):
    """Obtiene los turnos del paciente por DNI."""
    if not dni:
        raise HTTPException(status_code=400, detail="DNI requerido")

    resultado = await ver_mis_turnos(dni)
    logger.info(f"Consulta de turnos para DNI {dni[:4]}***: {resultado.get('status')}")
    return resultado


class ReservarTurnoRequest(BaseModel):
    dni: str
    id_turno: int


@app.post("/turnos/reservar")
async def reservar_turno_endpoint(req: ReservarTurnoRequest):
    """Reserva un turno para el paciente."""
    if not req.dni or not req.id_turno:
        raise HTTPException(status_code=400, detail="DNI e ID de turno requeridos")

    resultado = await reservar_turno(req.dni, req.id_turno)
    logger.info(f"Intento de reservar turno {req.id_turno} para DNI {req.dni[:4]}***: {resultado.get('status')}")
    return resultado


class CancelarTurnoRequest(BaseModel):
    id_turno: int


@app.post("/turnos/cancelar")
async def cancelar_turno_endpoint(req: CancelarTurnoRequest):
    """Cancela un turno reservado."""
    if not req.id_turno:
        raise HTTPException(status_code=400, detail="ID de turno requerido")

    resultado = await cancelar_turno(req.id_turno)
    logger.info(f"Intento de cancelar turno {req.id_turno}: {resultado.get('status')}")
    return resultado
