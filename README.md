# Atlan Suites

![Atlan Suites logo](readme-assets/atlan-suites-logo.jpeg)

Atlan Suites is a hotel management application developed for the Web Development course. Its Angular frontend presents the public hotel website and management screens. Its Spring Boot backend exposes the REST resources consumed by Angular and stores the application data in H2.

## Repository structure

```text
Angular-Backend/                  Angular application
  src/app/components/             Shared UI components
  src/app/pages/                  Routed screens and page-specific components
  src/app/models/                 TypeScript entity interfaces and enums
  src/app/services/               Application data services
  public/                         Public assets
  angular.json
  package.json
Springboot-Backend/               Spring Boot application
  src/main/java/com/example/demo/
    controller/                   REST entry points
    service/                      CRUD operations
      interfaces/                 Service contracts
    repository/                   Spring Data JPA persistence
    entities/                     Database entities and enums
    DataLoader.java               Initial demonstration data
    DemoApplication.java          Application entry point
  src/main/resources/
    application.properties        H2 and server settings
  pom.xml
  mvnw
  mvnw.cmd
readme-assets/                    README logo, palette and entity–relationship diagram
README.md
```

Both applications share this Git repository and run as separate processes.

## Application architecture

Angular handles rendering, forms, responsive layouts, and navigation. Its data services communicate with Spring Boot through HTTP and JSON. The backend follows **Controller → Service → Repository → H2**: controllers handle requests, services perform CRUD operations, and repositories persist entities.

Each management module provides a collection view and an individual detail view. Creating and editing use forms; deletion is an explicit action with confirmation. Clients, administrators, operators, rooms, room types, and hotel services form the management scope. Operators reference an administrator, and rooms reference a room type.

The public service catalogue presents the same service data through customer-facing list and detail screens. Its presentation is separate from management controls. CRUD access is unrestricted by role, and the application does not use cookie-based authentication for these resources.

## Validation and errors

The backend uses Spring's default error handling, without Bean Validation, custom exceptions or a global exception handler. Existing CRUD services check selected uniqueness and deletion rules, and Angular shows API failures in the relevant forms and pages. JPA and H2 also enforce non-null columns, uniqueness, column sizes and foreign keys.

Booking additionally checks stay dates, capacity, service availability, current room availability and simulated payment data. Invalid booking input returns 400; an exhausted room type returns 409; a missing saved reservation returns 404. Other framework and database errors retain their default responses. Booking allocation and persistence run in one transaction.

## REST API and interactive documentation

Start the backend with `make` from `Springboot-Backend/`, then open:

- [Swagger UI](http://localhost:8080/swagger-ui/index.html): interactive documentation and real requests through **Try it out**.
- [OpenAPI JSON](http://localhost:8080/v3/api-docs): generated API description.
- [OpenAPI YAML](http://localhost:8080/v3/api-docs.yaml): the same description in YAML.

Springdoc generates the specification automatically from controllers and entity schemas. It includes the six CRUD modules, login and panel queries, reservation availability, quotes, creation and detailed histories, together with their entity and read-model schemas. No custom OpenAPI configuration or `@Schema` annotations are used; inferred response codes may differ from runtime responses, and error examples are not explicitly documented. Swagger UI is served by Spring Boot and does not require Angular to be running.

| Resource | Collection route | Individual route |
| --- | --- | --- |
| Clients | `/clients` | `/clients/{id}` |
| Administrators | `/administrators` | `/administrators/{id}` |
| Operators | `/operators` | `/operators/{id}` |
| Rooms | `/rooms` | `/rooms/{id}` |
| Room types | `/room-types` | `/room-types/{id}` |
| Services | `/services` | `/services/{id}` |

For every module, `GET` on the collection lists all records and `POST` creates one and returns **200 OK** with an empty body and no `Location` header. On an individual route, `GET` reads one record, `PUT` updates it and returns **200 OK** with an empty body, and `DELETE` returns **200 OK** with an empty body. `PUT` assumes the ID exists and receives the editable fields; optional fields omitted from the request are cleared or become empty lists. IDs stay stable when changing a room number, room-type name or service slug.

`GET /operators?adminId=1` filters operators assigned to an administrator. `GET /services/by-url-name/{urlName}` retrieves a service using its unique slug. Public and management screens consume the same service resources and choose their own presentation.

POST and PUT receive entities directly as JSON through `@RequestBody`. Read endpoints use DTOs tailored to lists and details; user DTOs omit passwords. Existing CRUD writes return empty bodies, while reservation creation returns its saved detail and generated ID. Operators accept `"admin": {"adminId": 1}` and rooms accept `"roomType": {"roomTypeId": 1}`. Updates preserve existing passwords. Booking checks dates, capacity, active services, current availability and simulated card payment data with Spring's default error handling.

For example, after choosing an existing room-type ID:

```bash
curl -i http://localhost:8080/rooms \
  -H 'Content-Type: application/json' \
  -d '{"number":601,"floor":6,"status":"AVAILABLE","roomType":{"roomTypeId":1}}'
```

The API accepts browser requests from `http://localhost:4200` through CORS without cookies. The allowed origin is fixed to `http://localhost:4200` in each controller. Override the backend port with `SERVER_PORT` when starting it; Swagger uses the backend origin from which it is opened.

## Reservations

Clients start from **Book now** on `/client/:clientId/profile`. `/client/:clientId/book-now` uses an explicit `step` query parameter for dates, available room types, optional services, checkout and payment. Successful creation opens `/reservation/:reservationId`. The backend assigns a currently available physical room, snapshots rates and charges, and stores a folio and optional simulated payment. Full payment confirms the reservation; partial or deferred payment leaves it pending. No bank is charged.

Client profiles and staff client-detail pages share reservation history, with additional financial and internal fields for staff. Operators now enter `/operator/:operatorId` and can view clients and their histories. The existing frontend guards restore user state from route IDs; they do not provide backend authentication.

## Technology

| Frontend | Backend |
| --- | --- |
| Angular 19 and Angular Router | Spring Boot 4.1.0 and Spring MVC |
| TypeScript with strict null checks | Java 17 or later |
| Standalone components, HTML and SCSS | Spring Data JPA and H2 |
| npm and Angular CLI | Maven Wrapper and Lombok |

## Run locally

Use a Node.js version compatible with Angular 19.2, such as Node.js 22, and a complete JDK 17 or later. The backend Makefile detects the JDK from `javac` when `JAVA_HOME` is unset, so a separate Java runtime on `PATH` does not select the wrong compiler. You can explicitly select a JDK with `make serve JAVA_HOME=/path/to/jdk`. The Maven Wrapper downloads Maven and project dependencies on its first execution.

Start Spring Boot in one terminal:

```bash
cd Springboot-Backend
make serve
```

Running `make` without a target also starts the backend; `make start` and `make run` are aliases. Backend compilation and startup clean the generated classes first to avoid reusing stale or incompatible bytecode. Without Make, set `JAVA_HOME` to a complete JDK and use `./mvnw clean spring-boot:run`; on Windows, use `mvnw.cmd clean spring-boot:run`. The backend runs at `http://localhost:8080`.

Start Angular in another terminal:

```bash
cd Angular-Backend
make serve
```

Running `make`, `make start`, or `make run` also starts Angular. Frontend targets install the locked dependencies automatically on first use and when `package.json` or `package-lock.json` changes; `make install` forces a fresh installation. Without Make, use `npm ci` followed by `npm start`.

Open `http://localhost:4200`. Frontend and backend URLs are configured independently; when changing their ports, update the HTTP service configuration and permitted CORS origin together.

## Database and demonstration data

H2 uses `jdbc:h2:file:./data/atlan-suites`, relative to the backend working directory, with username `sa` and an empty password for local development. The H2 console is available at `http://localhost:8080/h2`.

The development schema uses `create-drop`. Starting the backend recreates the schema and the `DataLoader` populates demonstration clients, administrators, operators, rooms, room types, and services. The database is reset between runs; it is not intended to preserve user-entered data across restarts. Local database files and build artifacts are excluded from Git.

## Build and checks

```bash
cd Angular-Backend
make check
```

```bash
cd Springboot-Backend
make check
```

Frontend `make compile` is an alias for `make build`; `make check` runs TypeScript checking and a production build. Production builds do not download Google Fonts to inline them; the browser loads the existing external font references at runtime, with fallback fonts when offline.

The existing backend verification runs integration tests against an isolated in-memory H2 database for CRUD, CORS and OpenAPI. Booking availability, price snapshots, pending reservations, partial/full simulated payments and concurrent allocation were checked using a temporary suite; no new test files are retained.

The backend also provides `make compile`, `make build`, `make test`, and `make clean`. Run `make help` for the full list. Maven options can be passed through `MAVEN_ARGS`, for example `make build MAVEN_ARGS=-DskipTests` to package without executing tests. Without Make, `./mvnw clean verify` performs the same verification as `make check` when `JAVA_HOME` points to a complete JDK.

## Design and visual identity

The interface uses the Atlan Suites palette and takes visual inspiration from [Marina Bay Sands](https://www.marinabaysands.com). Screens adapt to mobile, tablet, and desktop widths and use semantic HTML and accessible controls.

![Atlan Suites color palette](readme-assets/atlan-suites-color-palette.jpeg)

- [Figma design](https://www.figma.com/design/AzKmb3UaMsc4t8JZCZXiL4/AtlanSuites?node-id=0-1&t=IUIAEeybnugZna8y-1)
- [Interactive design reference](https://pants-toggle-56795002.figma.site)

The application does not integrate a real payment gateway, database triggers, scheduled occupancy changes, or a configurable application clock.

## Entity–relationship diagram

The reference domain model includes users, accommodation, reservations, services, folios and payments. The Angular application accesses H2 through the Spring Boot REST API.

![Atlan Suites entity–relationship diagram](readme-assets/entity-relationship.png)

## Repository hygiene

README illustrations live only in `readme-assets/`, alongside `Angular-Backend/` and `Springboot-Backend/`. Runtime images remain in the Angular application's `public/` directory.

Graphify's canonical workspace is outside this repository, in the sibling `Hotel-Management-System-Angular-graphify/` directory. The root `.gitignore` excludes Graphify output directories, caches, manifests and standard graph exports at any depth; these generated artifacts must not be committed.
