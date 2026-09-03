# agent/memory.py — Memoria de conversaciones con SQLite

"""
Sistema de memoria del agente. Guarda el historial de conversaciones
por session_id (generado en el browser) usando SQLite (local) o PostgreSQL (producción).
"""

import os
from datetime import datetime
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession, async_sessionmaker
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column
from sqlalchemy import String, Text, DateTime, select, Integer, delete
from dotenv import load_dotenv

load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL", "sqlite+aiosqlite:///./agentkit.db")

if DATABASE_URL.startswith("postgresql://"):
    DATABASE_URL = DATABASE_URL.replace("postgresql://", "postgresql+asyncpg://", 1)

engine = create_async_engine(DATABASE_URL, echo=False)
async_session = async_sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)


class Base(DeclarativeBase):
    pass


class Mensaje(Base):
    """Modelo de mensaje en la base de datos."""
    __tablename__ = "mensajes"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    session_id: Mapped[str] = mapped_column(String(100), index=True)
    role: Mapped[str] = mapped_column(String(20))  # "user" o "assistant"
    content: Mapped[str] = mapped_column(Text)
    timestamp: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)


class Paciente(Base):
    """Modelo de paciente con datos de contacto."""
    __tablename__ = "pacientes"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    session_id: Mapped[str] = mapped_column(String(100), index=True)
    nombre: Mapped[str] = mapped_column(String(100))
    apellido: Mapped[str] = mapped_column(String(100))
    dni: Mapped[str] = mapped_column(String(20), index=True)
    obra_social: Mapped[str] = mapped_column(String(100), nullable=True)
    es_paciente: Mapped[bool] = mapped_column(default=False)
    timestamp: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)


class PreguntaSinRespuesta(Base):
    """Modelo para guardar preguntas sin respuesta para revisión semanal."""
    __tablename__ = "preguntas_sin_respuesta"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    session_id: Mapped[str] = mapped_column(String(100), index=True)
    pregunta: Mapped[str] = mapped_column(Text)
    respuesta: Mapped[str] = mapped_column(Text, nullable=True)
    respondida: Mapped[bool] = mapped_column(default=False)
    timestamp: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, index=True)


async def inicializar_db():
    """Crea las tablas si no existen."""
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)


async def guardar_mensaje(session_id: str, role: str, content: str):
    """Guarda un mensaje en el historial de conversación."""
    async with async_session() as session:
        mensaje = Mensaje(
            session_id=session_id,
            role=role,
            content=content,
            timestamp=datetime.utcnow()
        )
        session.add(mensaje)
        await session.commit()


async def obtener_historial(session_id: str, limite: int = 20) -> list[dict]:
    """
    Recupera los últimos N mensajes de una conversación.

    Args:
        session_id: ID de sesión del browser
        limite: Máximo de mensajes a recuperar (default: 20)

    Returns:
        Lista de diccionarios con role y content
    """
    async with async_session() as session:
        query = (
            select(Mensaje)
            .where(Mensaje.session_id == session_id)
            .order_by(Mensaje.timestamp.desc())
            .limit(limite)
        )
        result = await session.execute(query)
        mensajes = result.scalars().all()

        mensajes.reverse()

        return [
            {"role": msg.role, "content": msg.content}
            for msg in mensajes
        ]


async def limpiar_historial(session_id: str):
    """Borra todo el historial de una conversación."""
    async with async_session() as session:
        stmt = delete(Mensaje).where(Mensaje.session_id == session_id)
        await session.execute(stmt)
        await session.commit()


async def guardar_paciente(session_id: str, nombre: str, apellido: str, dni: str, obra_social: str = None, es_paciente: bool = False):
    """Guarda o actualiza datos de un paciente."""
    async with async_session() as session:
        query = select(Paciente).where(Paciente.session_id == session_id)
        result = await session.execute(query)
        paciente = result.scalar()

        if paciente:
            paciente.nombre = nombre
            paciente.apellido = apellido
            paciente.dni = dni
            paciente.obra_social = obra_social
            paciente.es_paciente = es_paciente
        else:
            paciente = Paciente(
                session_id=session_id,
                nombre=nombre,
                apellido=apellido,
                dni=dni,
                obra_social=obra_social,
                es_paciente=es_paciente
            )
            session.add(paciente)

        await session.commit()


async def obtener_paciente(session_id: str) -> dict:
    """Obtiene datos del paciente de una sesión."""
    async with async_session() as session:
        query = select(Paciente).where(Paciente.session_id == session_id)
        result = await session.execute(query)
        paciente = result.scalar()

        if paciente:
            return {
                "nombre": paciente.nombre,
                "apellido": paciente.apellido,
                "dni": paciente.dni,
                "obra_social": paciente.obra_social,
                "es_paciente": paciente.es_paciente
            }
        return None


async def guardar_pregunta_sin_respuesta(session_id: str, pregunta: str):
    """Guarda una pregunta que no pudo ser respondida."""
    async with async_session() as session:
        pregunta_obj = PreguntaSinRespuesta(
            session_id=session_id,
            pregunta=pregunta,
            timestamp=datetime.utcnow()
        )
        session.add(pregunta_obj)
        await session.commit()


async def obtener_preguntas_sin_respuesta(respondidas: bool = False) -> list[dict]:
    """Obtiene preguntas sin respuesta. Si respondidas=True, obtiene las respondidas."""
    async with async_session() as session:
        query = (
            select(PreguntaSinRespuesta)
            .where(PreguntaSinRespuesta.respondida == respondidas)
            .order_by(PreguntaSinRespuesta.timestamp.desc())
        )
        result = await session.execute(query)
        preguntas = result.scalars().all()

        return [
            {
                "id": p.id,
                "session_id": p.session_id,
                "pregunta": p.pregunta,
                "respuesta": p.respuesta,
                "respondida": p.respondida,
                "timestamp": p.timestamp.isoformat()
            }
            for p in preguntas
        ]


async def actualizar_respuesta_pregunta(pregunta_id: int, respuesta: str):
    """Actualiza la respuesta de una pregunta sin respuesta."""
    async with async_session() as session:
        query = select(PreguntaSinRespuesta).where(PreguntaSinRespuesta.id == pregunta_id)
        result = await session.execute(query)
        pregunta = result.scalar()

        if pregunta:
            pregunta.respuesta = respuesta
            pregunta.respondida = True
            await session.commit()
