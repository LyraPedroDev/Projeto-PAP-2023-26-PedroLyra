from flask import Blueprint, request, jsonify
from ..services.friends_service import (
    listar_amigos, listar_pendentes, adicionar_amigo,
    aceitar_amizade, recusar_amizade, remover_amigo
)
from ..auth_tokens import current_user, login_required

friends_bp = Blueprint('friends', __name__)


@friends_bp.route("/api/friends/<int:user_id>", methods=["GET"])
@login_required
def get_amigos(user_id):
    return jsonify(listar_amigos(current_user().id))


@friends_bp.route("/api/friends/pending/<int:user_id>", methods=["GET"])
@login_required
def get_pendentes(user_id):
    return jsonify(listar_pendentes(current_user().id))


@friends_bp.route("/api/friends/add", methods=["POST"])
@login_required
def add_friend():
    data = request.get_json()
    user_id = current_user().id
    alvo = data.get("alvo")

    if not user_id or not alvo:
        return jsonify({"erro": "Dados insuficientes"}), 400

    _, erro = adicionar_amigo(user_id, alvo)

    if erro:
        status = 404 if "não encontrado" in erro else 400
        return jsonify({"erro": erro}), status

    return jsonify({"sucesso": True, "mensagem": "Pedido enviado!"})


@friends_bp.route("/api/friends/accept", methods=["POST"])
@login_required
def accept_friend():
    data = request.get_json()
    ok, erro = aceitar_amizade(current_user().id, data.get("friend_id"))

    if not ok:
        return jsonify({"erro": erro}), 404

    return jsonify({"sucesso": True, "mensagem": "Amizade aceita!"})


@friends_bp.route("/api/friends/decline", methods=["POST"])
@login_required
def decline_friend():
    data = request.get_json()
    ok, erro = recusar_amizade(current_user().id, data.get("friend_id"))

    if not ok:
        return jsonify({"erro": erro}), 404

    return jsonify({"sucesso": True, "mensagem": "Pedido recusado"})


@friends_bp.route("/api/friends/remove", methods=["POST"])
@login_required
def remove_friend():
    data = request.get_json()
    ok, erro = remover_amigo(current_user().id, data.get("friend_id"))

    if not ok:
        return jsonify({"erro": erro}), 404

    return jsonify({"sucesso": True, "mensagem": "Amigo removido"})
