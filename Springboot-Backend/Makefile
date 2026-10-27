.DEFAULT_GOAL := serve

MVNW ?= ./mvnw
MAVEN_ARGS ?=

# Usa el JDK del compilador cuando PATH contiene otro entorno de ejecución de Java.
JAVA_HOME ?= $(shell dirname "$$(dirname "$$(readlink -f "$$(command -v javac)")")")
export JAVA_HOME

.PHONY: help check-java start run serve compile build check clean

help:
	@printf '%s\n' \
	  'make serve    Start the Spring Boot application' \
	  'make start    Alias for make serve' \
	  'make run      Alias for make serve' \
	  'make compile  Compile the Java sources' \
	  'make build    Package the application' \
	  'make check    Run the Maven verification lifecycle' \
	  'make clean    Remove generated build files' \
	  'JAVA_HOME defaults to the JDK providing javac; override it with a JDK 17 or later.' \
	  'Build and run targets clean stale classes first; pass Maven options with MAVEN_ARGS.'

check-java:
	@test -x "$(JAVA_HOME)/bin/java" -a -x "$(JAVA_HOME)/bin/javac" || \
	  { printf '%s\n' 'Set JAVA_HOME to a complete JDK 17 or later (java and javac are required).' >&2; exit 1; }

start run: serve

serve: check-java
	@if command -v lsof >/dev/null 2>&1; then \
	  backend_pids=$$(lsof -t -- "$(CURDIR)/data/atlan-suites.mv.db" 2>/dev/null | sort -u); \
	  if [ -n "$$backend_pids" ]; then \
	    printf '%s\n' \
	      "Atlan Suites H2 database is already in use by process(es): $$backend_pids" \
	      'Reuse the running backend. To start another instance, stop the existing one first.'; \
	    exit 0; \
	  fi; \
	fi; \
	$(MVNW) $(MAVEN_ARGS) clean spring-boot:run

compile: check-java
	$(MVNW) $(MAVEN_ARGS) clean compile

build: check-java
	$(MVNW) $(MAVEN_ARGS) clean package

check: check-java
	$(MVNW) $(MAVEN_ARGS) clean verify

clean: check-java
	$(MVNW) $(MAVEN_ARGS) clean
