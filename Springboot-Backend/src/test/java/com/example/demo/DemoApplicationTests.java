package com.example.demo;

import org.junit.jupiter.api.Test;
import org.springframework.boot.test.context.SpringBootTest;

/**
 * Comprueba que la aplicación arranca completa. Usa H2 en memoria para no tocar
 * la base de datos de data/ que usa la aplicación al ejecutarse.
 */
@SpringBootTest(properties = {
        "spring.datasource.url=jdbc:h2:mem:demo-application-tests;DB_CLOSE_DELAY=-1",
        "logging.level.root=WARN",
        "logging.level.org.hibernate.SQL=OFF"
})
class DemoApplicationTests {

    @Test
    void contextLoads() {
    }

}
