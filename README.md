# Notes App

A private, full-stack notes application. Users register, log in, and manage their own notes (create, read, update, delete, search). Built with React, Express, MongoDB and JWT authentication.

## Tech stack

| Layer    | Technology                                                                 |
| -------- | -------------------------------------------------------------------------- |
| Frontend | React 18, Vite, React Router (plain CSS, no UI framework)                  |
| Backend  | Node.js, Express, Mongoose, JSON Web Tokens, bcrypt, Zod, Helmet, CORS     |
| Database | MongoDB                                                                    |
| Tests    | Node's built-in test runner + Supertest (backend), Postman collection      |

## Features

- Register, log in, log out; session restored on page reload
- Create, edit, delete and search notes
- Responsive sidebar, profile dropdown with logout
- Create/edit modal, delete confirmation dialog, toast notifications
- Loading skeletons, empty state with "Create Your First Note"
- Keyboard accessible (native `<dialog>`, focus rings, Escape to close, `aria-*` attributes), reduced-motion support

## Folder structure

```
notes-app/
├── backend/
│   ├── src/
│   │   ├── config/        env loading + DB connection
│   │   ├── models/        Mongoose schemas (User, Note)
│   │   ├── controllers/   request handlers (auth, notes)
│   │   ├── routes/        route definitions
│   │   ├── middleware/    auth guard, validation, error handling
│   │   ├── validators/    Zod schemas
│   │   ├── utils/         ApiError, asyncHandler, token helper
│   │   ├── app.js         Express app (no listen, so tests can import it)
│   │   └── server.js      DB connect + listen
│   ├── tests/             auth, notes, persistence tests
│   └── .env.example
├── frontend/
│   ├── src/
│   │   ├── api/           fetch client + auth/notes API modules
│   │   ├── context/       AuthContext, ToastContext
│   │   ├── hooks/         useNotes, useDebouncedValue
│   │   ├── components/    reusable UI components
│   │   ├── pages/         LoginPage, RegisterPage, NotesPage
│   │   ├── utils/         validation, date formatting
│   │   └── styles/        index.css
│   └── .env.example
├── postman/               Postman collection
├── CHECKLIST.md           tasks for you to complete before submitting
└── README.md
```

## Prerequisites

- Node.js 20 or newer
- MongoDB running locally (`mongodb://127.0.0.1:27017`) or a MongoDB Atlas connection string

## Setup and startup

### 1. Backend

```bash
cd backend
npm install
cp .env.example .env        # Windows PowerShell: Copy-Item .env.example .env
```

Open `backend/.env` and set `JWT_SECRET` to a long random value. Generate one with:

```bash
node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"
```

Start the API:

```bash
npm run dev                 # auto-restarts on change
# or
npm start
```

The API runs at `http://localhost:5000`. Check `http://localhost:5000/api/health`.

### 2. Frontend (in a second terminal)

```bash
cd frontend
npm install
cp .env.example .env
npm run dev
```

Open `http://localhost:5173`.

### Environment variables

`backend/.env`

| Variable         | Description                                              | Example                                |
| ---------------- | -------------------------------------------------------- | -------------------------------------- |
| `PORT`           | API port                                                 | `5000`                                 |
| `NODE_ENV`       | `development` or `production`                            | `development`                          |
| `MONGODB_URI`    | MongoDB connection string                                | `mongodb://127.0.0.1:27017/notes_app`  |
| `JWT_SECRET`     | Secret used to sign tokens. Required. Never commit it.   | long random string                     |
| `JWT_EXPIRES_IN` | Token lifetime                                           | `7d`                                   |
| `CLIENT_ORIGIN`  | Allowed CORS origin(s), comma separated                  | `http://localhost:5173`                |

`frontend/.env`

| Variable       | Description  | Example                     |
| -------------- | ------------ | --------------------------- |
| `VITE_API_URL` | API base URL | `http://localhost:5000/api` |

The server refuses to start if `MONGODB_URI` or `JWT_SECRET` is missing.

> Open the app at `http://localhost:5173`, not `127.0.0.1`. CORS only allows the origin in `CLIENT_ORIGIN`.

## API reference

All note routes require `Authorization: Bearer <token>`.

| Method | Endpoint             | Auth | Description                              |
| ------ | -------------------- | ---- | ---------------------------------------- |
| GET    | `/api/health`        | No   | Health check                             |
| POST   | `/api/auth/register` | No   | Create account, returns `{ user, token }`|
| POST   | `/api/auth/login`    | No   | Log in, returns `{ user, token }`        |
| GET    | `/api/auth/me`       | Yes  | Current user                             |
| GET    | `/api/notes`         | Yes  | List own notes (`?search=text`)          |
| POST   | `/api/notes`         | Yes  | Create note `{ title, content }`         |
| GET    | `/api/notes/:id`     | Yes  | Get one own note                         |
| PUT    | `/api/notes/:id`     | Yes  | Update own note                          |
| DELETE | `/api/notes/:id`     | Yes  | Delete own note (204)                    |

Errors use one shape: `{ "message": "...", "code": "...", "errors": [{ "field", "message" }] }`.
Codes include `VALIDATION_ERROR`, `INVALID_CREDENTIALS`, `DUPLICATE`, `NO_TOKEN`, `INVALID_TOKEN`, `TOKEN_EXPIRED`, `NOT_FOUND`.

Validation rules: name 2 to 50 characters; valid email; password 8 to 72 characters with at least one letter and one number; note title 1 to 120 characters; note content up to 10,000 characters.

## Testing

### Automated backend tests (34 tests)

```bash
cd backend
npm test
```

Needs a running MongoDB. Tests use a separate database (`notes_app_test`, override with `MONGODB_URI_TEST`) that is dropped after each suite, so your development data is never touched.

Coverage:

- Authentication: register, duplicate email, bcrypt hashing, login, wrong credentials, `/me`
- Tokens: missing, malformed, wrong-secret, expired, and deleted-user tokens
- Notes CRUD, search, regex-injection safety
- Invalid input on every endpoint, including invalid ids
- Unauthorized access to every notes route
- Cross-user access: read, update, delete and search never expose another user's note
- Persistence: users and notes survive an API process restart

### Postman

1. Import `postman/notes-app.postman_collection.json`.
2. Start the API.
3. Run the collection (folders run in order: Auth, Notes, Negative cases). Tokens and note ids are stored automatically in collection variables.

### Manual UI test

Register, create a note, edit it, search, delete it (confirm dialog), reload the page (session persists), log out, log back in, and resize to a mobile width to check the sidebar.

## Security design

- Passwords are hashed with bcrypt (cost 12) in a Mongoose pre-save hook. The `password` field is `select: false` and stripped from JSON output.
- JWTs are signed with `JWT_SECRET` from the environment, with an expiry. Expired and invalid tokens return distinct error codes; the frontend logs the user out and shows a toast.
- All inputs are validated with Zod before reaching controllers. Non-string values (such as NoSQL operator objects) are rejected.
- Every note query includes the authenticated user's id. Another user's note returns `404`, which does not reveal that the note exists.
- The owner is always taken from the token, never from the request body.
- CORS is restricted to `CLIENT_ORIGIN`, Helmet sets security headers, request bodies are limited to 100 KB, and login/register are rate limited.
- Login returns the same message for an unknown email and a wrong password.

## Design decisions

- **Stateless JWT:** logout is client-side (token discarded). The trade-off is that a token stays valid until it expires. A production system could add refresh tokens or a denylist.
- **Token storage:** the token is kept in `localStorage` for simplicity. An `httpOnly` cookie is more resistant to XSS but requires CSRF handling.
- **No pagination:** kept out of scope. The note list is sorted by `updatedAt` and indexed on `{ user, updatedAt }`.
- **No UI or state libraries:** toasts, modals, and the profile menu are small in-house components to keep dependencies minimal.

## Troubleshooting

| Problem                                    | Fix                                                                       |
| ------------------------------------------ | ------------------------------------------------------------------------- |
| `Missing required environment variables`   | Create `backend/.env` from `.env.example` and set `JWT_SECRET`            |
| `ECONNREFUSED 127.0.0.1:27017`             | Start MongoDB, or use an Atlas URI in `MONGODB_URI`                       |
| CORS error in the browser console          | Use `http://localhost:5173` and make sure it matches `CLIENT_ORIGIN`      |
| Frontend cannot reach the API              | Check `VITE_API_URL` and restart `npm run dev` after editing `.env`       |
| Port already in use                        | Change `PORT` in `backend/.env` and `VITE_API_URL` in `frontend/.env`     |
