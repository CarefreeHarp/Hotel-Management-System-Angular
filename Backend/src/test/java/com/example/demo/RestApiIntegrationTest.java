package com.example.demo;

import com.example.demo.repository.ClientRepository;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.RequestBuilder;
import org.springframework.test.web.servlet.request.MockHttpServletRequestBuilder;
import tools.jackson.databind.JsonNode;
import tools.jackson.databind.ObjectMapper;

import static org.junit.jupiter.api.Assertions.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest(properties = {
        "spring.datasource.url=jdbc:h2:mem:rest-api-test;DB_CLOSE_DELAY=-1",
        "spring.h2.console.enabled=false",
        "logging.level.org.hibernate.SQL=WARN",
        "logging.level.root=WARN",
        "logging.level.org.springframework=WARN",
        "debug=false",
        "spring.devtools.add-properties=false"
})
@AutoConfigureMockMvc(print = org.springframework.boot.webmvc.test.autoconfigure.MockMvcPrint.NONE)
class RestApiIntegrationTest {
    @Autowired private MockMvc mvc;
    @Autowired private ObjectMapper json;
    @Autowired private ClientRepository clients;

    @Test
    void allSixModulesPersistCrudAndKeepRelationshipsConsistent() throws Exception {
        var admin = payload("name", "API Admin", "email", "api-admin@example.com", "password", "Example123!");
        var type = payload("name", "API Garden Suite", "description", "Suite description", "nightlyPrice", 123.45,
                "maxCapacity", 2, "mainPhoto", "https://example.com/room.jpg");
        var client = payload("name", "API Guest", "lastName", "Lopez", "nationalId", "987654321012345",
                "phone", "3001234567", "email", "api-client@example.com", "password", "Example123!");
        var service = servicePayload("api-spa");

        admin.put("adminId", 2147483647);
        int adminId = create("administrators", "adminId", admin);
        int typeId = create("room-types", "roomTypeId", type);
        var operator = payload("name", "API Operator", "lastName", "Perez", "email", "api-operator@example.com",
                "password", "Example123!", "admin", payload("adminId", adminId, "name", "Ignored Admin Name"));
        var room = payload("number", 9876, "floor", 6, "status", "AVAILABLE", "roomType", payload("roomTypeId", typeId, "name", "Ignored Type Name"));
        int operatorId = create("operators", "operatorId", operator);
        int roomId = create("rooms", "roomId", room);
        int clientId = create("clients", "clientId", client);
        int serviceId = create("services", "serviceId", service);
        assertNotEquals(2147483647, adminId);
        assertEquals("API Admin", response(get("/administrators/" + adminId), 200).get("name").asText());
        assertEquals("API Garden Suite", response(get("/room-types/" + typeId), 200).get("name").asText());

        Map<String, Integer> ids = Map.of("administrators", adminId, "room-types", typeId, "operators", operatorId,
                "rooms", roomId, "clients", clientId, "services", serviceId);
        for (var entry : ids.entrySet()) {
            JsonNode list = response(get("/" + entry.getKey()), 200);
            assertTrue(list.isArray());
            // Las respuestas son DTO: ninguna lista ni detalle envía contraseñas.
            for (JsonNode record : list) assertFalse(record.has("password"));
            assertFalse(response(get("/" + entry.getKey() + "/" + entry.getValue()), 200).has("password"));
        }

        response(get("/operators").param("adminId", String.valueOf(adminId)), 200);
        response(get("/services/by-url-name/api-spa"), 200);
        // Un administrador con operarios y un tipo con habitaciones no se pueden borrar.
        for (String url : new String[]{"/administrators/" + adminId, "/room-types/" + typeId}) {
            conflict(url);
            response(get(url), 200);
        }

        admin.put("name", "Updated Admin");
        admin.remove("password");
        type.put("name", "Renamed API Suite");
        client.put("name", "Updated Guest");
        client.remove("password");
        operator.put("name", "Updated Operator");
        operator.remove("password");
        room.put("number", 9877);
        service.put("urlName", "api-spa-renamed");
        Map<String, Map<String, Object>> updates = Map.of("administrators", admin, "room-types", type,
                "clients", client, "operators", operator, "rooms", room, "services", service);
        for (var entry : updates.entrySet()) {
            mvc.perform(jsonBody(put("/" + entry.getKey() + "/" + ids.get(entry.getKey())), entry.getValue()))
                    .andExpect(status().isOk()).andExpect(content().string(""));
        }
        // La contraseña se conserva en la base de datos aunque el PUT no la envíe.
        assertEquals("Example123!", clients.findById(clientId).orElseThrow().getPassword());
        assertEquals(9877, response(get("/rooms/" + roomId), 200).get("number").asInt());
        assertEquals("Renamed API Suite", response(get("/rooms/" + roomId), 200).get("roomType").get("name").asText());
        JsonNode updatedOperator = response(get("/operators/" + operatorId), 200);
        assertEquals(adminId, updatedOperator.get("adminId").asInt());
        assertEquals("Updated Admin", updatedOperator.get("adminName").asText());
        JsonNode updatedService = response(get("/services/by-url-name/api-spa-renamed"), 200);
        assertEquals(2, updatedService.get("secondaryImageUrls").size());
        assertEquals("https://example.com/spa-2.jpg", updatedService.get("secondaryImageUrls").get(1).asText());
        assertTrue(updatedService.get("active").asBoolean());
        assertEquals(99.99, updatedService.get("price").asDouble());

        Map<String, String> idFields = Map.of("rooms", "roomId", "operators", "operatorId", "clients", "clientId",
                "services", "serviceId", "room-types", "roomTypeId", "administrators", "adminId");
        for (String module : new String[]{"rooms", "operators", "clients", "services", "room-types", "administrators"}) {
            String url = "/" + module + "/" + ids.get(module);
            mvc.perform(delete(url)).andExpect(status().isOk()).andExpect(content().string(""));
            for (JsonNode record : response(get("/" + module), 200)) {
                assertNotEquals(ids.get(module).intValue(), record.get(idFields.get(module)).asInt());
            }
        }
    }

    @Test
    void reservationsOnlyCarryTheDataTheProfileNeeds() throws Exception {
        int emmaId = idByField("clients", "clientId", "email", "emma.thompson@example.com");
        JsonNode emmaReservations = response(get("/reservations").param("clientId", String.valueOf(emmaId)), 200);
        assertEquals(2, emmaReservations.size());
        // El perfil ya tiene al cliente: la reserva no lo repite ni envía sus servicios.
        assertFalse(emmaReservations.get(0).has("client"));
        assertFalse(emmaReservations.get(0).has("services"));
        assertFalse(emmaReservations.get(0).get("room").has("reservations"));
        assertFalse(emmaReservations.get(0).get("room").get("roomType").has("rooms"));
    }

    @Test
    void clientsWithReservationsCannotBeDeleted() throws Exception {
        // Noah solo tiene una reserva cancelada, pero sigue siendo una reserva.
        int noahId = idByField("clients", "clientId", "email", "noah.williams@example.com");
        assertEquals(1, response(get("/reservations/client/" + noahId + "/count"), 200).asLong());
        assertTrue(conflict("/clients/" + noahId).contains("1 reservation"));
        response(get("/clients/" + noahId), 200);

        int jamesId = idByField("clients", "clientId", "email", "james.young@example.com");
        assertEquals(0, response(get("/reservations/client/" + jamesId + "/count"), 200).asLong());
        mvc.perform(delete("/clients/" + jamesId)).andExpect(status().isOk());
        assertEquals(response(get("/clients"), 200).size(), response(get("/panel/counts"), 200).get("clients").asInt());
    }

    @Test
    void roomsAndServicesWithReservationsAreDeactivatedInsteadOfDeleted() throws Exception {
        // La habitación 201 tiene la reserva de Ava: se desactiva y sale de la lista.
        int room201 = idByField("rooms", "roomId", "number", "201");
        assertEquals(1, response(get("/reservations/room/" + room201 + "/count"), 200).asLong());
        mvc.perform(delete("/rooms/" + room201)).andExpect(status().isOk());
        assertFalse(response(get("/rooms/" + room201), 200).get("active").asBoolean());
        for (JsonNode room : response(get("/rooms"), 200)) assertNotEquals(room201, room.get("roomId").asInt());
        assertEquals(response(get("/rooms"), 200).size(), response(get("/panel/counts"), 200).get("rooms").asInt());

        // La 110 no tiene reservas pero está ocupada: esa regla se mantiene.
        int room110 = idByField("rooms", "roomId", "number", "110");
        assertTrue(conflict("/rooms/" + room110).contains("occupied"));

        // El desayuno está en dos reservas de Emma: se desactiva y sale del catálogo.
        int breakfast = idByField("services", "serviceId", "urlName", "breakfast-buffet");
        assertEquals(2, response(get("/reservations/service/" + breakfast + "/count"), 200).asLong());
        mvc.perform(delete("/services/" + breakfast)).andExpect(status().isOk());
        assertFalse(response(get("/services/" + breakfast), 200).get("active").asBoolean());
        for (JsonNode service : response(get("/services"), 200)) assertNotEquals(breakfast, service.get("serviceId").asInt());
        assertEquals(response(get("/services"), 200).size(), response(get("/panel/counts"), 200).get("services").asInt());

        // Un servicio sin reservas sí se borra.
        int wakeUp = idByField("services", "serviceId", "urlName", "wake-up-call");
        assertEquals(0, response(get("/reservations/service/" + wakeUp + "/count"), 200).asLong());
        mvc.perform(delete("/services/" + wakeUp)).andExpect(status().isOk());
        assertThrows(Exception.class, () -> mvc.perform(get("/services/" + wakeUp)));
    }

    @Test
    void loginReturnsTheUserWhoseIdGoesInTheUrl() throws Exception {
        mvc.perform(get("/clients/login").param("email", "liam.anderson@example.com").param("password", "wrong"))
                .andExpect(status().isUnauthorized());
        JsonNode liam = response(get("/clients/login")
                .param("email", "LIAM.anderson@example.com").param("password", "Liam2026!"), 200);
        assertEquals("Liam", liam.get("name").asText());
        assertEquals(liam.get("clientId").asInt(), response(get("/clients/" + liam.get("clientId").asInt()), 200).get("clientId").asInt());

        JsonNode admin = response(get("/administrators/login")
                .param("email", "admin1@atlansuites.com").param("password", "Admin2026!"), 200);
        assertTrue(admin.has("adminId"));
        mvc.perform(get("/administrators/login").param("email", "operator1@atlansuites.com").param("password", "Operator2026!"))
                .andExpect(status().isUnauthorized());
        JsonNode operator = response(get("/operators/login")
                .param("email", "operator1@atlansuites.com").param("password", "Operator2026!"), 200);
        assertTrue(operator.has("operatorId"));

        // El registro revisa en la base de datos que el correo y el documento no estén en uso.
        var duplicate = payload("name", "Copy", "lastName", "Liam", "nationalId", "999", "phone", "300",
                "email", "liam.anderson@example.com", "password", "Example123!");
        assertTrue(mvc.perform(jsonBody(post("/clients"), duplicate)).andExpect(status().isConflict())
                .andReturn().getResponse().getErrorMessage().contains("email"));
        duplicate.put("email", "someone-new@example.com");
        duplicate.put("nationalId", "1001001002");
        assertTrue(mvc.perform(jsonBody(post("/clients"), duplicate)).andExpect(status().isConflict())
                .andReturn().getResponse().getErrorMessage().contains("ID number"));
    }

    @Test
    void crudDoesNotValidateBusinessRules() throws Exception {
        var client = payload("name", "", "lastName", "", "nationalId", "abc", "phone", "abc",
                "email", "invalid-email", "password", "x");
        int clientId = create("clients", "clientId", client);
        assertEquals("invalid-email", response(get("/clients/" + clientId), 200).get("email").asText());
        assertEquals("x", response(get("/clients/" + clientId), 200).get("password").asText());
        mvc.perform(delete("/clients/" + clientId)).andExpect(status().isOk());

        var service = servicePayload("Not a validated slug");
        service.put("price", -1);
        service.put("mainImageUrl", "file:///tmp/photo.jpg");
        int serviceId = create("services", "serviceId", service);
        JsonNode saved = response(get("/services/" + serviceId), 200);
        assertEquals(-1, saved.get("price").asInt());
        assertEquals("file:///tmp/photo.jpg", saved.get("mainImageUrl").asText());
        mvc.perform(delete("/services/" + serviceId)).andExpect(status().isOk());
    }

    @Test
    void angularCorsAllowsCrudWithoutCookies() throws Exception {
        for (String module : new String[]{"clients", "administrators", "operators", "rooms", "room-types", "services"}) {
            for (String method : new String[]{"POST", "PUT", "DELETE"}) {
                String url = "/" + module + (method.equals("POST") ? "" : "/1");
                mvc.perform(options(url).header("Origin", "http://localhost:4200")
                                .header("Access-Control-Request-Method", method)
                                .header("Access-Control-Request-Headers", "content-type"))
                        .andExpect(status().isOk())
                        .andExpect(header().string("Access-Control-Allow-Origin", "http://localhost:4200"))
                        .andExpect(header().doesNotExist("Access-Control-Allow-Credentials"));
            }
        }
        mvc.perform(get("/clients").header("Origin", "http://localhost:4200"))
                .andExpect(status().isOk()).andExpect(header().doesNotExist("Set-Cookie"));
    }

    @Test
    void swaggerAndOpenApiDocumentEveryOperation() throws Exception {
        mvc.perform(get("/swagger-ui/index.html")).andExpect(status().isOk())
                .andExpect(content().contentTypeCompatibleWith(MediaType.TEXT_HTML));
        mvc.perform(get("/swagger-ui/swagger-ui-bundle.js")).andExpect(status().isOk());
        mvc.perform(get("/v3/api-docs/swagger-config")).andExpect(status().isOk());
        mvc.perform(get("/v3/api-docs.yaml")).andExpect(status().isOk());
        JsonNode document = response(get("/v3/api-docs"), 200);
        assertTrue(document.get("openapi").asText().startsWith("3."));
        assertFalse(document.get("info").get("title").asText().isBlank());
        JsonNode paths = document.get("paths");
        assertEquals(22, paths.size());
        for (String module : new String[]{"clients", "administrators", "operators", "rooms", "room-types", "services"}) {
            JsonNode collection = paths.get("/" + module);
            JsonNode detail = paths.get("/" + module + "/{id}");
            assertNotNull(collection.get("get"));
            assertNotNull(collection.get("post").get("requestBody"));
            JsonNode postContent = collection.get("post").get("requestBody").get("content");
            assertNotNull(postContent.get("application/json"));
            assertFalse(postContent.has("application/x-www-form-urlencoded"));
            assertFalse(postContent.has("multipart/form-data"));
            assertFalse(collection.get("post").get("responses").isEmpty());
            assertNotNull(detail.get("get").get("responses").get("200"));
            assertNotNull(detail.get("put").get("requestBody"));
            assertNotNull(detail.get("put").get("requestBody").get("content").get("application/json"));
            assertFalse(detail.get("put").get("responses").isEmpty());
            assertFalse(detail.get("delete").get("responses").isEmpty());
        }
        JsonNode schemas = document.get("components").get("schemas");
        for (String entity : new String[]{"Client", "Administrator", "Operator", "Room", "RoomType", "Service"}) {
            assertFalse(schemas.has(entity + "Request"));
        }
        for (String schema : new String[]{"Client", "Administrator", "Operator"}) {
            JsonNode password = schemas.get(schema).get("properties").get("password");
            assertNotNull(password);
            assertFalse(password.path("writeOnly").asBoolean());
        }
        assertNotNull(schemas.get("Room").get("properties").get("roomType"));
        assertNotNull(schemas.get("Operator").get("properties").get("admin"));
    }

    private MockHttpServletRequestBuilder jsonBody(MockHttpServletRequestBuilder request, Map<String, Object> fields) throws Exception {
        return request.contentType(MediaType.APPLICATION_JSON).content(json.writeValueAsString(fields));
    }

    private int create(String module, String idField, Map<String, Object> payload) throws Exception {
        mvc.perform(jsonBody(post("/" + module), payload))
                .andExpect(status().isOk()).andExpect(content().string(""))
                .andExpect(header().doesNotExist("Location"));
        String uniqueField = switch (module) {
            case "clients", "administrators", "operators" -> "email";
            case "rooms" -> "number";
            case "room-types" -> "name";
            case "services" -> "urlName";
            default -> throw new IllegalArgumentException(module);
        };
        JsonNode records = response(get("/" + module), 200);
        for (JsonNode record : records) {
            if (record.get(uniqueField).asText().equals(String.valueOf(payload.get(uniqueField)))) {
                return record.get(idField).asInt();
            }
        }
        throw new AssertionError("Created record is missing from " + module);
    }

    /** MockMvc no pasa por /error, así que el mensaje del 409 se lee de getErrorMessage(). */
    private String conflict(String url) throws Exception {
        return mvc.perform(delete(url)).andExpect(status().isConflict()).andReturn().getResponse().getErrorMessage();
    }

    private int idByField(String module, String idField, String field, String value) throws Exception {
        for (JsonNode record : response(get("/" + module), 200)) {
            if (record.get(field).asText().equals(value)) return record.get(idField).asInt();
        }
        throw new AssertionError(value + " is missing from " + module);
    }

    private JsonNode response(RequestBuilder request, int expectedStatus) throws Exception {
        var result = mvc.perform(request).andExpect(status().is(expectedStatus))
                .andExpect(content().contentTypeCompatibleWith(MediaType.APPLICATION_JSON)).andReturn();
        assertNull(result.getResponse().getHeader("Set-Cookie"));
        String text = result.getResponse().getContentAsString();
        JsonNode body = json.readTree(text);
        return body;
    }

    private Map<String, Object> servicePayload(String slug) {
        return payload("name", "API Spa", "urlName", slug, "description", "A relaxing experience", "price", 99.99,
                "category", "Wellness", "active", true, "mainImageUrl", "https://example.com/spa.jpg",
                "secondaryImageUrls", List.of("https://example.com/spa-1.jpg", "https://example.com/spa-2.jpg"));
    }

    private Map<String, Object> payload(Object... entries) {
        Map<String, Object> result = new LinkedHashMap<>();
        for (int index = 0; index < entries.length; index += 2) result.put((String) entries[index], entries[index + 1]);
        return result;
    }
}
