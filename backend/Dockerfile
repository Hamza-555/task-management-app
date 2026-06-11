FROM golang:1.22-alpine AS builder

WORKDIR /app

RUN apk add --no-cache git

COPY . .

ENV GOFLAGS=-mod=mod
RUN go build -ldflags="-s -w" -o bin/server ./cmd/server

FROM alpine:3.19

WORKDIR /app

RUN apk add --no-cache ca-certificates tzdata

COPY --from=builder /app/bin/server .
COPY --from=builder /app/migrations ./migrations

EXPOSE 8080

CMD ["./server"]
