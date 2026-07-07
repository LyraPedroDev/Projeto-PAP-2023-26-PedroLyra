from ..models.social import Publicacao, Like, Comentario
from ..models.user import Usuario, UserStats
from ..models.friends import Amizade
from ..extensions import db
from datetime import datetime
import os
import uuid
from werkzeug.utils import secure_filename
from flask import current_app

# --- Categorias Ecológicas Permitidas ---
CATEGORIAS_PERMITIDAS = {'geral', 'reciclagem', 'agua', 'energia', 'transporte', 'alimentacao'}

def _allowed_file(filename: str) -> bool:
    """Verifica se a extensão da imagem é aceita."""
    if '.' not in filename:
        return False
    ext = filename.rsplit('.', 1)[1].lower()
    return ext in {'jpg', 'jpeg', 'png', 'webp'}

# --- Seção 3: Validações de Permissão (Backend) ---

def validate_post_ownership(user_id: int, post_id: int) -> bool:
    """
    Valida se o usuário é dono da publicação ou se é administrador.
    Retorna True se puder editar/deletar.
    Levanta ValueError se a publicação não existir.
    Levanta PermissionError se não for o proprietário nem admin.
    """
    post = Publicacao.query.get(post_id)
    if not post:
        raise ValueError("Publicação não encontrada")
        
    usuario = Usuario.query.get(user_id)
    if not usuario:
        raise PermissionError("Usuário não encontrado")
        
    if post.user_id != user_id and not usuario.is_admin:
        raise PermissionError("Você não tem permissão para gerenciar esta publicação")
    return True

def validate_comment_ownership(user_id: int, comment_id: int) -> bool:
    """
    Valida se o usuário é dono do comentário ou administrador.
    Retorna True se puder deletar.
    Levanta ValueError se o comentário não existir.
    Levanta PermissionError se não for o proprietário nem admin.
    """
    comment = Comentario.query.get(comment_id)
    if not comment:
        raise ValueError("Comentário não encontrado")
        
    usuario = Usuario.query.get(user_id)
    if not usuario:
        raise PermissionError("Usuário não encontrado")
        
    if comment.user_id != user_id and not usuario.is_admin:
        raise PermissionError("Você não tem permissão para excluir este comentário")
    return True

# --- Seção 6: CRUD de Publicações & Feed ---

def criar_post(user_id: int, descricao: str, categoria: str = 'geral', imagem_file=None):
    """
    Cria uma nova publicação com upload de imagem integrado (Opção A).
    Salva localmente com nome UUID v4 seguro e valida limites de 5MB.
    Retorna (Publicacao, Usuario).
    """
    descricao = (descricao or '').strip()
    if not descricao:
        raise ValueError("A descrição não pode estar vazia")
    
    categoria = (categoria or 'geral').strip().lower()
    if categoria not in CATEGORIAS_PERMITIDAS:
        raise KeyError("Categoria ecológica inválida")

    imagem_filename = None
    if imagem_file and imagem_file.filename:
        # Verificar tipo de arquivo (MIME-type e extensão)
        if not _allowed_file(imagem_file.filename):
            raise TypeError("Apenas imagens nos formatos JPG, PNG e WebP são aceitas")

        # Verificar tamanho máximo do arquivo (5MB = 5 * 1024 * 1024 bytes)
        imagem_file.seek(0, os.SEEK_END)
        file_size = imagem_file.tell()
        imagem_file.seek(0)  # Resetar ponteiro de leitura
        if file_size > 5 * 1024 * 1024:
            raise ValueError("O arquivo de imagem excede o limite máximo de 5MB")

        # Nomeamento seguro usando UUIDv4 no Windows 11
        ext = imagem_file.filename.rsplit('.', 1)[1].lower()
        imagem_filename = f"post_{user_id}_{uuid.uuid4().hex}.{ext}"
        
        filepath = os.path.join(current_app.config['UPLOAD_FOLDER'], imagem_filename)
        imagem_file.save(filepath)

    nova_pub = Publicacao(
        user_id=user_id,
        descricao=descricao,
        categoria=categoria,
        imagem=imagem_filename
    )
    db.session.add(nova_pub)

    # Dar +5 pontos de gamificação sustentável
    stats = UserStats.query.filter_by(user_id=user_id).first()
    if stats:
        stats.pontos += 5

    db.session.commit()
    usuario = Usuario.query.get(user_id)
    return nova_pub, usuario

def editar_post(user_id: int, post_id: int, descricao: str, categoria: str):
    """
    Edita descrição e categoria de uma publicação própria.
    """
    validate_post_ownership(user_id, post_id)
    
    descricao = (descricao or '').strip()
    if not descricao:
        raise ValueError("A descrição não pode estar vazia")
        
    categoria = (categoria or 'geral').strip().lower()
    if categoria not in CATEGORIAS_PERMITIDAS:
        raise KeyError("Categoria ecológica inválida")

    post = Publicacao.query.get(post_id)
    post.descricao = descricao
    post.categoria = categoria
    
    # Atualizar timestamp do update_at se aplicável no banco
    if hasattr(post, 'updated_at'):
        post.updated_at = datetime.utcnow()
        
    db.session.commit()
    return post

def deletar_post(user_id: int, post_id: int) -> bool:
    """
    Exclui publicação própria e realiza limpeza física de imagem e dados em cascata.
    """
    validate_post_ownership(user_id, post_id)
    post = Publicacao.query.get(post_id)
    
    # 1. Apagar fisicamente a imagem local
    if post.imagem:
        try:
            filepath = os.path.join(current_app.config['UPLOAD_FOLDER'], post.imagem)
            if os.path.exists(filepath):
                os.remove(filepath)
        except Exception:
            pass

    # 2. Deletar likes associados
    Like.query.filter_by(publicacao_id=post_id).delete()

    # 3. Deletar comentários associados
    Comentario.query.filter_by(publicacao_id=post_id).delete()

    # 4. Deletar post
    db.session.delete(post)
    db.session.commit()
    return True

def get_feed(user_id: int, page: int = 1, limit: int = 5, categoria: str = None, filtro: str = 'para-voce') -> dict:
    """
    Retorna posts com paginação SQL e filtros avançados.
    Trending score: (likes * 2) + (comentarios * 5)
    """
    query = Publicacao.query

    # 1. Filtragem por Categoria Ecológica
    if categoria and categoria != 'todos':
        categoria = categoria.strip().lower()
        if categoria in CATEGORIAS_PERMITIDAS:
            query = query.filter_by(categoria=categoria)

    # 2. Filtragem por Abas Inteligentes (Filtro)
    if filtro == 'seguindo':
        # Carregar amigos (status='aceito')
        amizades = Amizade.query.filter(
            ((Amizade.user_id == user_id) | (Amizade.friend_id == user_id))
            & (Amizade.status == "aceito")
        ).all()
        amigo_ids = [a.friend_id if a.user_id == user_id else a.user_id for a in amizades]
        if not amigo_ids:
            return {"posts": [], "pagination": {"page": page, "limit": limit, "total": 0, "pages": 0, "has_more": False, "has_previous": False}}
        query = query.filter(Publicacao.user_id.in_(amigo_ids))
        
    elif filtro == 'minhas-categorias':
        # Posts do próprio usuário para visualização e gerenciamento simplificado
        query = query.filter_by(user_id=user_id)

    # Nota: No caso de 'trending', computamos a ordenação em memória mais adiante,
    # então faremos o fetch da query base inteira (ou limite de 100 posts) primeiro.
    
    total = query.count()
    pages = (total + limit - 1) // limit if total > 0 else 0
    offset = (page - 1) * limit

    posts_list = []
    
    if filtro == 'trending':
        # Pegar todos os posts do escopo e ordenar em memória por score
        todos_posts = query.all()
        scored_posts = []
        for p in todos_posts:
            likes_count = Like.query.filter_by(publicacao_id=p.id).count()
            coms_count = Comentario.query.filter_by(publicacao_id=p.id).count()
            score = (likes_count * 2) + (coms_count * 5)
            scored_posts.append((score, p))
        
        # Ordenar por score desc, depois por data criada_em desc
        scored_posts.sort(key=lambda x: (x[0], x[1].criada_em), reverse=True)
        
        # Aplicar paginação em memória
        paginated_pairs = scored_posts[offset:offset+limit]
        publicacoes = [pair[1] for pair in paginated_pairs]
    else:
        # Ordenação cronológica reversa nativa
        publicacoes = query.order_by(Publicacao.criada_em.desc()).offset(offset).limit(limit).all()

    current_user_obj = Usuario.query.get(user_id) if user_id else None
    current_user_is_admin = current_user_obj.is_admin if current_user_obj else False

    for pub in publicacoes:
        usuario = Usuario.query.get(pub.user_id)
        if not usuario:
            continue
            
        likes_count = Like.query.filter_by(publicacao_id=pub.id).count()
        coms_count = Comentario.query.filter_by(publicacao_id=pub.id).count()
        user_liked = Like.query.filter_by(publicacao_id=pub.id, user_id=user_id).first() is not None
        
        # Mapeamento do username e avatar consistentes
        username = usuario.email.split('@')[0] if usuario.email else usuario.nome.lower().replace(' ', '_')
        
        posts_list.append({
            "id": pub.id,
            "usuario": {
                "id": usuario.id,
                "nome": usuario.nome,
                "username": username,
                "avatar_url": None
            },
            "descricao": pub.descricao,
            "categoria": pub.categoria,
            "imagem_url": f"/api/uploads/{pub.imagem}" if pub.imagem else None,
            "created_at": pub.criada_em.isoformat() if hasattr(pub.criada_em, 'isoformat') else str(pub.criada_em),
            "updated_at": pub.criada_em.isoformat() if hasattr(pub.criada_em, 'isoformat') else str(pub.criada_em),
            "likes_count": likes_count,
            "comments_count": coms_count,
            "user_liked": user_liked,
            "is_owner": pub.user_id == user_id or current_user_is_admin,
            "edited": False # Campo visual para controle no frontend
        })

    has_more = page < pages
    has_previous = page > 1

    return {
        "posts": posts_list,
        "pagination": {
            "page": page,
            "limit": limit,
            "total": total,
            "pages": pages,
            "has_more": has_more,
            "has_previous": has_previous
        }
    }

# --- Seção 2: Negócio de Likes Semânticos ---

def curtir_post(user_id: int, post_id: int):
    """
    Curte uma publicação. Lança ValueError se já curtiu ou se post não existe.
    Retorna o total de likes.
    """
    post = Publicacao.query.get(post_id)
    if not post:
        raise KeyError("Publicação não encontrada")
        
    existente = Like.query.filter_by(publicacao_id=post_id, user_id=user_id).first()
    if existente:
        raise ValueError("Você já curtiu esta publicação")

    novo_like = Like(user_id=user_id, publicacao_id=post_id)
    db.session.add(novo_like)
    db.session.commit()
    
    total_likes = Like.query.filter_by(publicacao_id=post_id).count()
    return total_likes

def descurtir_post(user_id: int, post_id: int):
    """
    Remove curtida da publicação. Lança ValueError se não existe a curtida ou post.
    Retorna total de likes.
    """
    post = Publicacao.query.get(post_id)
    if not post:
        raise KeyError("Publicação não encontrada")
        
    like = Like.query.filter_by(publicacao_id=post_id, user_id=user_id).first()
    if not like:
        raise ValueError("Você não curtiu esta publicação ainda")

    db.session.delete(like)
    db.session.commit()
    
    total_likes = Like.query.filter_by(publicacao_id=post_id).count()
    return total_likes

# --- Seção 3: Negócio de Comentários ---

def criar_comentario(user_id: int, post_id: int, conteudo: str):
    """
    Cria comentário na publicação. Lança ValueError se conteúdo vazio ou post não existe.
    Retorna (Comentario, Usuario).
    """
    post = Publicacao.query.get(post_id)
    if not post:
        raise KeyError("Publicação não encontrada")
        
    conteudo = (conteudo or '').strip()
    if not conteudo:
        raise ValueError("O conteúdo do comentário não pode estar vazio")

    novo = Comentario(user_id=user_id, publicacao_id=post_id, texto=conteudo)
    db.session.add(novo)
    db.session.commit()
    
    usuario = Usuario.query.get(user_id)
    return novo, usuario

def deletar_comentario(user_id: int, comment_id: int) -> dict:
    """
    Deleta comentário próprio. Lança ValueError ou PermissionError se inválido.
    Retorna {'post_id': int, 'comments_count': int}.
    """
    validate_comment_ownership(user_id, comment_id)
    comment = Comentario.query.get(comment_id)
    post_id = comment.publicacao_id
    
    db.session.delete(comment)
    db.session.commit()
    
    comments_count = Comentario.query.filter_by(publicacao_id=post_id).count()
    return {"post_id": post_id, "comments_count": comments_count}

def get_comments_paginated(post_id: int, page: int = 1, limit: int = 5) -> dict:
    """
    Retorna a lista de comentários paginados de uma publicação.
    """
    post = Publicacao.query.get(post_id)
    if not post:
        raise KeyError("Publicação não encontrada")
        
    query = Comentario.query.filter_by(publicacao_id=post_id).order_by(Comentario.criada_em.asc())
    total = query.count()
    offset = (page - 1) * limit
    
    comentarios = query.offset(offset).limit(limit).all()
    
    lista = []
    for c in comentarios:
        usuario = Usuario.query.get(c.user_id)
        if not usuario:
            continue
        username = usuario.email.split('@')[0] if usuario.email else usuario.nome.lower().replace(' ', '_')
        lista.append({
            "id": c.id,
            "post_id": post_id,
            "usuario": {
                "id": usuario.id,
                "nome": usuario.nome,
                "username": username,
                "avatar": usuario.nome[0].upper() if usuario.nome else "E"
            },
            "conteudo": c.texto,
            "created_at": c.criada_em.isoformat() if hasattr(c.criada_em, 'isoformat') else str(c.criada_em),
            "user_can_delete": False # Preenchido dinamicamente na rota com base na sessão
        })
        
    has_more = offset + len(comentarios) < total
    
    return {
        "comentarios": lista,
        "pagination": {
            "page": page,
            "limit": limit,
            "total": total,
            "has_more": has_more
        }
    }
