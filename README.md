# Atlan Suites

![Atlan Suites logo](Frontend/docs/images/atlan-suites-logo.jpeg)

Atlan Suites is a hotel management application developed for the Web Development course. Its Angular frontend presents the public hotel website and management screens. Its Spring Boot backend exposes the REST resources consumed by Angular and stores the application data in H2.

## Repository structure

```text
Frontend/                         Angular application
  src/app/components/             Shared UI components
  src/app/pages/                  Routed screens and page-specific components
  src/app/models/                 TypeScript entity interfaces and enums
  src/app/services/               Application data services
  public/                         Public assets
  angular.json
  package.json
Backend/                          Spring Boot application
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
README.md
```

Both applications share this Git repository and run as separate processes.

## Application architecture

Angular handles rendering, forms, responsive layouts, and navigation. Its data services communicate with Spring Boot through HTTP and JSON. The backend follows **Controller → Service → Repository → H2**: controllers handle requests, services perform CRUD operations, and repositories persist entities.

Each management module provides a collection view and an individual detail view. Creating and editing use forms; deletion is an explicit action with confirmation. Clients, administrators, operators, rooms, room types, and hotel services form the management scope. Operators reference an administrator, and rooms reference a room type.

The public service catalogue presents the same service data through customer-facing list and detail screens. Its presentation is separate from management controls. CRUD access is unrestricted by role, and the application does not use cookie-based authentication for these resources.

## Validation and errors

The backend currently assumes valid input and existing records. It does not use Bean Validation annotations, `@Valid`, custom exceptions, or a global exception handler. Services perform CRUD operations without checking field formats, business ranges, or duplicates beforehand. There is no application-defined error JSON contract or frontend error handling for these requests.

JPA mappings and H2 still enforce non-null columns, unique values, column sizes, and foreign keys. An administrator with assigned operators or a room type with associated rooms cannot be deleted. These failures are left to Spring Boot's default error handling and typically produce HTTP 500; framework request errors use their default behavior. Database constraints do not replace the removed business validation.

## REST API and interactive documentation

Start the backend with `make` from `Backend/`, then open:

- [Swagger UI](http://localhost:8080/swagger-ui/index.html): interactive documentation and real requests through **Try it out**.
- [OpenAPI JSON](http://localhost:8080/v3/api-docs): generated API description.
- [OpenAPI YAML](http://localhost:8080/v3/api-docs.yaml): the same description in YAML.

Springdoc generates the specification automatically from controllers and entity schemas. It includes all six CRUD modules, entity fields and relation fields. No custom OpenAPI configuration or `@Schema` annotations are used; inferred response codes may differ from runtime responses, and error examples are not explicitly documented. Swagger UI is served by Spring Boot and does not require Angular to be running.

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

POST and PUT receive entities directly as JSON through `@RequestBody`, without DTOs or application validation. Persistence constraints remain declared in the JPA mappings. Send `Content-Type: application/json`; list fields such as `secondaryPhotos` are JSON arrays. Read responses use JSON; successful POST, PUT and DELETE responses have empty bodies. Operators accept `"admin": {"adminId": 1}` and rooms accept `"roomType": {"roomTypeId": 1}`; these must reference existing records. Additional fields inside these references do not update the referenced entities. Responses include the corresponding `admin` and `roomType` objects. Clients, administrators and operators store passwords in non-null columns of up to 255 characters; the application does not validate their length or content. Updating preserves their password. Passwords are ordinary JSON properties in requests and read responses, including nested administrator objects. Lombok generates their getters and setters through `@Data`. Relationships are unidirectional, so serialization does not recurse through reverse collections.

For example, after choosing an existing room-type ID:

```bash
curl -i http://localhost:8080/rooms \
  -H 'Content-Type: application/json' \
  -d '{"number":601,"floor":6,"status":"AVAILABLE","roomType":{"roomTypeId":1}}'
```

The API accepts browser requests from `http://localhost:4200` through CORS without cookies. The allowed origin is fixed to `http://localhost:4200` in each controller. Override the backend port with `SERVER_PORT` when starting it; Swagger uses the backend origin from which it is opened.

## Technology

| Frontend | Backend |
| --- | --- |
| Angular 19 and Angular Router | Spring Boot 4.1.0 and Spring MVC |
| TypeScript with strict null checks | Java 17 or later |
| Standalone components, HTML and SCSS | Spring Data JPA and H2 |
| npm and Angular CLI | Maven Wrapper and Lombok |

## Run locally

Use a Node.js version compatible with Angular 19.2, such as Node.js 22, and a JDK 17 or later. Set `JAVA_HOME` to that JDK. The Maven Wrapper downloads Maven and project dependencies on its first execution.

Start Spring Boot in one terminal:

```bash
cd Backend
make serve
```

Running `make` without a target also starts the backend. Without Make, use `./mvnw spring-boot:run`; on Windows, use `mvnw.cmd spring-boot:run`. The backend runs at `http://localhost:8080`.

Start Angular in another terminal:

```bash
cd Frontend
npm ci
npm start
```

Open `http://localhost:4200`. Frontend and backend URLs are configured independently; when changing their ports, update the HTTP service configuration and permitted CORS origin together.

## Database and demonstration data

H2 uses `jdbc:h2:file:./data/atlan-suites`, relative to the backend working directory, with username `sa` and an empty password for local development. The H2 console is available at `http://localhost:8080/h2`.

The development schema uses `create-drop`. Starting the backend recreates the schema and the `DataLoader` populates demonstration clients, administrators, operators, rooms, room types, and services. The database is reset between runs; it is not intended to preserve user-entered data across restarts. Local database files and build artifacts are excluded from Git.

## Build and checks

```bash
cd Frontend
make check
```

```bash
cd Backend
make check
```

The backend verification runs integration tests against an isolated in-memory H2 database. They cover all six CRUD modules with JSON requests and arrays, database foreign-key constraints, the absence of application validation, CORS, password serialization and preservation, and Swagger/OpenAPI output.

The backend also provides `make compile`, `make build`, `make test`, and `make clean`. Run `make help` for the full list. Maven options can be passed through `MAVEN_ARGS`, for example `make build MAVEN_ARGS=-DskipTests`. Without Make, `./mvnw verify` performs the same verification as `make check`.

## Design and visual identity

The interface uses the Atlan Suites palette and takes visual inspiration from [Marina Bay Sands](https://www.marinabaysands.com). Screens adapt to mobile, tablet, and desktop widths and use semantic HTML and accessible controls.

![Atlan Suites color palette](Frontend/docs/images/atlan-suites-color-palette.jpeg)

- [Figma design](https://www.figma.com/design/AzKmb3UaMsc4t8JZCZXiL4/AtlanSuites?node-id=0-1&t=IUIAEeybnugZna8y-1)
- [Interactive design reference](https://pants-toggle-56795002.figma.site)

The management scope excludes room booking, availability searches for a stay, checkout, payments, folios, booking history, database triggers, scheduled occupancy changes, and the configurable application clock.
