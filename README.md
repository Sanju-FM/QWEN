# ◆ Project QHSE Plan — KEZAD Mamourah · Web App

A production-ready Next.js 14 application that turns the **KEZAD Mamourah External FM Services QHSE mind map** into an interactive, editable, exportable and event-driven planning tool.

| Feature | Where |
|---|---|
| 📊 KPI Dashboard (status mix, section progress, overdue items, recent activity) | `/` |
| 🧠 Interactive ReactFlow mind map + inline node editor | `/tree` |
| 📝 Node detail pages (deep-linkable) | `/nodes/[id]` |
| 📤 Export Centre — PDF / Excel / CSV / JSON + server endpoints | `/export` |
| 🔌 Webhook Manager — CRUD, test-fire, delivery log, HMAC signing | `/webhooks` |
| 🌐 REST API — nodes, webhooks, exports, manual triggers | `/api/*` |

Zero-config demo mode: everything persists in your browser (localStorage). A production Prisma/PostgreSQL schema is included for real deployments.

---

## 1. Quick start

```bash
npm install
npm run dev          # http://localhost:3000
```

Other scripts:

```bash
npm run build        # production build (verified passing)
npm run start        # serve the production build
npm run typecheck    # tsc --noEmit
```

Routes once running:

- `http://localhost:3000/` → **Dashboard**
- `http://localhost:3000/tree` → **Interactive mind map**
- `http://localhost:3000/export` → **Export Centre**
- `http://localhost:3000/webhooks` → **Webhook Manager**

---

## 2. Build stack

| Layer | Technology | Notes |
|---|---|---|
| Framework | Next.js 14 (App Router) | SSR + API routes in one repo |
| Language | TypeScript (strict) | Shared model in `src/types/qhse.ts` |
| Styling | Tailwind CSS | Dark theme, reusable `.btn/.card/.input` classes in `globals.css` |
| Tree viz | `reactflow` v11 | Custom recursive layout, zoom/minimap/controls |
| DB (demo) | localStorage (`src/lib/db.ts`) | Seed tree = your full mind map (`src/lib/seed-data.ts`) |
| DB (prod) | PostgreSQL + Prisma | `prisma/schema.prisma` — ready to migrate |
| Export | `jspdf`, `xlsx`, `papaparse` | Client-side downloads + server `/api/export` |
| Webhooks | `src/lib/webhook-runner.ts` | Retries (3×, backoff), HMAC-SHA256 signatures, delivery log |

---

## 3. Project structure

```
kezad-qhse-app/
├── prisma/
│   └── schema.prisma              # production PostgreSQL schema
├── src/
│   ├── app/
│   │   ├── layout.tsx             # shell + top navigation
│   │   ├── page.tsx               # 📊 Dashboard (KPIs, progress, activity)
│   │   ├── tree/page.tsx          # 🧠 Mind map
│   │   ├── nodes/[id]/page.tsx    # 📝 Node detail
│   │   ├── export/page.tsx        # 📤 Export Centre
│   │   ├── webhooks/page.tsx      # 🔌 Webhook Manager
│   │   └── api/
│   │       ├── nodes/route.ts         # GET/POST tree nodes
│   │       ├── webhooks/route.ts      # dispatch events
│   │       ├── export/route.ts        # ?format=csv|json downloads
│   │       └── trigger/[id]/route.ts  # manual webhook test
│   ├── components/
│   │   ├── tree/                  # MindMap, TreeView, NodeEditor, NodeDetail
│   │   ├── webhooks/              # WebhookForm, WebhookList, WebhookLog
│   │   └── ui/StatusBadge.tsx
│   ├── lib/
│   │   ├── db.ts                  # localStorage persistence + tree utilities
│   │   ├── notify.ts              # client dispatcher (writes delivery log)
│   │   ├── webhook-runner.ts      # retries, HMAC signing, fan-out
│   │   ├── seed-data.ts           # your mind map pre-loaded
│   │   └── exporters/             # pdf.ts excel.ts csv.ts json.ts
│   └── types/qhse.ts              # QHSENode / Webhook / log models
├── package.json
├── tailwind.config.ts
└── next.config.js
```

---

## 4. Data model

```ts
type NodeStatus = 'draft' | 'active' | 'review' | 'closed';

interface QHSENode {
  id: string; parentId: string | null; title: string;
  description?: string; owner?: string; dueDate?: string;
  status: NodeStatus; evidence?: string[]; notes?: string;
  children: QHSENode[]; updatedAt: string;
}

type WebhookEvent = 'node.updated' | 'node.created' | 'export.done' | 'incident.reported';

interface Webhook {
  id: string; name: string; url: string; secret?: string;
  events: WebhookEvent[]; active: boolean;
  lastTriggered?: string; failureCount: number;
}
```

The seeded tree mirrors the plan: **Introduction & Scope · QHSE Management System · Roles & Responsibilities · Communication & Training · Planning & Risk Management · Implementation & Operations · Monitoring & Review**.

---

## 5. Pages

### Dashboard (`/`)
Client-hydrated overview of the live tree: total nodes, per-status counts, overdue actions (due date passed & not closed), owner coverage, status distribution bars, per-section closure progress, and a “recently updated” table linking into each node.

### Mind Map (`/tree`)
ReactFlow canvas with recursive tidy layout, colour-coded statuses, drag/zoom/minimap. Selecting a node opens the editor: title, description, owner, due date, status, notes, evidence links, add/delete children. Every mutation saves to localStorage and fans out `node.updated` / `node.created` webhooks.

### Export Centre (`/export`)
One-click **PDF** (formatted outline for sign-off), **Excel** (one row per node with breadcrumb path), **CSV** (Power BI/Zapier friendly) and **JSON** (lossless backup). Each export fires the `export.done` webhook event and shows session history. Server-side equivalents: `GET /api/export?format=json|csv`.

### Webhook Manager (`/webhooks`)
Add/edit/delete hooks, subscribe per event, pause/resume, optional signing secret, **Test** button (force-delivers and updates `lastTriggered`/`failureCount`), and a rolling delivery log (last 100 attempts with HTTP status/errors). Integration recipes included for Slack, MS Teams, Zapier/Make, Power BI and custom APIs.

---

## 6. Webhooks

Delivery behaviour (`src/lib/webhook-runner.ts`):

- POST JSON to every active hook subscribed to the event
- Up to **3 attempts** with 500 ms / 1.5 s backoff; 4xx treated as permanent
- Optional **HMAC-SHA256** signature header `X-Webhook-Signature` (hex of body, keyed by `secret`)
- Headers: `Content-Type: application/json`, `X-Webhook-Id`, `User-Agent: kezad-qhse-app/1.0`

Payload example:

```json
{
  "event": "node.updated",
  "timestamp": "2026-10-15T12:00:00.000Z",
  "nodeId": "impl-1",
  "node": { "title": "Permit To Work (PTW) System", "status": "active" },
  "metadata": { "changedBy": "hse.officer@kezad.ae" }
}
```

Manual test from the terminal:

```bash
curl -X POST http://localhost:3000/api/trigger/<hookId> \
  -H 'Content-Type: application/json' \
  -d '{"hooks":[{"id":"<hookId>","name":"test","url":"https://example.com/hook","events":["node.updated"],"active":true,"failureCount":0}],"event":"node.updated"}'
```

---

## 7. Going to production (Prisma + PostgreSQL)

1. Point at a database and validate the shipped schema:

   ```bash
   npm i @prisma/client && npm i -D prisma
   echo 'DATABASE_URL="postgresql://user:pass@host:5432/kezad_qhse?schema=public"' > .env
   npx prisma migrate dev --name init
   ```

2. Swap the demo layer for Prisma calls (shapes are identical):
   - `src/lib/db.ts` → `db.qHSENode.findMany()` etc.
   - `src/app/api/webhooks/route.ts` → load hooks server-side instead of trusting the request body
   - `src/app/api/export/route.ts` → build the tree from the DB and record `ExportRecord`

3. Optional auth: enable NextAuth.js with the `User`/`Role` models already present in the schema (Admin / HSE Officer / Viewer).

Schema highlights (`prisma/schema.prisma`): self-referential `QHSENode` tree with cascade delete + indexes on status/owner/dueDate, `Webhook` + `DeliveryLog`, `Incident`, `ExportRecord`, `AuditLog`, and `User`/`Role` for RBAC.

---

## 8. Deploy options

### 8.1 Vercel (recommended)

```bash
npm i -g vercel
vercel        # preview
vercel --prod # production
```

Framework preset *Next.js* is auto-detected. Add `DATABASE_URL` (and `NEXTAUTH_SECRET` if enabling auth) under Project → Settings → Environment Variables, then run `npx prisma migrate deploy` in the build command or CI.

### 8.2 Netlify

```bash
npm i -g netlify-cli
netlify deploy --build          # draft
netlify deploy --build --prod   # publish
```

- Build command: `npm run build` · Publish dir handled by the Next.js runtime
- Install `netlify-plugin-nextjs` (or use built-in Next.js support) and set env vars in the site dashboard.
- API routes deploy as Netlify functions; keep secrets (webhook signing keys, DB URL) in Netlify environment variables — never in the client bundle.

### 8.3 Docker (self-host)

```dockerfile
FROM node:20-alpine AS deps
WORKDIR /app
COPY package*.json ./
RUN npm ci

FROM node:20-alpine AS build
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
ENV NEXT_TELEMETRY_DISABLED=1
RUN npm run build

FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production NEXT_TELEMETRY_DISABLED=1
COPY --from=build /app/.next ./.next
COPY --from=build /app/public ./public
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/package.json ./package.json
EXPOSE 3000
CMD ["npm", "run", "start"]
```

```bash
docker build -t kezad-qhse-app .
docker run -p 3000:3000 --env-file .env kezad-qhse-app
```

---

## 9. Demo data reset

All state lives under these localStorage keys — clear them (DevTools → Application → Local Storage) or call `resetTree()` in `src/lib/db.ts` to restore the seeded mind map:

```
kezad-qhse:tree:v1
kezad-qhse:webhooks:v1
kezad-qhse:webhook-log:v1
```

---

KEZAD Mamourah External FM Services · QHSE Management System · ISO 45001 / 14001 / 9001 aligned documentation hierarchy.
