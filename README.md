# Gym Prime

Sistema local para pedidos da lanchonete da academia.

## Como rodar

```bash
docker compose up -d
```

Servicos locais:

- Frontend: `http://localhost:5173`
- Totem: `http://localhost:5173/totem`
- Admin: `http://localhost:5173/admin`
- Backend: `http://localhost:8000`
- MinIO Console: `http://localhost:9001`

## Seed local

Para criar dados de demonstracao, configure o admin no `.env` do backend ou exporte as variaveis antes de rodar:

```bash
SEED_ADMIN_EMAIL=admin@gymprime.local
SEED_ADMIN_PASSWORD=admin123456
SEED_ADMIN_NAME="Admin Gym Prime"
SEED_ADMIN_CPF=00000000000
```

Depois execute:

```bash
cd backend
uv run python seed.py
```

Credenciais locais sugeridas:

- Email: `admin@gymprime.local`
- Senha: `admin123456`

O seed tambem cria produtos, variantes e estoque inicial de demonstracao. Ele pode ser executado mais de uma vez sem duplicar dados.
