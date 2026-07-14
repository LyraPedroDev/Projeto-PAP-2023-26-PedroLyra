from flask import Blueprint, request, jsonify, session, send_from_directory, current_app
from ..services.feed_service import (
    criar_post, get_feed, curtir_post, descurtir_post,
    criar_comentario, deletar_comentario, get_comments_paginated,
    editar_post, deletar_post, validate_post_ownership
)
from ..models.user import Usuario
from ..models.social import Like, Comentario, Publicacao
from ..extensions import socketio
from datetime import datetime

feed_bp = Blueprint('feed', __name__)

# --- Helper de Autenticação Rápida ---
def _get_logged_user_id():
    """Retorna user_id logado na sessão ou None."""
    return session.get('user_id')

# --- 1. Feed Principal Paginado ---
@feed_bp.route('/api/feed', methods=['GET'])
@feed_bp.route('/api/feed/<int:user_id>', methods=['GET'])
def get_feed_route(user_id=None):
    logged_id = _get_logged_user_id() or user_id
    if not logged_id:
        return jsonify({
            "success": False,
            "error": "Autenticação requerida.",
            "code": "UNAUTHORIZED",
            "status_code": 401
        }), 401
    
    page = request.args.get('page', 1, type=int)
    limit = request.args.get('limit', 5, type=int)
    filtro = request.args.get('filtro', 'para-voce', type=str)
    categoria = request.args.get('categoria', None, type=str)

    try:
        resultado = get_feed(logged_id, page=page, limit=limit, categoria=categoria, filtro=filtro)
        return jsonify({
            "success": True,
            "data": resultado
        }), 200
    except Exception:
        return jsonify({
            "success": False,
            "error": "Erro interno ao processar feed",
            "code": "INTERNAL_ERROR",
            "status_code": 500
        }), 500

# --- 2. Criar Publicação (Multipart/Form-Data) ---
@feed_bp.route('/api/posts', methods=['POST'])
def criar_publicacao_route():
    user_id = _get_logged_user_id()
    if not user_id:
        return jsonify({
            "success": False,
            "error": "Você precisa estar autenticado para postar.",
            "code": "UNAUTHORIZED",
            "status_code": 401
        }), 401

    # Obter parâmetros multipart/form-data
    descricao = request.form.get('descricao', '').strip()
    categoria = request.form.get('categoria', 'geral').strip()
    imagem_file = request.files.get('imagem', None)

    try:
        nova_pub, usuario = criar_post(user_id, descricao, categoria, imagem_file)
        
        username = usuario.email.split('@')[0] if usuario.email else usuario.nome.lower().replace(' ', '_')
        post_url = f"/api/uploads/{nova_pub.imagem}" if nova_pub.imagem else None
        
        post_dict = {
            "id": nova_pub.id,
            "usuario": {
                "id": usuario.id,
                "nome": usuario.nome,
                "username": username,
                "avatar_url": None
            },
            "descricao": nova_pub.descricao,
            "categoria": nova_pub.categoria,
            "imagem_url": post_url,
            "created_at": nova_pub.criada_em.isoformat() if hasattr(nova_pub.criada_em, 'isoformat') else str(nova_pub.criada_em),
            "updated_at": nova_pub.criada_em.isoformat() if hasattr(nova_pub.criada_em, 'isoformat') else str(nova_pub.criada_em),
            "likes_count": 0,
            "comments_count": 0,
            "user_liked": False,
            "is_owner": True,
            "edited": False
        }

        # Emissão em Broadcast global do novo post via Socket.IO
        socketio.emit('novo_post', post_dict)

        return jsonify({
            "success": True,
            "data": post_dict,
            "message": "Publicação criada com sucesso! Ganhaste +5 pontos! 🌱"
        }), 201

    except ValueError as e:
        err_msg = str(e)
        if "tamanho máximo" in err_msg or "excede o limite" in err_msg:
            return jsonify({
                "success": False,
                "error": err_msg,
                "code": "FILE_TOO_LARGE",
                "status_code": 413
            }), 413
        return jsonify({
            "success": False,
            "error": err_msg,
            "code": "INVALID_DESCRIPTION",
            "status_code": 400
        }), 400
    except KeyError as e:
        return jsonify({
            "success": False,
            "error": str(e).strip("'"),
            "code": "INVALID_CATEGORY",
            "status_code": 400
        }), 400
    except TypeError as e:
        return jsonify({
            "success": False,
            "error": str(e),
            "code": "INVALID_FILE_TYPE",
            "status_code": 415
        }), 415
    except Exception:
        return jsonify({
            "success": False,
            "error": "Erro interno no servidor ao salvar post.",
            "code": "INTERNAL_ERROR",
            "status_code": 500
        }), 500

# --- 3. Editar Publicação ---
@feed_bp.route('/api/posts/<int:post_id>', methods=['PUT'])
def edit_post_route(post_id):
    user_id = _get_logged_user_id()
    if not user_id:
        return jsonify({
            "success": False,
            "error": "Autenticação requerida.",
            "code": "UNAUTHORIZED",
            "status_code": 401
        }), 401

    data = request.get_json() or {}
    descricao = data.get('descricao', '').strip()
    categoria = data.get('categoria', '').strip()

    try:
        post = editar_post(user_id, post_id, descricao, categoria)
        
        # Emissão em Broadcast de edição
        socketio.emit('editar_post', {
            "post_id": post_id,
            "descricao": post.descricao,
            "categoria": post.categoria,
            "timestamp": datetime.utcnow().isoformat()
        })

        # Montar dados de retorno
        usuario = Usuario.query.get(post.user_id)
        username = usuario.email.split('@')[0] if usuario.email else usuario.nome.lower().replace(' ', '_')
        likes_count = Like.query.filter_by(publicacao_id=post_id).count()
        coms_count = Comentario.query.filter_by(publicacao_id=post_id).count()
        user_liked = Like.query.filter_by(publicacao_id=post_id, user_id=user_id).first() is not None

        return jsonify({
            "success": True,
            "data": {
                "id": post.id,
                "usuario": {
                    "id": usuario.id,
                    "nome": usuario.nome,
                    "username": username,
                    "avatar_url": None
                },
                "descricao": post.descricao,
                "categoria": post.categoria,
                "imagem_url": f"/api/uploads/{post.imagem}" if post.imagem else None,
                "created_at": post.criada_em.isoformat() if hasattr(post.criada_em, 'isoformat') else str(post.criada_em),
                "updated_at": datetime.utcnow().isoformat(),
                "likes_count": likes_count,
                "comments_count": coms_count,
                "user_liked": user_liked,
                "is_owner": True,
                "edited": True
            },
            "message": "Post atualizado com sucesso"
        }), 200

    except ValueError as e:
        err_msg = str(e)
        if "não encontrada" in err_msg:
            return jsonify({
                "success": False,
                "error": err_msg,
                "code": "NOT_FOUND",
                "status_code": 404
            }), 404
        return jsonify({
            "success": False,
            "error": err_msg,
            "code": "INVALID_DESCRIPTION",
            "status_code": 400
        }), 400
    except KeyError as e:
        return jsonify({
            "success": False,
            "error": str(e).strip("'"),
            "code": "INVALID_CATEGORY",
            "status_code": 400
        }), 400
    except PermissionError as e:
        return jsonify({
            "success": False,
            "error": str(e),
            "code": "PERMISSION_DENIED",
            "status_code": 403
        }), 403
    except Exception:
        return jsonify({
            "success": False,
            "error": "Erro interno no servidor ao editar.",
            "code": "INTERNAL_ERROR",
            "status_code": 500
        }), 500

# --- 4. Deletar Publicação ---
@feed_bp.route('/api/posts/<int:post_id>', methods=['DELETE'])
def deletar_post_route(post_id):
    user_id = _get_logged_user_id()
    if not user_id:
        return jsonify({
            "success": False,
            "error": "Autenticação requerida.",
            "code": "UNAUTHORIZED",
            "status_code": 401
        }), 401

    try:
        deletar_post(user_id, post_id)
        
        # Emissão em Broadcast global de exclusão
        socketio.emit('deletar_post', {"post_id": post_id})

        return jsonify({
            "success": True,
            "data": {
                "id": post_id,
                "deleted": True
            },
            "message": "Post deletado com sucesso"
        }), 200

    except ValueError as e:
        return jsonify({
            "success": False,
            "error": str(e),
            "code": "NOT_FOUND",
            "status_code": 404
        }), 404
    except PermissionError as e:
        return jsonify({
            "success": False,
            "error": str(e),
            "code": "PERMISSION_DENIED",
            "status_code": 403
        }), 403
    except Exception:
        return jsonify({
            "success": False,
            "error": "Erro interno no servidor.",
            "code": "INTERNAL_ERROR",
            "status_code": 500
        }), 500

# --- 5. Curtir Publicação ---
@feed_bp.route('/api/posts/<int:post_id>/like', methods=['POST'])
def curtir_post_route(post_id):
    user_id = _get_logged_user_id()
    if not user_id:
        return jsonify({
            "success": False,
            "error": "Você precisa estar autenticado para curtir.",
            "code": "UNAUTHORIZED",
            "status_code": 401
        }), 401

    try:
        likes_count = curtir_post(user_id, post_id)
        usuario = Usuario.query.get(user_id)
        
        # Emissão do evento update_like
        socketio.emit('update_like', {
            "post_id": post_id,
            "likes_count": likes_count,
            "user_liked_by": user_id,
            "usuario_nome": usuario.nome,
            "acao": "adicionado"
        })

        return jsonify({
            "success": True,
            "data": {
                "post_id": post_id,
                "user_id": user_id,
                "likes_count": likes_count,
                "user_liked": True
            },
            "message": "Post curtido com sucesso"
        }), 201

    except KeyError as e:
        return jsonify({
            "success": False,
            "error": str(e).strip("'"),
            "code": "NOT_FOUND",
            "status_code": 404
        }), 404
    except ValueError as e:
        return jsonify({
            "success": False,
            "error": str(e),
            "code": "ALREADY_LIKED",
            "status_code": 409
        }), 409
    except Exception:
        return jsonify({
            "success": False,
            "error": "Erro interno ao dar curtir.",
            "code": "INTERNAL_ERROR",
            "status_code": 500
        }), 500

# --- 6. Descurtir Publicação ---
@feed_bp.route('/api/posts/<int:post_id>/like', methods=['DELETE'])
def descurtir_post_route(post_id):
    user_id = _get_logged_user_id()
    if not user_id:
        return jsonify({
            "success": False,
            "error": "Você precisa estar autenticado para descurtir.",
            "code": "UNAUTHORIZED",
            "status_code": 401
        }), 401

    try:
        likes_count = descurtir_post(user_id, post_id)
        usuario = Usuario.query.get(user_id)
        
        # Emissão do evento update_like em broadcast
        socketio.emit('update_like', {
            "post_id": post_id,
            "likes_count": likes_count,
            "user_liked_by": user_id,
            "usuario_nome": usuario.nome,
            "acao": "removido"
        })

        return jsonify({
            "success": True,
            "data": {
                "post_id": post_id,
                "likes_count": likes_count,
                "user_liked": False
            },
            "message": "Like removido com sucesso"
        }), 200

    except KeyError as e:
        return jsonify({
            "success": False,
            "error": str(e).strip("'"),
            "code": "NOT_FOUND",
            "status_code": 404
        }), 404
    except ValueError as e:
        return jsonify({
            "success": False,
            "error": str(e),
            "code": "NOT_LIKED_YET",
            "status_code": 400
        }), 400
    except Exception:
        return jsonify({
            "success": False,
            "error": "Erro ao remover curtir.",
            "code": "INTERNAL_ERROR",
            "status_code": 500
        }), 500

# --- 7. Status do Like ---
@feed_bp.route('/api/posts/<int:post_id>/like', methods=['GET'])
def get_like_status_route(post_id):
    user_id = _get_logged_user_id()
    if not user_id:
        return jsonify({
            "success": False,
            "error": "Autenticação requerida.",
            "code": "UNAUTHORIZED",
            "status_code": 401
        }), 401

    try:
        post = Publicacao.query.get(post_id)
        if not post:
            return jsonify({
                "success": False,
                "error": "Publicação não encontrada.",
                "code": "NOT_FOUND",
                "status_code": 404
            }), 404

        likes_count = Like.query.filter_by(publicacao_id=post_id).count()
        user_liked = Like.query.filter_by(publicacao_id=post_id, user_id=user_id).first() is not None

        return jsonify({
            "success": True,
            "data": {
                "post_id": post_id,
                "user_liked": user_liked,
                "likes_count": likes_count
            }
        }), 200
    except Exception:
        return jsonify({
            "success": False,
            "error": "Erro interno no servidor.",
            "code": "INTERNAL_ERROR",
            "status_code": 500
        }), 500

# --- 8. Criar Comentário ---
@feed_bp.route('/api/posts/<int:post_id>/comments', methods=['POST'])
def criar_comentario_route(post_id):
    user_id = _get_logged_user_id()
    if not user_id:
        return jsonify({
            "success": False,
            "error": "Você precisa estar autenticado para comentar.",
            "code": "UNAUTHORIZED",
            "status_code": 401
        }), 401

    data = request.get_json() or {}
    conteudo = data.get('conteudo', '').strip()

    try:
        comentario, usuario = criar_comentario(user_id, post_id, conteudo)
        comments_count = Comentario.query.filter_by(publicacao_id=post_id).count()
        username = usuario.email.split('@')[0] if usuario.email else usuario.nome.lower().replace(' ', '_')
        
        comment_data = {
            "id": comentario.id,
            "post_id": post_id,
            "usuario": {
                "id": usuario.id,
                "nome": usuario.nome,
                "username": username,
                "avatar": usuario.nome[0].upper() if usuario.nome else "E"
            },
            "conteudo": comentario.texto,
            "created_at": comentario.criada_em.isoformat() if hasattr(comentario.criada_em, 'isoformat') else str(comentario.criada_em),
            "user_can_delete": True
        }

        # Emissão de evento novo_comentario em broadcast
        socketio.emit('novo_comentario', {
            "post_id": post_id,
            "comment_id": comentario.id,
            "usuario_id": user_id,
            "usuario_nome": usuario.nome,
            "conteudo": comentario.texto,
            "comments_count": comments_count,
            "timestamp": datetime.utcnow().isoformat()
        })

        return jsonify({
            "success": True,
            "data": comment_data
        }), 201

    except KeyError as e:
        return jsonify({
            "success": False,
            "error": str(e).strip("'"),
            "code": "NOT_FOUND",
            "status_code": 404
        }), 404
    except ValueError as e:
        return jsonify({
            "success": False,
            "error": str(e),
            "code": "INVALID_CONTENT",
            "status_code": 400
        }), 400
    except Exception:
        return jsonify({
            "success": False,
            "error": "Erro ao criar comentário.",
            "code": "INTERNAL_ERROR",
            "status_code": 500
        }), 500

# --- 9. Listar Comentários Paginados ---
@feed_bp.route('/api/posts/<int:post_id>/comments', methods=['GET'])
def get_comments_route(post_id):
    user_id = _get_logged_user_id()
    page = request.args.get('page', 1, type=int)
    limit = request.args.get('limit', 5, type=int)

    try:
        resultado = get_comments_paginated(post_id, page=page, limit=limit)
        
        # Verificar se o user é admin
        is_admin = False
        if user_id:
            usuario_atual = Usuario.query.get(user_id)
            if usuario_atual and usuario_atual.is_admin:
                is_admin = True
                
        # Mapear permissão de deleção inline dinamicamente
        for c in resultado['comentarios']:
            c['user_can_delete'] = (user_id is not None) and (c['usuario']['id'] == user_id or is_admin)

        return jsonify({
            "success": True,
            "data": resultado
        }), 200

    except KeyError as e:
        return jsonify({
            "success": False,
            "error": str(e).strip("'"),
            "code": "NOT_FOUND",
            "status_code": 404
        }), 404
    except Exception:
        return jsonify({
            "success": False,
            "error": "Erro interno ao listar comentários.",
            "code": "INTERNAL_ERROR",
            "status_code": 500
        }), 500

# --- 10. Deletar Comentário ---
@feed_bp.route('/api/posts/<int:post_id>/comments/<int:comment_id>', methods=['DELETE'])
def deletar_comentario_route(post_id, comment_id):
    user_id = _get_logged_user_id()
    if not user_id:
        return jsonify({
            "success": False,
            "error": "Autenticação requerida.",
            "code": "UNAUTHORIZED",
            "status_code": 401
        }), 401

    try:
        resultado = deletar_comentario(user_id, comment_id)
        
        # Emissão de evento deletar_comentario em broadcast
        socketio.emit('deletar_comentario', {
            "post_id": post_id,
            "comment_id": comment_id,
            "comments_count": resultado['comments_count'],
            "timestamp": datetime.utcnow().isoformat()
        })

        return jsonify({
            "success": True,
            "data": {
                "post_id": post_id,
                "comment_id": comment_id,
                "comments_count": resultado['comments_count']
            },
            "message": "Comentário deletado com sucesso"
        }), 200

    except ValueError as e:
        return jsonify({
            "success": False,
            "error": str(e),
            "code": "COMMENT_NOT_FOUND",
            "status_code": 404
        }), 404
    except PermissionError as e:
        return jsonify({
            "success": False,
            "error": str(e),
            "code": "PERMISSION_DENIED",
            "status_code": 403
        }), 403
    except Exception:
        return jsonify({
            "success": False,
            "error": "Erro ao deletar comentário.",
            "code": "INTERNAL_ERROR",
            "status_code": 500
        }), 500

# --- 11. Servir uploads locais ---
@feed_bp.route('/api/uploads/<filename>', methods=['GET'])
def serve_upload(filename):
    return send_from_directory(current_app.config['UPLOAD_FOLDER'], filename)
