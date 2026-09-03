# agent/turnos.py — Integración con sistema de turnos agenteWeb007.php

"""
Cliente para interactuar con el sistema de turnos de Odontologia MG.
API ubicada en: http://odontologiamg.ar/assets/agenteWeb007.php
"""

import httpx
import logging
from typing import Optional

logger = logging.getLogger("agentkit")

API_URL = "https://odontologiamg.ar/assets/agenteWeb007.php"

# Mapeo de médicos
MEDICOS = {
    2: {"nombre": "Dra. Gomez Mariana", "especialidad": "Odontología General, Cirugía Maxilofacial"},
    9: {"nombre": "Dra. Chiaramonte Maria Laura", "especialidad": "Odontología General"},
    21: {"nombre": "Dra. Lerma Analia", "especialidad": "Odontología General"},
    22: {"nombre": "Dra. Mariana Levian Vera", "especialidad": "Odontología General"},
    24: {"nombre": "Dra. Daniela Karpovicz", "especialidad": "Odontología General"},
    25: {"nombre": "Dra. Lucia Lopez", "especialidad": "Odontología General"},
    26: {"nombre": "Dr. Carrion Santiago", "especialidad": "Odontología General"},
    28: {"nombre": "Dr. Porte Alejandro", "especialidad": "Odontología General"},
    29: {"nombre": "Dra. Villagra Lucila", "especialidad": "Odontología General"},
    31: {"nombre": "Dra. Nuñez Guadalupe", "especialidad": "Odontología General"},
    32: {"nombre": "Dr. Pedone Felipe", "especialidad": "Odontología General"},
    33: {"nombre": "Dra. Ulloa Julieta", "especialidad": "Odontología General"}
}


async def buscar_turnos(id_profesional: int) -> dict:
    """Busca turnos disponibles para un médico específico."""
    if id_profesional not in MEDICOS:
        return {"status": "error", "message": "Médico no válido"}

    try:
        async with httpx.AsyncClient(timeout=10) as client:
            response = await client.post(
                API_URL,
                data={
                    "funcion": 1,
                    "idProfesional": id_profesional
                }
            )

            # Si la API retorna error HTTP
            if response.status_code != 200:
                logger.error(f"API error {response.status_code}: {response.text}")
                return {"status": "error", "message": f"Error del servidor (código {response.status_code})"}

            # Intentar parsear JSON
            try:
                return response.json()
            except:
                logger.error(f"Error parseando JSON: {response.text}")
                return {"status": "error", "message": "Error al procesar respuesta del servidor"}
    except Exception as e:
        logger.error(f"Error al buscar turnos: {e}")
        return {"status": "error", "message": f"Error de conexión: {str(e)}"}


async def ver_mis_turnos(dni: str) -> dict:
    """Obtiene los turnos reservados del paciente."""
    if not dni or not dni.strip():
        return {"status": "error", "message": "DNI requerido"}

    try:
        async with httpx.AsyncClient(timeout=10) as client:
            response = await client.post(
                API_URL,
                data={
                    "funcion": 2,
                    "dni": dni.strip()
                }
            )
            return response.json()
    except Exception as e:
        logger.error(f"Error al obtener turnos: {e}")
        return {"status": "error", "message": str(e)}


async def reservar_turno(dni: str, id_turno: int) -> dict:
    """Reserva un turno para el paciente."""
    if not dni or not id_turno:
        return {"status": "error", "message": "DNI e ID de turno requeridos"}

    try:
        async with httpx.AsyncClient(timeout=10) as client:
            response = await client.post(
                API_URL,
                data={
                    "funcion": 3,
                    "dni": dni.strip(),
                    "idTurno": id_turno
                }
            )
            return response.json()
    except Exception as e:
        logger.error(f"Error al reservar turno: {e}")
        return {"status": "error", "message": str(e)}


async def cancelar_turno(id_turno: int) -> dict:
    """Cancela un turno reservado."""
    if not id_turno:
        return {"status": "error", "message": "ID de turno requerido"}

    try:
        async with httpx.AsyncClient(timeout=10) as client:
            response = await client.post(
                API_URL,
                data={
                    "funcion": 4,
                    "idTurno": id_turno
                }
            )
            return response.json()
    except Exception as e:
        logger.error(f"Error al cancelar turno: {e}")
        return {"status": "error", "message": str(e)}


def get_medico_info(id_profesional: int) -> Optional[dict]:
    """Obtiene información del médico."""
    return MEDICOS.get(id_profesional)
