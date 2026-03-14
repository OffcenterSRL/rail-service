FROM oven/bun:latest

WORKDIR /usr/src/app
COPY ./ /usr/src/app

CMD ["bun", "index.html"]