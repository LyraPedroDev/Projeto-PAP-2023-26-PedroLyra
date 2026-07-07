import random

from flask import Blueprint, jsonify, request
from werkzeug.security import generate_password_hash

from ..auth_tokens import admin_required, current_user
from ..extensions import db
from ..models.friends import Amizade
from ..models.private_message import PrivateMessage
from ..models.social import Comentario, Like, Publicacao
from ..models.tasks import Tarefa, TarefaUsuario
from ..models.user import Usuario, UserStats


admin_bp = Blueprint('admin', __name__)

VALID_MISSION_CATEGORIES = {'daily', 'weekly', 'monthly'}
VALID_ICONS = {'Leaf', 'Recycle', 'Droplet', 'Zap'}
MISSION_CATEGORY_ALIASES = {
    'daily': 'daily',
    'diaria': 'daily',
    'diária': 'daily',
    'weekly': 'weekly',
    'semanal': 'weekly',
    'monthly': 'monthly',
    'mensal': 'monthly',
}
MISSION_ICON_ALIASES = {
    'leaf': 'Leaf',
    'folha': 'Leaf',
    'recycle': 'Recycle',
    'reciclagem': 'Recycle',
    'droplet': 'Droplet',
    'gota': 'Droplet',
    'zap': 'Zap',
    'energia': 'Zap',
}


def _serialize_user(user, stats=None):
    return {
        'id': user.id,
        'nome': user.nome,
        'email': user.email,
        'is_admin': bool(user.is_admin),
        'pontos': stats.pontos if stats else 0,
    }


def _serialize_post(post, author=None):
    owner = author or Usuario.query.get(post.user_id)
    return {
        'id': post.id,
        'user_id': post.user_id,
        'autor_nome': owner.nome if owner else 'Utilizador removido',
        'autor_email': owner.email if owner else None,
        'descricao': post.descricao,
        'categoria': post.categoria,
        'imagem': post.imagem,
        'criada_em': post.criada_em.isoformat() if post.criada_em else None,
    }


def _serialize_mission(mission):
    return {
        'id': mission.id,
        'titulo': mission.titulo,
        'descricao': mission.descricao,
        'pontos': mission.pontos,
        'categoria': mission.categoria,
        'icone': mission.icone,
    }


def _delete_user_dependencies(user_id):
    post_ids = [row.id for row in Publicacao.query.with_entities(Publicacao.id).filter_by(user_id=user_id).all()]
    if post_ids:
        Comentario.query.filter(Comentario.publicacao_id.in_(post_ids)).delete(synchronize_session=False)
        Like.query.filter(Like.publicacao_id.in_(post_ids)).delete(synchronize_session=False)

    Comentario.query.filter_by(user_id=user_id).delete(synchronize_session=False)
    Like.query.filter_by(user_id=user_id).delete(synchronize_session=False)
    Publicacao.query.filter_by(user_id=user_id).delete(synchronize_session=False)
    TarefaUsuario.query.filter_by(user_id=user_id).delete(synchronize_session=False)
    UserStats.query.filter_by(user_id=user_id).delete(synchronize_session=False)
    Amizade.query.filter(
        (Amizade.user_id == user_id) | (Amizade.friend_id == user_id)
    ).delete(synchronize_session=False)
    PrivateMessage.query.filter(
        (PrivateMessage.sender_id == user_id) | (PrivateMessage.receiver_id == user_id)
    ).delete(synchronize_session=False)


def _normalize_mission_category(value):
    normalized = (value or 'daily').strip().lower()
    return MISSION_CATEGORY_ALIASES.get(normalized)


def _normalize_mission_icon(value):
    normalized = (value or 'Leaf').strip().lower()
    return MISSION_ICON_ALIASES.get(normalized)


def _normalize_points(value, default=10):
    if value in (None, ''):
        return default
    try:
        return max(int(value), 0)
    except (TypeError, ValueError):
        raise ValueError('Os pontos da missão devem ser um número inteiro igual ou superior a 0.')


@admin_bp.route('/api/admin/overview', methods=['GET'])
@admin_required
def overview():
    return jsonify({
        'users': Usuario.query.count(),
        'admins': Usuario.query.filter_by(is_admin=True).count(),
        'posts': Publicacao.query.count(),
        'missions': Tarefa.query.count(),
        'points': int(db.session.query(db.func.sum(UserStats.pontos)).scalar() or 0),
    })


@admin_bp.route('/api/admin/users', methods=['GET'])
@admin_required
def users():
    rows = (
        db.session.query(Usuario, UserStats)
        .outerjoin(UserStats, UserStats.user_id == Usuario.id)
        .order_by(Usuario.id.asc())
        .all()
    )
    return jsonify([_serialize_user(user, stats) for user, stats in rows])


@admin_bp.route('/api/admin/users', methods=['POST'])
@admin_required
def create_user():
    data = request.get_json() or {}
    nome = (data.get('nome') or '').strip()
    email = (data.get('email') or '').strip().lower()
    senha = data.get('senha') or ''
    is_admin = bool(data.get('is_admin'))

    if not nome or not email or not senha:
        return jsonify({'erro': 'Nome, email e senha são obrigatórios.'}), 400
    if Usuario.query.filter_by(email=email).first():
        return jsonify({'erro': 'Já existe um utilizador com esse email.'}), 409

    user = Usuario(
        nome=nome,
        email=email,
        senha=generate_password_hash(senha),
        is_admin=is_admin,
    )
    db.session.add(user)
    db.session.commit()

    stats = UserStats(user_id=user.id)
    db.session.add(stats)
    db.session.commit()
    return jsonify(_serialize_user(user, stats)), 201


@admin_bp.route('/api/admin/users/<int:user_id>', methods=['PATCH'])
@admin_required
def update_user(user_id):
    user = Usuario.query.get_or_404(user_id)
    data = request.get_json() or {}
    nome = (data.get('nome') or user.nome or '').strip()
    email = (data.get('email') or user.email or '').strip().lower()
    senha = data.get('senha') or ''
    is_admin = data.get('is_admin')

    if not nome or not email:
        return jsonify({'erro': 'Nome e email são obrigatórios.'}), 400

    existing = Usuario.query.filter(Usuario.email == email, Usuario.id != user_id).first()
    if existing:
        return jsonify({'erro': 'Já existe outro utilizador com esse email.'}), 409

    actor = current_user()
    if user.id == actor.id and is_admin is False:
        return jsonify({'erro': 'Não podes remover a tua própria permissão de administrador.'}), 400

    user.nome = nome
    user.email = email
    if senha:
        user.senha = generate_password_hash(senha)
    if is_admin is not None:
        user.is_admin = bool(is_admin)

    db.session.commit()
    stats = UserStats.query.filter_by(user_id=user.id).first()
    return jsonify(_serialize_user(user, stats))


@admin_bp.route('/api/admin/users/<int:user_id>', methods=['DELETE'])
@admin_required
def delete_user(user_id):
    actor = current_user()
    if actor.id == user_id:
        return jsonify({'erro': 'Não podes apagar a tua própria conta através do painel admin.'}), 400

    user = Usuario.query.get_or_404(user_id)
    _delete_user_dependencies(user.id)
    db.session.delete(user)
    db.session.commit()
    return jsonify({'sucesso': True})


@admin_bp.route('/api/admin/users/<int:user_id>/role', methods=['PATCH'])
@admin_required
def update_role(user_id):
    user = Usuario.query.get_or_404(user_id)
    actor = current_user()
    is_admin = bool((request.get_json() or {}).get('is_admin'))
    if actor.id == user.id and not is_admin:
        return jsonify({'erro': 'Não podes remover a tua própria permissão de administrador.'}), 400
    user.is_admin = is_admin
    db.session.commit()
    return jsonify({'sucesso': True, 'is_admin': bool(user.is_admin)})


@admin_bp.route('/api/admin/posts', methods=['GET'])
@admin_required
def posts():
    rows = Publicacao.query.order_by(Publicacao.criada_em.desc(), Publicacao.id.desc()).all()
    users_by_id = {
        user.id: user
        for user in Usuario.query.filter(Usuario.id.in_([post.user_id for post in rows])).all()
    } if rows else {}
    return jsonify([_serialize_post(post, users_by_id.get(post.user_id)) for post in rows])


@admin_bp.route('/api/admin/posts', methods=['POST'])
@admin_required
def create_post():
    data = request.get_json() or {}
    user_id = data.get('user_id')
    descricao = (data.get('descricao') or '').strip()
    categoria = (data.get('categoria') or 'geral').strip()
    imagem = (data.get('imagem') or '').strip() or None

    if not user_id or not descricao:
        return jsonify({'erro': 'Autor e descrição são obrigatórios.'}), 400

    author = Usuario.query.get(user_id)
    if not author:
        return jsonify({'erro': 'Utilizador não encontrado.'}), 404

    post = Publicacao(
        user_id=author.id,
        descricao=descricao,
        categoria=categoria or 'geral',
        imagem=imagem,
    )
    db.session.add(post)
    db.session.commit()
    return jsonify(_serialize_post(post, author)), 201


@admin_bp.route('/api/admin/posts/<int:post_id>', methods=['PATCH'])
@admin_required
def update_post(post_id):
    post = Publicacao.query.get_or_404(post_id)
    data = request.get_json() or {}
    user_id = data.get('user_id', post.user_id)
    descricao = (data.get('descricao') or post.descricao or '').strip()
    categoria = (data.get('categoria') or post.categoria or 'geral').strip()
    imagem = data.get('imagem')

    if not user_id or not descricao:
        return jsonify({'erro': 'Autor e descrição são obrigatórios.'}), 400

    author = Usuario.query.get(user_id)
    if not author:
        return jsonify({'erro': 'Utilizador não encontrado.'}), 404

    post.user_id = author.id
    post.descricao = descricao
    post.categoria = categoria or 'geral'
    if imagem is not None:
        post.imagem = imagem.strip() or None

    db.session.commit()
    return jsonify(_serialize_post(post, author))


@admin_bp.route('/api/admin/posts/<int:post_id>', methods=['DELETE'])
@admin_required
def delete_post(post_id):
    post = Publicacao.query.get_or_404(post_id)
    Comentario.query.filter_by(publicacao_id=post.id).delete(synchronize_session=False)
    Like.query.filter_by(publicacao_id=post.id).delete(synchronize_session=False)
    db.session.delete(post)
    db.session.commit()
    return jsonify({'sucesso': True})


@admin_bp.route('/api/admin/missions', methods=['GET'])
@admin_required
def missions():
    rows = Tarefa.query.order_by(Tarefa.id.asc()).all()
    return jsonify([_serialize_mission(mission) for mission in rows])


@admin_bp.route('/api/admin/missions', methods=['POST'])
@admin_required
def create_mission():
    data = request.get_json() or {}
    titulo = (data.get('titulo') or '').strip()
    descricao = (data.get('descricao') or '').strip()
    categoria = _normalize_mission_category(data.get('categoria'))
    icone = _normalize_mission_icon(data.get('icone'))

    if not titulo:
        return jsonify({'erro': 'O título da missão é obrigatório.'}), 400
    if categoria not in VALID_MISSION_CATEGORIES:
        return jsonify({'erro': 'Categoria de missão inválida.'}), 400
    if icone not in VALID_ICONS:
        return jsonify({'erro': 'Ícone inválido.'}), 400
    try:
        pontos = _normalize_points(data.get('pontos', 10), default=10)
    except ValueError as exc:
        return jsonify({'erro': str(exc)}), 400

    mission = Tarefa(
        titulo=titulo,
        descricao=descricao,
        pontos=pontos,
        categoria=categoria,
        icone=icone,
    )
    db.session.add(mission)
    db.session.commit()
    return jsonify(_serialize_mission(mission)), 201


@admin_bp.route('/api/admin/missions/<int:mission_id>', methods=['PATCH'])
@admin_required
def update_mission(mission_id):
    mission = Tarefa.query.get_or_404(mission_id)
    data = request.get_json() or {}
    titulo = (data.get('titulo') or mission.titulo or '').strip()
    descricao = (data.get('descricao') if 'descricao' in data else mission.descricao or '').strip()
    categoria = _normalize_mission_category(data.get('categoria', mission.categoria))
    icone = _normalize_mission_icon(data.get('icone', mission.icone))

    if not titulo:
        return jsonify({'erro': 'O título da missão é obrigatório.'}), 400
    if categoria not in VALID_MISSION_CATEGORIES:
        return jsonify({'erro': 'Categoria de missão inválida.'}), 400
    if icone not in VALID_ICONS:
        return jsonify({'erro': 'Ícone inválido.'}), 400
    try:
        pontos = _normalize_points(data.get('pontos', mission.pontos), default=mission.pontos)
    except ValueError as exc:
        return jsonify({'erro': str(exc)}), 400

    mission.titulo = titulo
    mission.descricao = descricao
    mission.categoria = categoria
    mission.icone = icone
    mission.pontos = pontos
    db.session.commit()
    return jsonify(_serialize_mission(mission))


@admin_bp.route('/api/admin/missions/<int:mission_id>', methods=['DELETE'])
@admin_required
def delete_mission(mission_id):
    mission = Tarefa.query.get_or_404(mission_id)
    TarefaUsuario.query.filter_by(tarefa_id=mission.id).delete(synchronize_session=False)
    db.session.delete(mission)
    db.session.commit()
    return jsonify({'sucesso': True})


@admin_bp.route('/api/admin/random-mission', methods=['GET'])
@admin_required
def random_mission():
    missions = Tarefa.query.all()
    if not missions:
        return jsonify({'erro': 'Não existem missões'}), 404
    mission = random.choice(missions)
    return jsonify(_serialize_mission(mission))


@admin_bp.route('/api/admin/reset-database', methods=['POST'])
@admin_required
def reset_database():
    try:
        db.drop_all()
        from ..models import init_db
        init_db()
        return jsonify({'sucesso': True, 'mensagem': 'Base de dados limpa e reiniciada com sucesso.'})
    except Exception as e:
        db.session.rollback()
        return jsonify({'erro': f'Erro ao limpar base de dados: {str(e)}'}), 500

