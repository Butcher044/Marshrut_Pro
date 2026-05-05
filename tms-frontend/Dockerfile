FROM node:20-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN --mount=type=cache,target=/root/.npm \
    npm install --no-audit --no-fund
COPY . .
ARG VITE_YANDEX_MAPS_KEY
ENV VITE_YANDEX_MAPS_KEY=${VITE_YANDEX_MAPS_KEY}
RUN npm run build

FROM nginx:1.25-alpine
COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
