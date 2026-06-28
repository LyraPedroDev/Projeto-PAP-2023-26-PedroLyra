# EcoChat

EcoChat é uma aplicação web gamificada sobre sustentabilidade, criada para a PAP, que junta missões ecológicas, perfil de utilizador, ranking, feed social, amizades, mensagens privadas e uma área administrativa.

## Funcionalidades atuais

- autenticação com login, registo e sessão
- perfil com estatísticas, streak, pontos e nível
- missões diárias, semanais e mensais
- ranking global
- sistema de amigos
- feed social com publicações, likes e comentários
- mensagens privadas em tempo real
- chatbot com dicas sustentáveis
- área administrativa
- tema claro/escuro

## Tecnologias

### Backend

- Python
- Flask
- SQLAlchemy
- SQLite
- Flask-CORS
- Flask-SocketIO

### Frontend

- React
- TypeScript
- Vite
- Motion
- Radix UI
- Sonner

## Estrutura principal

```text
Projeto-PAP-2023-26-PedroLyra/
├── backend/
│   ├── app/
│   │   ├── models/
│   │   ├── routes/
│   │   ├── services/
│   │   └── sockets/
│   ├── app.py
│   ├── requirements.txt
│   └── wsgi.py
├── frontend/
│   ├── public/
│   ├── src/
│   │   ├── components/
│   │   ├── services/
│   │   ├── styles/
│   │   ├── App.tsx
│   │   └── main.tsx
│   ├── package.json
│   └── vite.config.ts
├── run-ecochat.bat
└── README.md
```

## Como executar

### Arranque rapido no Windows

```bat
run-ecochat.bat
```

Esse ficheiro abre backend e frontend em duas janelas, mas com um unico comando a partir da raiz do projeto.

### Backend

```bash
cd backend
python -m venv venv
venv\Scripts\activate
pip install -r requirements.txt
python app.py
```

O backend fica disponível em `http://localhost:5000`.

### Frontend

```bash
cd frontend
npm install
npm run dev
```

O frontend abre normalmente em `http://localhost:5173`.

## Utilizadores de demonstração

O backend pode criar automaticamente utilizadores de demonstração quando a base de dados é recriada:

- `gabriel@gmail.com` / `123456`
- `carla@gmail.com` / `123456`
- `pedro@gmail.com` / `123456`
- `admin@ecochat.com` / `123456`

## Notas técnicas relevantes

- a autenticação do utilizador baseia-se em sessão e cookies HTTP-only
- as operações principais do utilizador autenticado usam o utilizador da sessão no backend
- o frontend envia `credentials: include` para manter a sessão nas rotas protegidas
- a área administrativa continua separada e protegida por permissão de administrador

## Notas

- em producao, configure `DATABASE_URL` com uma base de dados persistente, por exemplo PostgreSQL no Render
- para guardar imagens de publicacoes em producao, configure `ECOCHAT_UPLOAD_FOLDER` para uma pasta em disco persistente ou use um servico externo de ficheiros
- o projeto usa SQLite local no backend
- o ficheiro de base de dados é criado localmente na pasta `backend`
- `node_modules`, `venv`, caches e ficheiros gerados não devem ser versionados
- este repositório foi limpo para refletir a estrutura atual da aplicação

## Autor

Pedro Lyra  
Projeto de Aptidão Profissional (PAP)
