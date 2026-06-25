import os
from flask import Flask
from .config import Config
from .extensions import db, cors, socketio


def create_app(config_class=Config) -> Flask:
    root_dir = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
    dist_dir = os.path.join(root_dir, 'frontend', 'dist')
    build_dir = os.path.join(root_dir, 'frontend', 'build')
    frontend_dir = dist_dir if os.path.isdir(dist_dir) else build_dir

    app = Flask(__name__,
                static_folder=frontend_dir,
                template_folder=frontend_dir,
                static_url_path='/')
    app.config.from_object(config_class)

    from .auth_tokens import load_user_from_token
    app.before_request(load_user_from_token)

    # Garantir que a pasta de uploads existe
    os.makedirs(app.config['UPLOAD_FOLDER'], exist_ok=True)

    # ── Extensions ────────────────────────────────────────────────
    db.init_app(app)
    cors.init_app(app,
                  supports_credentials=True,
                  resources={r"/api/*": {"origins": app.config['ALLOWED_ORIGINS']}})

    socketio.init_app(app,
                      cors_allowed_origins=app.config['ALLOWED_ORIGINS'],
                      async_mode=None,
                      manage_session=False,
                      logger=bool(app.debug),
                      engineio_logger=bool(app.debug))

    # ── Blueprints ────────────────────────────────────────────────
    from .routes.auth import auth_bp
    from .routes.feed import feed_bp
    from .routes.friends import friends_bp
    from .routes.tasks import tasks_bp
    from .routes.ranking import ranking_bp
    from .routes.profile import profile_bp
    from .routes.chat import chat_bp
    from .routes.stats import stats_bp
    from .routes.private_chat import private_chat_bp
    from .routes.admin import admin_bp

    app.register_blueprint(auth_bp)
    app.register_blueprint(feed_bp)
    app.register_blueprint(friends_bp)
    app.register_blueprint(tasks_bp)
    app.register_blueprint(ranking_bp)
    app.register_blueprint(profile_bp)
    app.register_blueprint(chat_bp)
    app.register_blueprint(stats_bp)
    app.register_blueprint(private_chat_bp)
    app.register_blueprint(admin_bp)

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

    # ── Servir o Frontend (React/Vite) ─────────────────────────────
    from flask import send_from_directory, jsonify

    @app.route('/', defaults={'path': ''})
    @app.route('/<path:path>')
    def serve(path):
        if not app.static_folder or not os.path.isdir(app.static_folder):
            return jsonify({
                "success": False,
                "error": "Frontend não compilado.",
                "code": "FRONTEND_NOT_BUILT",
                "status_code": 503
            }), 503
        if path != "" and os.path.exists(os.path.join(app.static_folder, path)):
            return send_from_directory(app.static_folder, path)
        if path.startswith("api/") or path.startswith("uploads/"):
            return jsonify({
                "success": False,
                "error": "Recurso não encontrado",
                "code": "NOT_FOUND",
                "status_code": 404
            }), 404
        return send_from_directory(app.static_folder, 'index.html')

    return app
