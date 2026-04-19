# rail-service

Monorepo NX con due package: `packages/backend` (Express + MongoDB) e `packages/frontend` (Angular 17 standalone).

## Comandi

```bash
npm run dev:backend       # nodemon su packages/backend
npm run dev:frontend      # ng serve su packages/frontend (porta 4200)
npm run deploy:frontend   # build + deploy CapRover (app: rail-service-client)
npm run deploy:backend    # build + deploy CapRover (app: rail-service-api)
```

## Backend — packages/backend

**Stack:** Express, Mongoose, ws (WebSocket), dotenv  
**Entry:** `src/index.ts`  
**ENV:** `PORT=3000`, `MONGODB_URI=mongodb://localhost:27017/rail-service`, `ADMIN_ACCESS_PASSWORD=rail-admin`

### API Routes (prefisso `/api`)

| Method | Path | Descrizione |
|--------|------|-------------|
| GET | `/tickets` | Lista ODL (esclusi cancelled) |
| POST | `/tickets` | Crea ODL |
| GET | `/tickets/:id` | Dettaglio ODL |
| PATCH | `/tickets/:id/cancel` | Annulla ODL |
| POST | `/tickets/:id/tasks` | Aggiungi task |
| PUT | `/tickets/:id/tasks/:taskId` | Aggiorna task |
| DELETE | `/tickets/:id/tasks/:taskId` | Elimina task |
| GET | `/technicians` | Lista tecnici (pubblica) |
| POST | `/auth/technician-login` | Login tecnico (nickname+matricola) |
| POST | `/auth/capoturno-login` | Login capoturno (nickname+matricola) |
| GET | `/dashboard` | Statistiche dashboard |
| GET/POST/PUT/DELETE | `/admin/technicians[/:id]` | CRUD tecnici (richiede `x-admin-password`) |
| GET/POST/PUT/DELETE | `/admin/capoturni[/:id]` | CRUD capoturni (richiede `x-admin-password`) |

### Modelli MongoDB

**Ticket** (`tickets`) — ODL con tasks embedded:
```
trainNumber, shift, codiceODL, status(pending|active|completed|cancelled), tasks[], openedAt, assignedTechnician
```
Task fields: `description, priority, assignedTechnicianId/Name/Nickname, status(aperta|in_progress|risolte|rimandato), timeSpentMinutes, performedBy[], deferredKey, deferredSince, deferredCount`

**Technician** (`technicians`) — `name, nickname, matricola (unique), team`  
**Capoturno** (`capoturni`) — `name, nickname, matricola (unique)`

**Seed automatico:** al primo avvio inserisce 3 tecnici e 2 capoturni se le collection sono vuote (`src/config/database.ts`).

**Nota:** `user.model.ts` e `train.model.ts` sono residui del progetto originale — non vengono usati.

## Frontend — packages/frontend

**Stack:** Angular 17 standalone, RxJS, HttpClient, exceljs  
**API base:** `http://localhost:3000/api` (dev) / `https://rail-service-api.vps.notifyapp.it/api` (prod)

### Struttura servizi chiave

| Service | Responsabilità |
|---------|---------------|
| `WorkOrderService` | Stato globale ODL + polling ogni 5s sull'ODL selezionato (`BehaviorSubject`). Usa `timer(0, 5000)+switchMap`. `selectWorkOrder()` cancella il polling precedente. `upsertInPlace()` preserva l'ordine della lista. |
| `TicketService` | HTTP CRUD verso `/tickets` e `/tickets/:id/tasks` |
| `TechnicianService` | GET `/technicians`, mappa `_id→id` |
| `AdminConfigService` | CRUD admin con header `x-admin-password`, mappa `_id→id` |
| `CapoturnoSessionService` | Sessione capoturno in localStorage |
| `AuthService` | Login tecnico/capoturno |

### Routing

| Path | Componente |
|------|-----------|
| `/` | `DashboardComponent` (vista principale ODL+tasks) |
| `/tickets` | `TicketsComponent` |
| `/admin` | `AdminComponent` |

### Convenzioni

- Risposta API sempre `{ data: T }` (backend) / `response.data` (frontend)
- `WorkOrder.id` = `ticket._id` (stringa MongoDB)
- Task `status rimandato` = task differita; gestita con `deferredKey` per propagarla tra ODL dello stesso treno
- `newTaskForm` si resetta solo al cambio di ODL (non ad ogni tick di polling)
- ngFor sulle liste ODL usa `trackBy: trackByOrderId` per stabilità DOM
- I controller backend con operazioni MongoDB sono tutti `async/await`

### View mode

L'app ha tre modalità (`capoturno | tecnico | admin`) gestite in `app.component.ts`. Il capoturno vede la sidebar ODL + dashboard. Il tecnico vede i propri task assegnati.
