# Atlan Suites — Angular Frontend

![Atlan Suites logo](docs/images/atlan-suites-logo.jpeg)

Atlan Suites is a hotel management project developed for the Web Development course. This repository contains the migration of its public website and room-type management screens to **Angular 19**.

The previous application uses Spring Boot and Thymeleaf. This frontend runs independently: the current sprint targets the landing page and room-type CRUD with hardcoded data. A backend connection is not implemented or required for this sprint.

## Design and visual identity

- [Figma design](https://www.figma.com/design/AzKmb3UaMsc4t8JZCZXiL4/AtlanSuites?node-id=0-1&t=IUIAEeybnugZna8y-1)
- [Interactive design](https://pants-toggle-56795002.figma.site)

### Color palette

![Atlan Suites color palette](docs/images/atlan-suites-color-palette.jpeg)

## Current sprint

| Area | Completed | Remaining |
| --- | --- | --- |
| Project setup | Angular 19, standalone components, SCSS, strict TypeScript and routing; SSR disabled | — |
| Landing page | Header, hero, hotel video, suites carousel, experiences and footer, with the scroll progress bar and fade-in animations | — |
| Domain models | Ten entity interfaces and four string enums | — |
| Room-type pages | Routes and empty list, detail and shared create/edit page components | Implement their templates and behavior |
| Mock data and service | `RoomTypeService` with the five room types from the Spring Boot `DataLoader` and CRUD methods | — |
| Room-type CRUD | Component scaffolding | List, view, create, edit and delete; form validation |
| Integration | Build and type-check commands available | Connect the screens to the service and verify the complete flow |

Only the landing page currently displays the header and footer. The other routed page templates are empty. Login, booking and services controls remain disabled. The suites carousel reads its room types from `RoomTypeService`, so changes made through the service appear on the landing page while the application is running; reloading the page restores the hardcoded data.

## Technology

| Tool | Purpose |
| --- | --- |
| Angular 19 | Standalone components and application structure |
| Angular Router | Navigation between pages without a full page reload |
| TypeScript | Typed models and component logic, with strict null checks |
| HTML and SCSS | Semantic templates and responsive styling |
| npm | Dependency installation and project scripts |

## Run locally

Run the following commands from this repository's root, where `angular.json` and `package.json` are located.

Use Node.js compatible with Angular 19.2 (`^18.19.1`, `^20.11.1` or `^22.0.0`) and npm. Install the locked dependencies:

```bash
npm ci
```

With Angular CLI 19 available in your terminal:

```bash
ng serve
```

Open [localhost:4200](http://localhost:4200/). The development server reloads when source files change. Stop it with `Ctrl+C`.

If `ng` is not available globally, `npm start` runs the same development server using the project's installed CLI.

### Available scripts

| Command | Purpose |
| --- | --- |
| `npm start` | Start the development server (`ng serve`) |
| `npm run build` | Create the production build |
| `npm run watch` | Rebuild when files change, using the development configuration |
| `npm test` | Invoke the configured Angular test runner; no test cases have been added yet |

To verify the build and all TypeScript models, including interfaces not yet imported by a page:

```bash
npm run build
npx tsc --noEmit -p tsconfig.json
```

### Makefile shortcuts

With GNU Make installed, run these commands from the repository root. The [Makefile](Makefile) uses the npm scripts and locally installed tools; a global Angular CLI is not required.

```bash
make install    # Install the locked dependencies
make serve      # Start the development server at localhost:4200
make check      # Check TypeScript models and create the production build
```

Run `make` without arguments to start the development server (equivalent to `make serve`). Run `make help` to list all targets. Individual targets include `make build`, `make typecheck`, `make watch` and `make test`; `make start` is an alias for `make serve`. The test target invokes the configured runner, but no test cases have been added yet. Stop the development server or watch mode with `Ctrl+C`.

## Project structure

```text
public/images/                         Original logo and social images
  landing-page/                        Hero photo and hotel video
src/app/
  components/                          Shared UI components
    header/                            Header and integrated navigation
    footer/                            Hotel contact details and social links
  models/                              Entity interfaces
    enums/                             Domain status values
  pages/                               Routed screens
    landing-page/
      components/                      Landing sections
        hero/
        hotel-video/
        suites/                        Room-type carousel
        experiences/
    room-type-detail/
    room-type-form-page/               Shared create/edit page
    room-type-table-page/
      components/                      Components exclusive to this page
        page-title/
        room-type-table/
  services/
    room-type.service.ts               Hardcoded room types and CRUD methods
  app.component.html                   Root router outlet
  app.component.scss
  app.component.ts
  app.config.ts                        Application providers
  app.routes.ts                        URL-to-page mapping
docs/images/                           README illustrations
```

- **Components** provide reusable pieces of a screen. The header and footer are rendered by the landing page only.
- **Pages** compose the screens selected by the router. Components exclusive to a page live inside that page's own `components/` directory.
- **Models** define the shape of domain data. Interfaces do not create records or store data.
- **Services** keep the hardcoded collection in a private array and expose the operations used by pages. Components receive them with `inject()` and never change the array directly.

The root component renders `<router-outlet />`, where Angular displays the page for the current URL.

## Navigation

Routes are declared in [app.routes.ts](src/app/app.routes.ts).

| URL | Page | Current state |
| --- | --- | --- |
| `/` | `LandingPageComponent` | Complete landing page |
| `/room-types` | `RoomTypeTablePageComponent` | Empty scaffold |
| `/room-types/new` | `RoomTypeFormPageComponent` | Empty scaffold for creation |
| `/room-types/:id/edit` | `RoomTypeFormPageComponent` | Empty scaffold for editing |
| `/room-types/:id` | `RoomTypeDetailComponent` | Empty scaffold |
| Any other URL | Redirect to `/` | Configured |

`:id` represents a room type's identifier. The routes exist, but loading a record from that parameter and submitting forms are still pending.

## Domain models and enums

[Entity interfaces](src/app/models/) mirror the field names and relationships of the previous Java entities:

| Area | Interfaces |
| --- | --- |
| Users | `Administrator`, `Client`, `Operator` |
| Accommodation | `RoomType`, `Room` |
| Reservations | `Reservation` |
| Hotel services | `Service` |
| Billing | `Folio`, `FolioItem`, `Payment` |

[Status enums](src/app/models/enums/) are `RoomStatus`, `ReservationStatus`, `FolioStatus` and `PaymentStatus`. Their string values match the Java enums.

Optional properties use `?`, such as `profilePhoto?: string`. Missing values are omitted, rather than assigned `null`; a future API integration must normalize backend nulls at its boundary. Required IDs are numbers, dates use ISO-format strings, and monetary fields use numbers. Exact billing arithmetic is outside this scaffold.

TypeScript strict mode, `strictNullChecks`, `noUncheckedIndexedAccess`, `exactOptionalPropertyTypes` and Angular `strictTemplates` remain enabled. Arrays use empty collections when there are no elements.

## Entity–relationship diagram

The following diagram is the reference database model inherited from the Spring Boot project. It provides domain context for the TypeScript interfaces; this Angular application does not connect to a database. Room types are hardcoded in `RoomTypeService`.

### Room-type service

`RoomTypeService` (`src/app/services/room-type.service.ts`) starts with the same five room types that the Spring Boot `DataLoader` created, with IDs 1 to 5:

| Method | Result |
| --- | --- |
| `getAll()` | A copy of the list, so a component cannot change the service's array |
| `getById(id)` | The room type with that ID, or `undefined` if none exists |
| `add(roomType)` | Adds a room type without an ID; the service assigns the next ID (6, 7, …) and returns the new record |
| `update(id, roomType)` | Finds the position of that ID and replaces the record there |
| `delete(id)` | Removes the room type with that ID |

`update` and `delete` do nothing if the ID does not exist. The service does not validate data: the Spring Boot rules (required fields, unique name, capacity from 1 to 10, non-negative price) belong in the room-type form.

![Atlan Suites entity–relationship diagram](docs/images/entity-relationship.png)

## Development conventions

Use semantic HTML and keep external HTML, SCSS and TypeScript files for components. Generate components through the CLI:

```bash
ng g c components/<name>
ng g c pages/<name>
ng g c pages/<page>/components/<name>
```

The project's `angular.json` configures SCSS and disables automatic `.spec.ts` generation for components and services. Use the local Angular 19 CLI through `npx ng` if the global version differs.

The header is fixed and transparent over the landing hero; it takes a dark background once the page scrolls. A page that reuses it needs top spacing so the header does not cover its content. When the page scrolls, the header also reduces its logo width and vertical padding. Because it is fixed, its height change does not move the page content or cause scroll oscillation. Its navigation belongs directly inside the header, with no separate navbar component.

Workspace-specific agent instructions live in `../AGENTS.md`. The code knowledge graph is maintained outside this repository at `../Hotel-Management-System-Angular-graphify/graphify-out/`; neither is required to run the application. Do not commit generated graph artifacts.
