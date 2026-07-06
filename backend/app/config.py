import os

basedir = os.path.abspath(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
db_path = os.path.abspath(os.path.join(basedir, 'ecochat.db'))


def normalize_database_url(url):
    if not url:
        return f"sqlite:///{db_path}"
    if url.startswith("postgres://"):
        return url.replace("postgres://", "postgresql://", 1)
    return url

class Config:
    SECRET_KEY = os.environ.get('ECOCHAT_SECRET_KEY', 'ecochat-dev-change-this-key')
    MAX_CONTENT_LENGTH = 16 * 1024 * 1024  # 16MB max
    ACCESS_TOKEN_MAX_AGE = 15 * 60
    REFRESH_TOKEN_MAX_AGE = 7 * 24 * 60 * 60

    SQLALCHEMY_DATABASE_URI = normalize_database_url(os.environ.get('DATABASE_URL'))
    SQLALCHEMY_TRACK_MODIFICATIONS = False

    UPLOAD_FOLDER = os.path.abspath(
        os.environ.get('ECOCHAT_UPLOAD_FOLDER', os.path.join(basedir, 'uploads'))
    )
    ALLOWED_EXTENSIONS = {'png', 'jpg', 'jpeg', 'gif', 'webp'}

    # Garantir que o cookie de sessão viaja em pedidos cross-origin (dev)
    SESSION_COOKIE_SAMESITE = 'Lax'
    SESSION_COOKIE_SECURE = False       # True apenas em HTTPS/produção
    SESSION_COOKIE_HTTPONLY = True
    TOKEN_COOKIE_SECURE = os.environ.get('ECOCHAT_HTTPS', '0') == '1'
    ALLOWED_ORIGINS = [
        origin.strip()
        for origin in os.environ.get(
            'ECOCHAT_ALLOWED_ORIGINS',
            '*'
        ).split(',')
        if origin.strip()
    ]
