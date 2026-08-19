FROM node:20-alpine AS build
WORKDIR /app

ARG GOOGLE_CLIENT_ID=
COPY package*.json ./
RUN npm ci

COPY . .
RUN sed -i "s|__GOOGLE_CLIENT_ID__|${GOOGLE_CLIENT_ID}|" src/environments/environment.docker.ts
RUN npm run build -- --configuration docker

FROM nginx:alpine AS runtime
COPY --from=build /app/dist/farmacia-front/browser /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80
