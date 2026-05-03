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
SEED_ADMIN_EMAIL=admin@gymprime.com
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

- Email: `admin@gymprime.com`
- Senha: `admin123456`

O seed tambem cria produtos, variantes e estoque inicial de demonstracao. Ele pode ser executado mais de uma vez sem duplicar dados.

## Endpoints administrativos principais

- `GET /admin/analytics/summary`: KPIs, pedidos recentes, estoque baixo e produtos mais vendidos.
- `GET /admin/analytics/sales-series?period=hour|day|week|month`: serie real de vendas para o grafico administrativo.
- `GET /admin/customers`: clientes com CPF mascarado e totais agregados.
- `GET /admin/settings` e `PATCH /admin/settings`: configuracoes operacionais persistidas.
- `PATCH /orders/{order_id}/status`: alteracao administrativa de status do pedido.

Endpoints admin exigem cookie de usuario administrador. O cliente usa `GET /orders/me` para ver apenas os proprios pedidos, e Cliente/Totem usam `GET /settings/public` para configuracoes publicas.
