.DEFAULT_GOAL := serve

.PHONY: help install dependencies start run serve compile build watch typecheck check

help:
	@printf '%s\n' \
	  'make install    Install locked dependencies with npm ci' \
	  'make serve      Start the Angular development server' \
	  'make start      Alias for make serve' \
	  'make run        Alias for make serve' \
	  'make compile    Alias for make build' \
	  'make build      Create the production build' \
	  'make watch      Rebuild on changes in development mode' \
	  'make typecheck  Check TypeScript, including all entity models' \
	  'make check      Run type checking and the production build'

install:
	npm ci
	touch node_modules/.make-install-stamp

# A successful install is shared by all targets, including parallel checks.
node_modules/.make-install-stamp: package.json package-lock.json
	npm ci
	touch $@

dependencies: node_modules/.make-install-stamp

start run: serve

serve: dependencies
	npm start

compile: build

build: dependencies
	npm run build

watch: dependencies
	npm run watch

typecheck: dependencies
	./node_modules/.bin/tsc --noEmit -p tsconfig.json

check: typecheck build
