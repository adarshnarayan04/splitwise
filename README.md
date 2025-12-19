# Expense Sharing Service (TypeScript + Prisma/Postgres + JWT + Mailer)

TypeScript Express API backed by Prisma (PostgreSQL), with JWT auth and email notifications. Uses integer cents for accuracy.

Base Url : https://splitwise-o2cz.onrender.com

can test it using this hosted link

## Setup

```sh
npm install
npm run db:generate
npm run db:push
npm run build
npm start      # or: npm run dev (tsx watch)
```

Environment (dummy defaults in `.env`):

- `DATABASE_URL` (default `postgresql://postgres:postgres@localhost:5432/splitwise`)
- `JWT_SECRET` (replace with a strong secret)
- `PORT` (default 3000)
- `SMTP_HOST` / `SMTP_PORT` / `SMTP_USER` / `SMTP_PASS` / `SMTP_FROM` (dummy Mailtrap-style defaults)

## Core endpoints

- `POST /auth/signup` `{ email, password, name }` → `{ token, user }`
- `POST /auth/login` `{ email, password }` → `{ token, user }`
- `POST /groups` create a group `{ name, currency, members?: [{ userId, role }] }` (auth)
- `POST /groups/:id/members` add a member `{ userId, role? }` (auth)
- `POST /groups/:id/expenses` create expense with split strategies (auth, email notifications to participants)
- `GET /groups/:id/balances` simplified transfers and per-user net (auth)
- `POST /groups/:id/settlements` record a payment `{ fromUserId, toUserId, amountCents }` (auth, email notification to parties)
- `GET /groups/:id/ledger` list expenses and settlements (auth)
- `GET /groups/:id` group detail (auth)
- `GET /health` liveness

## Example flow (cURL)

```sh
# 0) Sign up and grab token
TOKEN=$(curl -s -X POST http://localhost:3000/auth/signup \
  -H 'Content-Type: application/json' \
  -d '{"email":"a@example.com","password":"secret","name":"Alice"}' | jq -r .token)

# 1) Create group
curl -X POST http://localhost:3000/groups \
  -H "Authorization: Bearer $TOKEN" \
  -H 'Content-Type: application/json' \
  -d '{"name":"Trip","currency":"USD","members":[{"userId":"u2"},{"userId":"u3"}]}'

# 2) Add an equal expense
curl -X POST http://localhost:3000/groups/<GROUP_ID>/expenses \
  -H "Authorization: Bearer $TOKEN" \
  -H 'Content-Type: application/json' \
  -d '{"description":"Dinner","totalCents":6000,"paidByUserId":"<USER_ID>","splitType":"EQUAL","participants":["<USER_ID>","u2","u3"]}'

# 3) View balances (includes simplified transfers)
curl -H "Authorization: Bearer $TOKEN" http://localhost:3000/groups/<GROUP_ID>/balances

# 4) Record a settlement
curl -X POST http://localhost:3000/groups/<GROUP_ID>/settlements \
  -H "Authorization: Bearer $TOKEN" \
  -H 'Content-Type: application/json' \
  -d '{"fromUserId":"u2","toUserId":"u1","amountCents":2000}'
```

## Split payloads

- Equal: `splitType: "EQUAL", participants: [userIds]`
- Exact: `splitType: "EXACT", exactShares: [{ userId, amountCents }]`
- Percent: `splitType: "PERCENT", percentages: [{ userId, percent }]` (must sum to 100)
- Multi-payer (optional): `paidByShares: [{ userId, amountCents }]` (must sum to `totalCents`), otherwise use `paidByUserId`.

## Notifications

- Emails are sent (best-effort) via nodemailer. Configure SMTP env vars; defaults use Mailtrap-style placeholders so nothing is sent until you set real credentials.

## Notes

- Storage uses PostgreSQL per `DATABASE_URL`.
- Amounts are integer cents to avoid float errors.
- Balance simplification uses a greedy min-cashflow heuristic with deterministic tie-breaking.
