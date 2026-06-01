import os

basedir = os.path.abspath(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
db_path = os.path.abspath(os.path.join(basedir, 'ecochat.db'))

class Config:
    SECRET_KEY = 'ecochat-pap-2026-pedro-lyra-secret-key'
    MAX_CONTENT_LENGTH = 16 * 1024 * 1024  # 16MB max

    SQLALCHEMY_DATABASE_URI = f"sqlite:///{db_path}"
    SQLALCHEMY_TRACK_MODIFICATIONS = False

    UPLOAD_FOLDER = os.path.abspath(os.path.join(basedir, 'uploads'))
    ALLOWED_EXTENSIONS = {'png', 'jpg', 'jpeg', 'gif', 'webp'}

    # Garantir que o cookie de sessão viaja em pedidos cross-origin (dev)
    SESSION_COOKIE_SAMESITE = 'Lax'
    SESSION_COOKIE_SECURE = False       # True apenas em HTTPS/produção
    SESSION_COOKIE_HTTPONLY = True
