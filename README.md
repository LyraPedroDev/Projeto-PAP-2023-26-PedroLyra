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
├── package.json
└── README.md
```

## Como executar

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

## Utilizadores de teste

O backend cria utilizadores de teste automaticamente:

- `teste@eco.com` / `123456`
- `maria@email.com` / `123456`
- `joao@email.com` / `123456`
- `ana@email.com` / `123456`
- `pedro@gmail.com` / `123456`

## Notas

- o projeto usa SQLite local no backend
- o ficheiro de base de dados é criado localmente na pasta `backend`
- `node_modules`, `venv`, caches e ficheiros gerados não devem ser versionados
- este repositório foi limpo para refletir a estrutura atual da aplicação

## Autor

Pedro Lyra  
Projeto de Aptidão Profissional (PAP)
