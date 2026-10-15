.DEFAULT_GOAL := serve

.PHONY: help install start serve build watch test typecheck check

help:
	@printf '%s\n' \
	  'make install    Install locked dependencies with npm ci' \
	  'make serve      Start the Angular development server' \
	  'make start      Alias for make serve' \
	  'make build      Create the production build' \
	  'make watch      Rebuild on changes in development mode' \
	  'make test       Run the configured test runner (no test cases yet)' \
	  'make typecheck  Check TypeScript, including all entity models' \
	  'make check      Run type checking and the production build'

install:
	npm ci

start: serve

serve:
	npm start

build:
	npm run build

watch:
	npm run watch

test:
	npm test

typecheck:
	./node_modules/.bin/tsc --noEmit -p tsconfig.json

check: typecheck build
