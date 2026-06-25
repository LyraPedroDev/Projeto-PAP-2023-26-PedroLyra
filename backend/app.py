import os

from app import create_app
from app.extensions import socketio

app = create_app()

if __name__ == '__main__':
    socketio.run(app, debug=os.environ.get('FLASK_DEBUG') == '1', host='localhost', port=5000,
                 allow_unsafe_werkzeug=True)
