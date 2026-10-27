.DEFAULT_GOAL := serve

.PHONY: help install dependencies start run serve compile build watch typecheck i18n check

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
	  'make i18n       Check translation keys and hardcoded template text' \
	  'make check      Run type checking, the translation check and the production build'

install:
	npm ci
	touch node_modules/.make-install-stamp

# La instalación completa se comparte entre objetivos, incluso al ejecutar comprobaciones en paralelo.
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

# Solo usa Node: no necesita dependencias instaladas.
i18n:
	node scripts/check-i18n.mjs

check: typecheck i18n build
