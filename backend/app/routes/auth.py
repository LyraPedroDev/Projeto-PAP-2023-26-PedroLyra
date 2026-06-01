from flask import Blueprint, request, jsonify, session
from ..services.auth_service import login_usuario, registrar_usuario

auth_bp = Blueprint('auth', __name__)


@auth_bp.route('/api/login', methods=['POST'])
def login():
    data = request.get_json()
    email = data.get('email')
    senha = data.get('senha')

    usuario = login_usuario(email, senha)

    if usuario:
        session['user_id'] = usuario.id
        return jsonify({
            "sucesso": True,
            "mensagem": "Login OK!",
            "user": {"id": usuario.id, "nome": usuario.nome, "email": usuario.email}
        })

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
