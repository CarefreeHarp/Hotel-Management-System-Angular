# Atlan Suites

![Atlan Suites logo](readme-assets/atlan-suites-logo.jpeg)

Hotel management application built with **Angular 19** and **Spring Boot**. Guests can explore room types and services, book a stay and consult their reservations. Staff manage clients, rooms, services and reservation histories. Payments are simulated and stored in H2. The booking total is the nightly rate × nights plus selected services. An initial payment must be at least COP 100,000 and cannot exceed the booking total.

## Color palette

![Atlan Suites color palette](readme-assets/atlan-suites-color-palette.jpeg)

## Project structure

```text
Angular-Frontend/                    Angular frontend
  src/app/
    pages/                          Routed screens and their own components
    components/                     Shared UI components
    services/                       Stateless HTTP communication
    models/                         TypeScript interfaces and enums
    app.routes.ts                   Application routes
  public/                           Runtime images and video
Springboot-Backend/                 Spring Boot backend
  src/main/java/com/example/demo/
    controller/                     REST endpoints
    service/                        Application logic
    repository/                     Database access with Spring Data JPA
    entities/                       Persistent domain model
readme-assets/                      Logo, palette and database diagram
README.md
```

## REST architecture

Angular renders the interface and sends HTTP requests. Spring Boot processes them, reads or writes H2, and returns JSON.

```mermaid
flowchart LR
    subgraph Angular[Angular frontend]
        Pages[Pages and components] --> Http[Services / HttpClient]
    end
    subgraph Spring[Spring Boot backend]
        Controllers[REST controllers] --> Logic[Services]
        Logic --> Repositories[Repositories / JPA]
    end
    Http <-->|HTTP / JSON| Controllers
    Repositories <--> Database[(H2)]
```

## Angular components

The router chooses the page displayed inside `RouterOutlet`. Each page combines shared components with components used only by that page.

```mermaid
flowchart TD
    App[AppComponent] --> Outlet[RouterOutlet]
    Outlet --> Pages[Routed pages]
    Pages --> Shared["Shared components: header, buttons, gallery, history"]
    Pages --> Local["Page components: booking steps, fields, tables"]
    Pages --> Services[Angular services]
    Services --> API[Spring Boot REST API]
```

Frontend reactive state uses RxJS Observables and Subjects, consumed through `async`. Component inputs use `@Input`; the application does not use Angular signals. Route-dependent detail queries cancel superseded reads with `switchMap`.

## Navigation

Public pages: `/`, `/login`, `/services-catalog`, `/services-catalog/:id` and `/room-types/:id`. Client pages use `/profile?auth=1`, `/profile/edit?auth=1` and `/book-now?auth=1&step=dates`; the URL is the only user context. Staff use `/admin/:adminId` and `/operator/:operatorId`, with no session or role guards. The operator landing route opens their profile with access to clients and reservations.

Staff reservation management is available at `/admin/:adminId/reservations` and `/operator/:operatorId/reservations`. Both include search, filters, sorting, table/grid views, detail (`/:id`) and editing (`/:id/edit`). Editing covers dates, guests, room type, services and status; contracted prices and recorded payments are preserved. Price-changing edits with existing payments require a new total greater than the amount paid; an increased fully paid booking becomes pending. Client views under both staff panels reuse the client reservation cards with enum-status filters and read-only detail navigation, without ratings or Book again. Permanent deletion removes the reservation, folio, charges and payments after an irreversible-action warning. Cancelling normally preserves that history.

Rooms and services have an independent `activationStatus` (`ACTIVE` / `INACTIVE`). Room physical status and service schedules remain separate. Inactive records cannot be selected for new bookings; management uses Activate/Deactivate instead of deleting them.

Client 1 (Emma Thompson) has nine demonstration bookings covering every reservation status, unpaid and partial balances, full payments and payments split into three installments. Every demonstration reservation has a folio; confirmed and completed stays include full simulated payments, while pending bookings retain unpaid or partial balances. Room occupancy matches checked-in stays. Demonstration dates are consistent with October 18, 2026; future stays are dated in 2027. Ratings and Book again are visual only. Clicking a reservation card or Details opens `/reservation/:id?auth=1`, with stay and guest information, service charges, folio, totals and payment history.

Every API error returns the same JSON body: `status`, `error`, `message`, `path` and, when specific fields are rejected, `fieldErrors` with one message per field. Bean Validation on the entities and the services' business rules (unique values, existing related records, booking and payment checks) report the rejected fields, and each form shows the message under its field; other errors appear in the form alert, adapted to the HTTP status. Unexpected server errors return 500 without technical details. Booking errors distinguish invalid dates or guests, excessive capacity, unavailable rooms, inactive services and invalid card details. A stay lasts at most 90 nights and can start up to two years ahead; card payments require 13–19 digits, an unexpired MM/YY date and a 3–4 digit security code.

The Angular forms apply the same rules and messages before sending (`utils/form-validators.ts` and `utils/form-messages.ts`), so every restriction exists on both sides. Inputs stop at the column length, phone fields accept only digits and a leading +, card fields accept only digits up to their maximum, the booking calendar only offers valid dates and the guest counter stops at 10.

When the main content of a page cannot load, an error screen replaces it inside the same area (public site, `/admin/:adminId` or `/operator/:operatorId`) without changing the URL (`utils/error-page.ts`, `pages/error-page`): 400 for an invalid value in the address, such as `/admin/1/rooms/abc`; 404 for a missing record or an unknown route; 500 when the server fails; and 503 when it cannot be reached. Try again reloads the original address. Form submissions, list actions (delete, activate), login, booking rule errors (4xx) and the landing sections keep their messages on the page.

## Entity–relationship diagram

Reference model for users, accommodation, reservations, hotel services, folios and payments.

![Atlan Suites entity–relationship diagram](readme-assets/entity-relationship.png)

## Run locally

Requires an Angular 19-compatible Node.js version, npm, a complete JDK 17 or later, and Make. Run each application in a separate terminal:

```bash
make -C Springboot-Backend serve
```

```bash
make -C Angular-Frontend serve
```

Use `make check` in each application directory to verify the frontend types/build or backend compilation/packaging. Automated tests are not configured.

When `lsof` is available, the backend's `make serve` detects an existing process using the project's H2 database and reports it instead of starting a second instance.

[Application](http://localhost:4200) · [Swagger API](http://localhost:8080/swagger-ui/index.html) · [Figma](https://www.figma.com/design/AzKmb3UaMsc4t8JZCZXiL4/AtlanSuites?node-id=0-1)
