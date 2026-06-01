import os
from flask import Flask
from .config import Config
from .extensions import db, cors, socketio


def create_app(config_class=Config) -> Flask:
    app = Flask(__name__)
    app.config.from_object(config_class)

    # Garantir que a pasta de uploads existe
    os.makedirs(app.config['UPLOAD_FOLDER'], exist_ok=True)

    # ── Extensions ────────────────────────────────────────────────
    db.init_app(app)
    cors.init_app(app,
                  supports_credentials=True,
                  origins=[
                      'http://localhost:3000',
                      'http://127.0.0.1:3000',
                      'http://localhost:5173',
                      'http://127.0.0.1:5173',
                  ])

    socketio.init_app(app,
                      cors_allowed_origins=[
                          'http://localhost:3000',
                          'http://127.0.0.1:3000',
                          'http://localhost:5173',
                          'http://127.0.0.1:5173',
                      ],
                      async_mode=None,
                      manage_session=False,
                      logger=True,
                      engineio_logger=True)

    # ── Blueprints ────────────────────────────────────────────────
    from .routes.auth import auth_bp
    from .routes.feed import feed_bp
    from .routes.friends import friends_bp
    from .routes.tasks import tasks_bp
    from .routes.ranking import ranking_bp
    from .routes.profile import profile_bp
    from .routes.ecoreal import ecoreal_bp
    from .routes.chat import chat_bp
    from .routes.stats import stats_bp
    from .routes.private_chat import private_chat_bp

    app.register_blueprint(auth_bp)
    app.register_blueprint(feed_bp)
    app.register_blueprint(friends_bp)
    app.register_blueprint(tasks_bp)
    app.register_blueprint(ranking_bp)
    app.register_blueprint(profile_bp)
    app.register_blueprint(ecoreal_bp)
    app.register_blueprint(chat_bp)
    app.register_blueprint(stats_bp)
    app.register_blueprint(private_chat_bp)

    # ── Socket.IO events ──────────────────────────────────────────
    # Importar aqui para registar os handlers (efeito colateral intencional)
    from .sockets import chat_events  # noqa: F401

    # ── Error handlers ────────────────────────────────────────────
    from .errors import register_error_handlers
    register_error_handlers(app)

    # ── DB + seed ─────────────────────────────────────────────────
    with app.app_context():
        from .models import init_db
        init_db()

    return app
