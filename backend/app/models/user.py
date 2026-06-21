from ..extensions import db


class Usuario(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    nome = db.Column(db.String(120))
    email = db.Column(db.String(120), unique=True, nullable=False)
    senha = db.Column(db.String(200), nullable=False)
    is_admin = db.Column(db.Boolean, default=False, nullable=False)


class UserStats(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey("usuario.id"), nullable=False, unique=True)
    pontos = db.Column(db.Integer, default=0)
    tarefas_completas = db.Column(db.Integer, default=0)
    dias_ativos = db.Column(db.Integer, default=0)
    nivel = db.Column(db.String(50), default="Eco Iniciante")
    streak_atual = db.Column(db.Integer, default=0)
    ultima_missao = db.Column(db.Date, nullable=True)
    ultimo_acesso = db.Column(db.DateTime, default=db.func.current_timestamp())
