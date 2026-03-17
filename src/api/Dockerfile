# Dockerfile for LLaMA.cpp API server
FROM golang:1.25-alpine AS builder

WORKDIR /app
COPY . .
RUN go mod tidy
RUN CGO_ENABLED=1 GOOS=linux GOARCH=amd64 go build -o server .

FROM alpine:latest
RUN apk --no-cache add ca-certificates
COPY --from=builder /app/server /app/server
EXPOSE 8080
ENV PORT=8080
CMD ["/app/server"]