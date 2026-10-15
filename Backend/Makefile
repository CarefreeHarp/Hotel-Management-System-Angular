.DEFAULT_GOAL := serve

MVNW ?= ./mvnw
MAVEN_ARGS ?=

.PHONY: help start run serve compile build test check clean

help:
	@printf '%s\n' \
	  'make serve    Start the Spring Boot application' \
	  'make start    Alias for make serve' \
	  'make run      Alias for make serve' \
	  'make compile  Compile the Java sources' \
	  'make build    Package the application and run tests' \
	  'make test     Run the configured tests' \
	  'make check    Run the Maven verification lifecycle' \
	  'make clean    Remove generated build files' \
	  'Set JAVA_HOME to a JDK 17 or later; pass Maven options with MAVEN_ARGS.'

start run: serve

serve:
	$(MVNW) $(MAVEN_ARGS) spring-boot:run

compile:
	$(MVNW) $(MAVEN_ARGS) compile

build:
	$(MVNW) $(MAVEN_ARGS) package

test:
	$(MVNW) $(MAVEN_ARGS) test

check:
	$(MVNW) $(MAVEN_ARGS) verify

clean:
	$(MVNW) $(MAVEN_ARGS) clean
