# Especificação Técnica Definitiva: Feed Social do EcoChat

Este documento detalha com precisão técnica a arquitetura, contratos de API padronizados, validações de segurança, esquema de banco de dados, índices SQL, comportamento em tempo real do Socket.IO, fluxo de upload de imagens e mapeamento de erros para o **Feed Social do EcoChat** no Windows 11.

---

## 1. Contrato Completo de Todas as APIs (JSON Envelopado)

Todas as respostas da API adotam o padrão de envelope.
* **Sucesso:** `{"success": true, "data": { ... }, "message": "..."}`
* **Erro:** `{"success": false, "error": "...", "code": "...", "status_code": 400}`

---

### 1.1 GET `/api/feed/<int:user_id>` (Obter Feed de Posts)
* **Query Params:**
  * `page`: int (padrão `1`)
  * `limit`: int (padrão `5`)
  * `filtro`: `'para-voce'` | `'seguindo'` | `'trending'` | `'minhas-categorias'` (padrão `'para-voce'`)
  * `categoria`: string (opcional, ex: `'reciclagem'`, `'agua'`)
* **Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "posts": [
      {
        "id": 1,
        "usuario": {
          "id": 2,
          "nome": "Pedro Lyra",
          "username": "pedro_lyra",
          "avatar_url": null
        },
        "descricao": "Hoje instalei um coletor de água da chuva! 💧",
        "categoria": "agua",
        "imagem_url": "/api/uploads/post_2_20260528.jpg",
        "created_at": "2026-05-28T10:30:00Z",
        "updated_at": "2026-05-28T10:30:00Z",
        "likes_count": 15,
        "comments_count": 3,
        "user_liked": false,
        "is_owner": false,
        "edited": false
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 5,
      "total": 47,
      "pages": 10,
      "has_more": true,
      "has_previous": false
    }
  }
}
```

---

### 1.2 POST `/api/posts` (Criar Publicação)
* **Headers:** `Content-Type: multipart/form-data`
* **Form-Data Payload:**
  * `descricao`: "Texto do post..." (string, max 500 caracteres)
  * `categoria`: "reciclagem" (string, ex: geral, reciclagem, agua, energia, transporte, alimentacao)
  * `imagem`: `<arquivo binário>` (opcional, max 5MB)
* **Response (201 Created):**
```json
{
  "success": true,
  "data": {
    "id": 48,
    "usuario": {
      "id": 2,
      "nome": "Pedro Lyra",
      "username": "pedro_lyra",
      "avatar_url": null
    },
    "descricao": "Texto do post...",
    "categoria": "reciclagem",
    "imagem_url": "/api/uploads/abc123.jpg",
    "created_at": "2026-05-28T10:45:00Z",
    "updated_at": "2026-05-28T10:45:00Z",
    "likes_count": 0,
    "comments_count": 0,
    "user_liked": false,
    "is_owner": true,
    "edited": false
  },
  "message": "Post criado com sucesso"
}
```

---

### 1.3 PUT `/api/posts/<int:post_id>` (Editar Publicação)
* **Headers:** `Content-Type: application/json`
* **JSON Payload:**
```json
{
  "descricao": "Texto editado da minha publicação ecológia 🌱",
  "categoria": "reciclagem"
}
```
* **Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "id": 48,
    "usuario": {
      "id": 2,
      "nome": "Pedro Lyra",
      "username": "pedro_lyra",
      "avatar_url": null
    },
    "descricao": "Texto editado da minha publicação ecológia 🌱",
    "categoria": "reciclagem",
    "imagem_url": "/api/uploads/abc123.jpg",
    "created_at": "2026-05-28T10:45:00Z",
    "updated_at": "2026-05-28T10:50:00Z",
    "likes_count": 5,
    "comments_count": 1,
    "user_liked": false,
    "is_owner": true,
    "edited": true
  },
  "message": "Post atualizado com sucesso"
}
```

---

### 1.4 DELETE `/api/posts/<int:post_id>` (Deletar Publicação)
* **Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "id": 48,
    "deleted": true
  },
  "message": "Post deletado com sucesso"
}
```

---

### 1.5 POST `/api/posts/<int:post_id>/like` (Curtir Publicação)
* **Response (201 Created):**
```json
{
  "success": true,
  "data": {
    "post_id": 48,
    "user_id": 2,
    "likes_count": 1,
    "user_liked": true
  },
  "message": "Post curtido com sucesso"
}
```

---

### 1.6 DELETE `/api/posts/<int:post_id>/like` (Descurtir Publicação)
* **Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "post_id": 48,
    "likes_count": 0,
    "user_liked": false
  },
  "message": "Like removido com sucesso"
}
```

---

### 1.7 GET `/api/posts/<int:post_id>/like` (Obter Status do Like)
* **Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "post_id": 48,
    "user_liked": true,
    "likes_count": 1
  }
}
```

---

### 1.8 POST `/api/posts/<int:post_id>/comments` (Criar Comentário)
* **Headers:** `Content-Type: application/json`
* **JSON Payload:**
```json
{
  "conteudo": "Excelente iniciativa! Parabéns! ♻️"
}
```
* **Response (201 Created):**
```json
{
  "success": true,
  "data": {
    "id": 123,
    "post_id": 48,
    "usuario": {
      "id": 5,
      "nome": "João Silva",
      "username": "joao_silva",
      "avatar": "JS"
    },
    "conteudo": "Excelente iniciativa! Parabéns! ♻️",
    "created_at": "2026-05-28T10:35:00Z",
    "user_can_delete": true
  }
}
```

---

### 1.9 GET `/api/posts/<int:post_id>/comments` (Listar Comentários Paginados)
* **Query Params:** `page` (padrão `1`), `limit` (padrão `5`)
* **Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "comentarios": [
      {
        "id": 123,
        "post_id": 48,
        "usuario": {
          "id": 5,
          "nome": "João Silva",
          "username": "joao_silva",
          "avatar": "JS"
        },
        "conteudo": "Excelente iniciativa! Parabéns! ♻️",
        "created_at": "2026-05-28T10:35:00Z",
        "user_can_delete": true
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 5,
      "total": 12,
      "has_more": true
    }
  }
}
```

---

### 1.10 DELETE `/api/posts/<int:post_id>/comments/<int:comment_id>` (Deletar Comentário)
* **Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "post_id": 48,
    "comment_id": 123,
    "comments_count": 11
  },
  "message": "Comentário deletado com sucesso"
}
```

---

## 2. Esquema do Banco de Dados (SQLite)

Utilizaremos o modelo mapeado pelo SQLAlchemy em `social.py` e `friends.py`, mantendo a total integridade com as tabelas já criadas no banco de dados.

```python
# Em backend/app/models/social.py
class Publicacao(db.Model):
    __tablename__ = 'publicacao'
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey("usuario.id"), nullable=False)
    descricao = db.Column(db.String(500), nullable=False)
    imagem = db.Column(db.String(200), nullable=True) # Nome do arquivo UUID
    categoria = db.Column(db.String(50), default="geral")
    criada_em = db.Column(db.DateTime, default=db.func.current_timestamp())
    updated_at = db.Column(db.DateTime, default=db.func.current_timestamp(), onupdate=db.func.current_timestamp())

class Like(db.Model):
    __tablename__ = 'like'
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey("usuario.id"), nullable=False)
    publicacao_id = db.Column(db.Integer, db.ForeignKey("publicacao.id"), nullable=False)

class Comentario(db.Model):
    __tablename__ = 'comentario'
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey("usuario.id"), nullable=False)
    publicacao_id = db.Column(db.Integer, db.ForeignKey("publicacao.id"), nullable=False)
    texto = db.Column(db.String(500), nullable=False) # Correspondente à coluna do banco
    criada_em = db.Column(db.DateTime, default=db.func.current_timestamp())

# Em backend/app/models/friends.py
class Amizade(db.Model):
    __tablename__ = 'amizade'
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey("usuario.id"), nullable=False)
    friend_id = db.Column(db.Integer, db.ForeignKey("usuario.id"), nullable=False)
    status = db.Column(db.String(20), default="pendente") # 'pendente', 'aceito', 'bloqueado'
```

---

## 3. Validações de Permissão (Backend & Frontend)

### 3.1 Função de Validação do Backend (Python)
Para segurança de controle de dados contra manipulação de IDs via API, criamos a função de verificação de autoria:

```python
# Em backend/app/services/feed_service.py
from ..models.social import Publicacao, Comentario

def validate_post_ownership(user_id: int, post_id: int) -> bool:
    """
    Valida se o usuário é o dono da publicação.
    Retorna True se puder editar/deletar.
    Levanta ValueError se a publicação não existir.
    Levanta PermissionError se o usuário não for o autor.
    """
    post = Publicacao.query.get(post_id)
    if not post:
        raise ValueError("Publicação não encontrada")
    if post.user_id != user_id:
        raise PermissionError("Você não tem permissão para editar ou excluir esta publicação")
    return True

def validate_comment_ownership(user_id: int, comment_id: int) -> bool:
    """
    Valida se o usuário é o dono do comentário.
    """
    comment = Comentario.query.get(comment_id)
    if not comment:
        raise ValueError("Comentário não encontrado")
    if comment.user_id != user_id:
        raise PermissionError("Você não tem permissão para excluir este comentário")
    return True
```

### 3.2 Aplicação Prática nas Rotas
```python
# Em backend/app/routes/feed.py
from flask import session, jsonify, request
from ..services.feed_service import validate_post_ownership

@feed_bp.route('/api/posts/<int:post_id>', methods=['PUT'])
def edit_post(post_id):
    user_id = session.get('user_id')
    if not user_id:
        return jsonify({
            "success": false,
            "error": "Você precisa estar logado para fazer isso",
            "code": "UNAUTHORIZED",
            "status_code": 401
        }), 401
        
    try:
        validate_post_ownership(user_id, post_id)
        # Continua fluxo seguro de edição...
    except ValueError as e:
        return jsonify({
            "success": false,
            "error": str(e),
            "code": "NOT_FOUND",
            "status_code": 404
        }), 404
    except PermissionError as e:
        return jsonify({
            "success": false,
            "error": str(e),
            "code": "PERMISSION_DENIED",
            "status_code": 403
        }), 403
```

---

## 4. Eventos Socket.IO Completos (Tempo Real)

Para sincronização entre abas, todas as operações que modificam dados disparam emissões em broadcast do Socket.IO.

### 4.1 Lista de Eventos e Payloads

#### Evento: `novo_post`
* **Tipo:** Broadcast (para todos os clientes)
* **Payload:**
```json
{
  "post_id": 48,
  "usuario": {
    "id": 2,
    "nome": "Pedro Lyra",
    "username": "pedro_lyra"
  },
  "descricao": "Texto do post...",
  "categoria": "reciclagem",
  "imagem_url": "/api/uploads/abc123.jpg",
  "created_at": "2026-05-28T10:45:00Z"
}
```

#### Evento: `update_like`
* **Tipo:** Broadcast
* **Payload:**
```json
{
  "post_id": 48,
  "likes_count": 42,
  "user_liked_by": 5,
  "usuario_nome": "João Silva",
  "acao": "adicionado" // ou "removido"
}
```

#### Evento: `novo_comentario`
* **Tipo:** Broadcast
* **Payload:**
```json
{
  "post_id": 48,
  "comment_id": 123,
  "usuario_id": 5,
  "usuario_nome": "João Silva",
  "conteudo": "Excelente post! ♻️",
  "comments_count": 12,
  "timestamp": "2026-05-28T10:35:00Z"
}
```

#### Evento: `deletar_comentario`
* **Tipo:** Broadcast
* **Payload:**
```json
{
  "post_id": 48,
  "comment_id": 123,
  "comments_count": 11,
  "timestamp": "2026-05-28T10:40:00Z"
}
```

#### Evento: `editar_post`
* **Tipo:** Broadcast
* **Payload:**
```json
{
  "post_id": 48,
  "descricao": "Texto editado!",
  "categoria": "reciclagem",
  "timestamp": "2026-05-28T10:50:00Z"
}
```

#### Evento: `deletar_post`
* **Tipo:** Broadcast
* **Payload:**
```json
{
  "post_id": 48
}
```

---

## 5. Índices SQL para Performance

Para otimizar os filtros do feed do SQLite no Windows 11, criaremos os seguintes índices adicionais no bootstrap do aplicativo.

### 5.1 Script de Criação SQL
```sql
-- Índice cronológico para ordenação do feed principal
CREATE INDEX IF NOT EXISTS idx_publicacao_criada_em ON publicacao(criada_em DESC);

-- Índice por categoria de postagem ecológia
CREATE INDEX IF NOT EXISTS idx_publicacao_categoria ON publicacao(categoria);

-- Índice por ID do autor da publicação
CREATE INDEX IF NOT EXISTS idx_publicacao_user_id ON publicacao(user_id);

-- Índices de relacionamento para aceleração de contagem de Likes
CREATE INDEX IF NOT EXISTS idx_like_publicacao_id ON like(publicacao_id);
CREATE INDEX IF NOT EXISTS idx_like_user_id ON like(user_id);

-- Índices de relacionamento para aceleração de contagem de Comentários
CREATE INDEX IF NOT EXISTS idx_comentario_publicacao_id ON comentario(publicacao_id);

-- Índices compostos de amizade para o filtro 'Seguindo'
CREATE INDEX IF NOT EXISTS idx_amizade_user_status ON amizade(user_id, status);
CREATE INDEX IF NOT EXISTS idx_amizade_friend_status ON amizade(friend_id, status);
```

### 5.2 Execução no Bootstrap
As queries acima serão chamadas dinamicamente dentro do contexto do banco ao carregar o app:
```python
# Em backend/app/models/__init__.py
from sqlalchemy import text
from ..extensions import db

def create_indexes():
    indexes = [
        "CREATE INDEX IF NOT EXISTS idx_publicacao_criada_em ON publicacao(criada_em DESC);",
        "CREATE INDEX IF NOT EXISTS idx_publicacao_categoria ON publicacao(categoria);",
        "CREATE INDEX IF NOT EXISTS idx_publicacao_user_id ON publicacao(user_id);",
        "CREATE INDEX IF NOT EXISTS idx_like_publicacao_id ON like(publicacao_id);",
        "CREATE INDEX IF NOT EXISTS idx_comentario_publicacao_id ON comentario(publicacao_id);",
        "CREATE INDEX IF NOT EXISTS idx_amizade_user_status ON amizade(user_id, status);",
        "CREATE INDEX IF NOT EXISTS idx_amizade_friend_status ON amizade(friend_id, status);"
    ]
    for idx_sql in indexes:
        db.session.execute(text(idx_sql))
    db.session.commit()
```

---

## 6. Sistema Completo de Upload de Imagens

### 🚀 Recomendação Arquitetural: OPÇÃO A (Upload Integrado)
A **Opção A** (Upload Integrado no request `POST /api/posts`) é a recomendada. Ela é atômica (não gera imagens órfãs na pasta de uploads caso o segundo request falhe), simplifica muito a orquestração do frontend e tem total sinergia com o ecossistema existente.

### 6.1 Detalhes Técnicos e Validações
* **Endpoint:** `POST /api/posts`
* **Tipo de Requisição:** `multipart/form-data`
* **Campos Textuais:**
  * `descricao`: string (max 500 caracteres, mínimo 1 caractere).
  * `categoria`: string (deve pertencer à lista ecológica permitida: `geral`, `reciclagem`, `agua`, `energia`, `transporte`, `alimentacao`).
* **Campo de Arquivo (`imagem`):**
  * **Tamanho Máximo:** 5MB.
  * **Formatos Permitidos (MIME-types):** `image/jpeg`, `image/jpg`, `image/png`, `image/webp`. Extensões aceitas: `.jpg`, `.jpeg`, `.png`, `.webp`.
  * **Nomeamento Seguro:** UUID v4 gerado no backend concatenado com a extensão sanitizada (ex: `post_2_d3b07384d113.jpg`) para evitar conflitos de arquivos com nomes iguais.
  * **Armazenamento:** Diretório local `backend/uploads/` (servido de forma transparente por `@feed_bp.route('/api/uploads/<filename>')`).

---

## 7. Mapeamento de Erros Completo

Mapeamos todos os erros do sistema garantindo uniformidade nas respostas em JSON e consistência no feedback visual no frontend React:

| Erro / Chave | HTTP Status | Code | Mensagem Técnica (Logs) | Mensagem Amigável (User Toast) | Exemplo JSON |
| :--- | :---: | :---: | :--- | :--- | :--- |
| **Descrição Vazia** | 400 | `INVALID_DESCRIPTION` | Descrição nula, vazia ou contendo apenas espaços. | Por favor, escreva algo antes de postar! 🌱 | `{"success": false, "error": "A descrição não pode estar vazia.", "code": "INVALID_DESCRIPTION", "status_code": 400}` |
| **Categoria Inválida** | 400 | `INVALID_CATEGORY` | Categoria de postagem não pertence à lista ecológica permitida. | Selecione uma categoria válida (Geral, Reciclagem, Água, etc.). | `{"success": false, "error": "Categoria ecológica inválida.", "code": "INVALID_CATEGORY", "status_code": 400}` |
| **Não Autenticado** | 401 | `UNAUTHORIZED` | `session.get('user_id')` é nulo ou expirado. | Você precisa estar autenticado para realizar esta ação. | `{"success": false, "error": "Autenticação requerida.", "code": "UNAUTHORIZED", "status_code": 401}` |
| **Sem Permissão** | 403 | `PERMISSION_DENIED` | Tentativa de editar/excluir post ou comentário de terceiros. | Você só pode gerenciar as suas próprias publicações! | `{"success": false, "error": "Você não tem permissão para editar/deletar este post.", "code": "PERMISSION_DENIED", "status_code": 403}` |
| **Post Inexistente** | 404 | `NOT_FOUND` | Publicação procurada não existe no SQLite. | Esta publicação foi excluída ou não existe. | `{"success": false, "error": "Publicação não encontrada.", "code": "NOT_FOUND", "status_code": 404}` |
| **Comentário Inexistente** | 404 | `COMMENT_NOT_FOUND` | Comentário procurado não existe. | Este comentário foi excluído ou não existe. | `{"success": false, "error": "Comentário não encontrado.", "code": "COMMENT_NOT_FOUND", "status_code": 404}` |
| **Curtida Duplicada** | 409 | `ALREADY_LIKED` | Registro de Like já existente no banco para o par (user_id, post_id). | Você já apoiou esta iniciativa ecológica! | `{"success": false, "error": "Você já curtiu esta publicação.", "code": "ALREADY_LIKED", "status_code": 409}` |
| **Arquivo Grande** | 413 | `FILE_TOO_LARGE` | Tamanho do arquivo binário excede 5242880 bytes. | Arquivo de imagem muito grande. O limite máximo é 5MB. | `{"success": false, "error": "O arquivo enviado excede o limite de 5MB.", "code": "FILE_TOO_LARGE", "status_code": 413}` |
| **Formato Inválido** | 415 | `INVALID_FILE_TYPE` | Extensão ou MIME-type de arquivo não pertence a JPG/PNG/WebP. | Tipo de imagem inválido. Use JPG, PNG ou WebP. | `{"success": false, "error": "Apenas extensões JPG, PNG e WebP são permitidas.", "code": "INVALID_FILE_TYPE", "status_code": 415}` |
| **Falha Interna** | 500 | `INTERNAL_ERROR` | Exceção inesperada levantada durante a transação do banco de dados. | Algo deu errado no servidor. Tente novamente mais tarde. | `{"success": false, "error": "Ocorreu um erro interno ao processar.", "code": "INTERNAL_ERROR", "status_code": 500}` |
