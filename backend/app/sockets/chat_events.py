"""
Handlers Socket.IO para o chat privado.

Regras de segurança:
- O user_id é SEMPRE lido da session Flask — nunca do payload do cliente.
- Amizade é validada antes de qualquer emissão ou escrita no banco.
- Cada utilizador entra na sua própria room: user_<id>
"""

from flask import session
from flask_socketio import emit, join_room, disconnect as sio_disconnect
from ..extensions import socketio
from ..services.private_chat_service import save_message


def _get_session_user_id():
    """Lê o user_id da sessão. Retorna None se não estiver autenticado."""
    return session.get('user_id')


# ── connect ───────────────────────────────────────────────────────────────────

@socketio.on('connect')
def on_connect():
    user_id = _get_session_user_id()

    if not user_id:
        return False  # Rejeita a ligação

    room = f'user_{user_id}'
    join_room(room)

    emit('connected', {'user_id': user_id, 'room': room})


# ── private_message ───────────────────────────────────────────────────────────

@socketio.on('private_message')
def on_private_message(data):
    """
    Payload esperado: { receiver_id: int, content: str }
    O sender_id vem da sessão — nunca do payload.
    """
    sender_id = _get_session_user_id()
    if not sender_id:
        emit('error', {'message': 'Não autenticado'})
        return

    receiver_id = data.get('receiver_id')
    content = (data.get('content') or '').strip()

    if not receiver_id:
        emit('error', {'message': 'receiver_id obrigatório'})
        return

    if not content:
        emit('error', {'message': 'Mensagem vazia'})
        return

    # Salvar no banco — valida amizade internamente
    msg_dict, erro = save_message(sender_id, int(receiver_id), content)

    if erro:
        emit('error', {'message': erro})
        return

    # Emitir para o sender e para o receiver (nas suas rooms privadas)
    emit('new_private_message', msg_dict, to=f'user_{sender_id}')
    emit('new_private_message', msg_dict, to=f'user_{receiver_id}')


# ── typing ────────────────────────────────────────────────────────────────────

@socketio.on('typing')
def on_typing(data):
    """
    Payload esperado: { receiver_id: int, is_typing: bool }
    """
    sender_id = _get_session_user_id()
    if not sender_id:
        return

    receiver_id = data.get('receiver_id')
    is_typing = bool(data.get('is_typing', False))

    if not receiver_id:
        return

    emit('user_typing', {
        'sender_id': sender_id,
        'is_typing': is_typing,
    }, to=f'user_{receiver_id}')


# ── disconnect ────────────────────────────────────────────────────────────────

@socketio.on('disconnect')
def on_disconnect():
    _get_session_user_id()
