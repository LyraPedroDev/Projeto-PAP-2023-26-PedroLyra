from flask import Blueprint, request, jsonify
from ..services.profile_service import get_profile, update_profile, change_password, complete_tutorial
from ..auth_tokens import current_user, login_required

profile_bp = Blueprint('profile', __name__)


@profile_bp.route('/api/profile/me', methods=['GET'])
@profile_bp.route('/api/profile/<int:user_id>', methods=['GET'])
@login_required
def get_profile_route(user_id=None):
    profile, erro = get_profile(current_user().id)
    if erro:
        return jsonify({"erro": erro}), 404
    return jsonify(profile)


@profile_bp.route('/api/profile/update', methods=['POST'])
@login_required
def update_profile_route():
    data = request.get_json()
    user_id = current_user().id

    if not user_id:
        return jsonify({"erro": "ID do usuário é obrigatório"}), 400

    usuario, erro = update_profile(user_id, data.get('nome'), data.get('email'))

    if erro:
        status = 404 if "não encontrado" in erro else 400
        return jsonify({"erro": erro}), status

    return jsonify({
        "sucesso": True,
        "mensagem": "Perfil atualizado com sucesso!",
        "usuario": usuario
    })


@profile_bp.route('/api/profile/change-password', methods=['POST'])
@login_required
def change_password_route():
    data = request.get_json()
    user_id = current_user().id
    senha_atual = data.get('senha_atual')
    senha_nova = data.get('senha_nova')

    if not all([user_id, senha_atual, senha_nova]):
        return jsonify({"erro": "Todos os campos são obrigatórios"}), 400

    ok, erro = change_password(user_id, senha_atual, senha_nova)

    if not ok:
        status = 404 if "não encontrado" in erro else 401
        return jsonify({"erro": erro}), status

    return jsonify({"sucesso": True, "mensagem": "Senha alterada com sucesso!"})


@profile_bp.route('/api/profile/tutorial', methods=['PUT', 'POST'])
@login_required
def tutorial_route():
    user_id = current_user().id
    ok, erro = complete_tutorial(user_id)
    if not ok:
        return jsonify({"erro": erro}), 400
    
    return jsonify({"sucesso": True, "mensagem": "Tutorial concluído!"})
