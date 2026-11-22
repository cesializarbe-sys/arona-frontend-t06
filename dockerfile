# =========================
# Etapa 1: Build React + Vite
# =========================
FROM node:20 AS build

ARG VITE_BASE_PATH=/
ENV VITE_BASE_PATH=${VITE_BASE_PATH}

WORKDIR /app

COPY package*.json ./

RUN npm install --legacy-peer-deps

COPY . .

RUN npm run build

# =========================
# Etapa 2: NGINX
# =========================
FROM nginx:alpine

# Copiamos los archivos estáticos generados por Vite
COPY --from=build /app/dist /usr/share/nginx/html

# Configuración del servidor y proxy inverso NGINX (despliegue en raíz '/')
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80
