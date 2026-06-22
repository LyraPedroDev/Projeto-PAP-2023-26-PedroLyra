import os

from app import create_app
from app.extensions import socketio

app = create_app()

if __name__ == '__main__':
    print("\n🌱 EcoChat Backend rodando!")
    print("📍 Acesse: http://localhost:5000")
    print("\n👥 Usuários de teste:")
    print("   - teste@eco.com / 123456")
    print("   - maria@email.com / 123456")
    print("   - joao@email.com / 123456")
    print("   - ana@email.com / 123456")
    print("   - pedro@gmail.com / 123456")
    print("💬 Chat privado em tempo real ativado (Socket.IO)!")
    # host='localhost' para consistência com o frontend
    socketio.run(app, debug=os.environ.get('FLASK_DEBUG') == '1', host='localhost', port=5000,
                 allow_unsafe_werkzeug=True)
