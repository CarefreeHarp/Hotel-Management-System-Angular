# Atlan Suites — Angular Frontend

This Angular 19 application lives in `Angular-Backend/`; its sibling `Springboot-Backend/` contains the REST backend. See the [repository README](../README.md) for the architecture, API, booking flow and commands for both applications.

## Run and verify

Run commands from this directory:

```bash
make serve
make check
```

`make serve` installs the locked dependencies when necessary and starts Angular at `http://localhost:4200`. `make check` runs strict TypeScript checking and the production build. Run `make help` for installation, build, watch and test-runner shortcuts. Without Make, use `npm ci`, `npm start` and `npm run build`.

## Structure and navigation

- `src/app/pages/`: public catalogs, management pages, profiles, booking and saved reservation details.
- `src/app/components/`: shared UI, including reservation history.
- `src/app/services/`: HTTP services and frontend user state.
- `src/app/models/`: domain interfaces, read models and enums.
- `src/app/app.routes.ts`: public routes, `/client/:clientId`, `/admin/:adminId`, `/operator/:operatorId` and `/reservation/:reservationId`.
- `public/`: runtime images and video. README illustrations are stored separately in the root [`readme-assets/`](../readme-assets/) directory.

The booking page uses an explicit `step` query parameter for dates, available room types, services, checkout and payment. The backend computes prices, allocates a room and persists the reservation and optional simulated payment in H2. Profiles and staff client-detail pages share reservation history.

## Development conventions

Use standalone components, semantic HTML and external HTML/SCSS/TypeScript files. Generate components with the local Angular CLI:

```bash
npx ng g c components/<name>
npx ng g c pages/<name>
npx ng g c pages/<page>/components/<name>
```

Keep strict TypeScript and Angular template checks enabled. The schematics use SCSS and skip automatic test generation. Keep the sticky header's layout height stable during scroll animations.

Workspace instructions live in `../../AGENTS.md`. Graphify output belongs outside the repository in the sibling `Hotel-Management-System-Angular-graphify/` workspace; the repository root `.gitignore` excludes generated graph artifacts.
