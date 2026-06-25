from flask import Blueprint, jsonify
from ..models.user import Usuario, UserStats
from ..models.social import Publicacao, Like
from ..extensions import db

stats_bp = Blueprint('stats', __name__)


@stats_bp.route('/api', methods=['GET'])
def home():
    return jsonify({
        "mensagem": "🌱 EcoChat API está ativa!",
        "rotas_disponiveis": [
            "/api/login", "/api/register", "/api/chat",
            "/api/status", "/api/friends/*", "/api/profile/me",
            "/api/tasks/*", "/api/ranking",
            "/api/feed/*", "/api/posts/*",
        ]
    })


@stats_bp.route('/api/status', methods=['GET'])
def status():
    return jsonify({
        "status": "ok",
        "usuarios_cadastrados": Usuario.query.count()
    })


@stats_bp.route('/api/stats', methods=['GET'])
def get_stats():
    total_usuarios = Usuario.query.count()
    total_publicacoes = Publicacao.query.count()
    total_likes = Like.query.count()
    total_tarefas = db.session.query(db.func.sum(UserStats.tarefas_completas)).scalar() or 0
    return jsonify({
        "usuarios": total_usuarios,
        "publicacoes": total_publicacoes,
        "likes": total_likes,
        "tarefas_completas": int(total_tarefas),
    })
