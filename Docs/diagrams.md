# Architecture and Diagrams (Assignment 4)

Documented for: Campus Radio · Node.js + Express + EJS + MongoDB  
Author: Student  
Date: 2024-11-23

## Initial Component Diagram (pre-code, MVC-oriented)

```
[Browser/Client]
     |
     v
[Express Router Layer]
  |    |    |
  v    v    v
[Controllers/Routes]  (index, dj, producer, manager, auth)
     |
     v
[Services/Models]
  - Mongoose Schemas (Track, DJProfile, Show)
     |
     v
[MongoDB Database]
```

- Client sends HTTP requests to Express routes.
- Routes render EJS views (server-side templating) and call Mongoose models for data.
- Models persist session-backed data (queues, shows, tracks) in MongoDB.
- Static assets (CSS/JS) are served from `public/` and referenced by the EJS views.

## Initial Sequence Diagram (pre-code module flow)

```
Client -> Express Router: GET /dj
Express Router -> DJ Route Handler: resolve controller
DJ Route Handler -> Session Store: load/create session
DJ Route Handler -> MongoDB (DJProfile, Show, Track): fetch data
MongoDB --> DJ Route Handler: data (profile, shows, catalog)
DJ Route Handler -> EJS View: render template with data
EJS View --> Client: HTML + CSS/JS

Client -> Express Router: POST /dj/add-track (JSON)
Router -> DJ Route Handler: validate + update profile queue
Handler -> MongoDB: persist queue changes
MongoDB --> Handler: confirmation
Handler --> Client: JSON (queue, stats)
```

- Captures the planned request/response and DB interactions for a core page and a CRUD action.
- Emphasizes session continuity before hitting the data layer.

## Updated Diagrams (post-implementation)

Changes from initial plan:
- Added dedicated seed layer (`config/seed.js`) to populate shows and tracks on startup.
- Introduced shared layout partials for EJS (`views/partials/header.ejs`, `views/partials/footer.ejs`).
- Added additional role routes: `/producer` (catalog CRUD) and `/manager` (shows/slots CRUD).
- Session data is stored in Mongo via `connect-mongo`; session metadata is exposed to all EJS views.

```
[Browser/Client]
     |
     v
[Express App]
  - Middleware: body parsing, static assets, sessions (connect-mongo)
  - Routes: index, dj, producer, manager, auth
     |
     v
[Controllers/Route Handlers]
  - DJ: queues, show selection
  - Producer: catalog CRUD
  - Manager: show + slot CRUD
     |
     v
[Models/DB Layer]
  - Mongoose Schemas: Track, DJProfile, Show
  - Seed data on startup
     |
     v
[MongoDB]
```

Updated sequence (DJ add-track now supports catalog lookups):

```
Client -> Router: POST /dj/add-track {trackId? | title/...}
Router -> DJ Handler: validate payload + session
DJ Handler -> Track Model: (optional) fetch catalog track by ID
DJ Handler -> DJProfile Model: add to queue, update stats
DJ Handler -> MongoDB: persist profile changes
MongoDB --> DJ Handler: confirmation
DJ Handler --> Client: JSON {queue, stats}
```

- Reflects the delivered system with database-backed catalog and show management.
