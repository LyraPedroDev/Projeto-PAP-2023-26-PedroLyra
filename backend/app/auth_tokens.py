from functools import wraps

from flask import current_app, g, jsonify, request, session
from itsdangerous import BadSignature, SignatureExpired, URLSafeTimedSerializer

from .models.user import Usuario


ACCESS_COOKIE = 'ecochat_access'
REFRESH_COOKIE = 'ecochat_refresh'


def _serializer(salt: str) -> URLSafeTimedSerializer:
    return URLSafeTimedSerializer(current_app.config['SECRET_KEY'], salt=salt)


def create_access_token(user: Usuario) -> str:
    return _serializer('access-token').dumps({
        'user_id': user.id,
        'is_admin': bool(user.is_admin),
        'type': 'access',
    })


def create_refresh_token(user: Usuario) -> str:
    return _serializer('refresh-token').dumps({
        'user_id': user.id,
        'type': 'refresh',
    })


def decode_token(token: str, token_type: str):
    if not token:
        return None
    max_age = (
        current_app.config['ACCESS_TOKEN_MAX_AGE']
        if token_type == 'access'
        else current_app.config['REFRESH_TOKEN_MAX_AGE']
    )
    try:
        data = _serializer(f'{token_type}-token').loads(token, max_age=max_age)
        return data if data.get('type') == token_type else None
    except (BadSignature, SignatureExpired):
        return None


def set_auth_cookies(response, user: Usuario):
    secure = current_app.config['TOKEN_COOKIE_SECURE']
    response.set_cookie(
        ACCESS_COOKIE, create_access_token(user),
        max_age=current_app.config['ACCESS_TOKEN_MAX_AGE'],
        httponly=True, secure=secure, samesite='Lax', path='/',
    )
    response.set_cookie(
        REFRESH_COOKIE, create_refresh_token(user),
        max_age=current_app.config['REFRESH_TOKEN_MAX_AGE'],
        httponly=True, secure=secure, samesite='Lax', path='/api/auth',
    )
    return response


def clear_auth_cookies(response):
    response.delete_cookie(ACCESS_COOKIE, path='/')
    response.delete_cookie(REFRESH_COOKIE, path='/api/auth')
    return response


def load_user_from_token():
    g.current_user = None
    data = decode_token(request.cookies.get(ACCESS_COOKIE), 'access')
    if not data:
        return
    try:
        user = Usuario.query.get(int(data.get('user_id')))
    except (TypeError, ValueError):
        user = None
    if user:
        g.current_user = user
        session['user_id'] = user.id


def current_user():
    return getattr(g, 'current_user', None)


def login_required(view):
    @wraps(view)
    def wrapped(*args, **kwargs):
        if not current_user():
            return jsonify({'erro': 'Sessão expirada', 'code': 'TOKEN_EXPIRED'}), 401
        return view(*args, **kwargs)
    return wrapped


def admin_required(view):
    @wraps(view)
    def wrapped(*args, **kwargs):
        user = current_user()
        if not user:
            return jsonify({'erro': 'Sessão expirada', 'code': 'TOKEN_EXPIRED'}), 401
        if not user.is_admin:
            return jsonify({'erro': 'Acesso reservado a administradores'}), 403
        return view(*args, **kwargs)
    return wrapped
