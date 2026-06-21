import random

from flask import Blueprint, jsonify, request

from ..auth_tokens import admin_required
from ..extensions import db
from ..models.social import Publicacao
from ..models.tasks import Tarefa
from ..models.user import Usuario, UserStats


admin_bp = Blueprint('admin', __name__)


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
    return jsonify([{
        'id': user.id,
        'nome': user.nome,
        'email': user.email,
        'is_admin': bool(user.is_admin),
        'pontos': stats.pontos if stats else 0,
    } for user, stats in rows])


@admin_bp.route('/api/admin/users/<int:user_id>/role', methods=['PATCH'])
@admin_required
def update_role(user_id):
    user = Usuario.query.get_or_404(user_id)
    user.is_admin = bool((request.get_json() or {}).get('is_admin'))
    db.session.commit()
    return jsonify({'sucesso': True, 'is_admin': bool(user.is_admin)})


@admin_bp.route('/api/admin/random-mission', methods=['GET'])
@admin_required
def random_mission():
    missions = Tarefa.query.all()
    if not missions:
        return jsonify({'erro': 'Não existem missões'}), 404
    mission = random.choice(missions)
    return jsonify({
        'id': mission.id,
        'titulo': mission.titulo,
        'descricao': mission.descricao,
        'pontos': mission.pontos,
        'categoria': mission.categoria,
        'icone': mission.icone,
    })
