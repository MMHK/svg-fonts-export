FROM node:13-alpine

ENV HOST=127.0.0.1 PORT=3654

WORKDIR /app
COPY . /app

RUN apk --update add git less openssh && \
    rm -rf /var/lib/apt/lists/* && \
    rm /var/cache/apk/* && \
    cd /app && \
    yarn install


EXPOSE 3654

CMD yarn serve