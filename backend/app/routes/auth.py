from flask import Blueprint, request, jsonify, session, make_response
from ..services.auth_service import login_usuario, registrar_usuario
from ..models.user import Usuario
from ..auth_tokens import (
    REFRESH_COOKIE, clear_auth_cookies, current_user, decode_token,
    login_required, set_auth_cookies,
)

auth_bp = Blueprint('auth', __name__)


@auth_bp.route('/api/login', methods=['POST'])
def login():
    data = request.get_json()
    email = data.get('email')
    senha = data.get('senha')

    usuario = login_usuario(email, senha)

    if usuario:
        session['user_id'] = usuario.id
        response = make_response(jsonify({
            "sucesso": True,
            "mensagem": "Login OK!",
            "user": {
                "id": usuario.id,
                "nome": usuario.nome,
                "email": usuario.email,
                "is_admin": bool(usuario.is_admin),
            }
        }))
        return set_auth_cookies(response, usuario)

    return jsonify({"sucesso": False, "mensagem": "Email ou senha inválidos!"}), 401


@auth_bp.route('/api/register', methods=['POST'])
def register():
    try:
        data = request.get_json()
        nome = data.get("nome")
        email = data.get('email')
        senha = data.get('senha')

        usuario, erro = registrar_usuario(nome, email, senha)

        if erro:
            return jsonify({"sucesso": False, "mensagem": erro}), 400

        return jsonify({"sucesso": True, "mensagem": "Conta criada com sucesso!"})
    except Exception as e:
        import traceback
        print(f"[Register-Error] Falha crítica no registro de usuário: {e}")
        traceback.print_exc()
        return jsonify({"sucesso": False, "mensagem": f"Erro interno ao processar cadastro: {str(e)}"}), 500


@auth_bp.route('/api/auth/me', methods=['GET'])
@login_required
def me():
    user = current_user()
    return jsonify({
        'sucesso': True,
        'user': {
            'id': user.id,
            'nome': user.nome,
            'email': user.email,
            'is_admin': bool(user.is_admin),
        }
    })


@auth_bp.route('/api/auth/refresh', methods=['POST'])
def refresh():
    data = decode_token(request.cookies.get(REFRESH_COOKIE), 'refresh')
    user = Usuario.query.get(data.get('user_id')) if data else None
    if not user:
        response = make_response(jsonify({
            'sucesso': False,
            'mensagem': 'Sessão terminada. Inicie sessão novamente.',
        }), 401)
        session.clear()
        return clear_auth_cookies(response)

    session['user_id'] = user.id
    response = make_response(jsonify({
        'sucesso': True,
        'user': {
            'id': user.id,
            'nome': user.nome,
            'email': user.email,
            'is_admin': bool(user.is_admin),
        }
    }))
    return set_auth_cookies(response, user)


@auth_bp.route('/api/auth/logout', methods=['POST'])
def logout():
    session.clear()
    return clear_auth_cookies(make_response(jsonify({'sucesso': True})))
