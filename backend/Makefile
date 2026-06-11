.PHONY: dev build run migrate-up migrate-down test lint

BINARY=bin/server
MIGRATE=github.com/golang-migrate/migrate/v4/cmd/migrate@latest

dev:
	air -c .air.toml

build:
	go build -ldflags="-s -w" -o $(BINARY) ./cmd/server

run: build
	./$(BINARY)

migrate-up:
	go run -tags 'postgres' $(MIGRATE) -path ./migrations -database "$(shell grep POSTGRES ./$(ENV_FILE) | sed 's/.*=//g' | tr '\n' ' ')" up

migrate-down:
	go run -tags 'postgres' $(MIGRATE) -path ./migrations -database "$(shell grep POSTGRES ./$(ENV_FILE) | sed 's/.*=//g' | tr '\n' ' ')" down 1

test:
	go test ./... -v -race -count=1

lint:
	golangci-lint run ./...

sqlc:
	sqlc generate
