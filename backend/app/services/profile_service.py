from ..models.user import Usuario, UserStats
from ..models.friends import Amizade
from ..extensions import db
from .gamification_service import calcular_nivel
from werkzeug.security import check_password_hash, generate_password_hash


def get_profile(user_id: int):
    usuario = Usuario.query.get(user_id)
    if not usuario:
        return None, "Usuário não encontrado"

    stats = UserStats.query.filter_by(user_id=user_id).first()
    if not stats:
        stats = UserStats(user_id=user_id)
        db.session.add(stats)
        db.session.commit()

    amigos_count = Amizade.query.filter(
        ((Amizade.user_id == user_id) | (Amizade.friend_id == user_id))
        & (Amizade.status == "aceito")
    ).count()

    nivel = calcular_nivel(stats.pontos)
    if stats.nivel != nivel:
        stats.nivel = nivel
        db.session.commit()

    return {
        "id": usuario.id,
        "nome": usuario.nome,
        "email": usuario.email,
        "pontos": stats.pontos,
        "nivel": stats.nivel,
        "tarefas_completas": stats.tarefas_completas,
        "dias_ativos": stats.dias_ativos,
        "amigos_count": amigos_count,
        "proximo_nivel": 2000 if stats.pontos < 2000 else 3000,
        "streak": stats.streak_atual,
        "tutorial_completed": bool(usuario.tutorial_completed),
    }, None


def update_profile(user_id: int, novo_nome: str = None, novo_email: str = None):
    usuario = Usuario.query.get(user_id)
    if not usuario:
        return None, "Usuário não encontrado"

    if novo_email and novo_email != usuario.email:
        if Usuario.query.filter_by(email=novo_email).first():
            return None, "Este email já está em uso"
        usuario.email = novo_email

    if novo_nome:
        usuario.nome = novo_nome

    db.session.commit()
    return {"id": usuario.id, "nome": usuario.nome, "email": usuario.email}, None


def change_password(user_id: int, senha_atual: str, senha_nova: str):
    usuario = Usuario.query.get(user_id)
    if not usuario:
        return False, "Usuário não encontrado"

    if not check_password_hash(usuario.senha, senha_atual):
        return False, "Senha atual incorreta"

    usuario.senha = generate_password_hash(senha_nova)
    db.session.commit()
    return True, None


def complete_tutorial(user_id: int):
    usuario = Usuario.query.get(user_id)
    if not usuario:
        return False, "Usuário não encontrado"
    
    usuario.tutorial_completed = True
    db.session.commit()
    return True, None
