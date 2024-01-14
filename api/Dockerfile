FROM oven/bun:1.0.22-slim as base
WORKDIR /usr/src/app
COPY . .
# run the app
RUN apt update && apt upgrade && apt install curl -y && bun install
USER bun
EXPOSE 3000/tcp
ENTRYPOINT [ "bun", "start" ]