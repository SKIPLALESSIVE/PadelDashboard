# --- Build : node + dépendances ---
FROM node:22-alpine AS build
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --no-audit --no-fund
COPY . .
RUN npm run build

# --- Runtime : nginx sert le build statique ---
FROM nginx:1.27-alpine
COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
# Port interne fixe : exposer sur n'importe quel port hôte via -p
EXPOSE 8080
CMD ["nginx", "-g", "daemon off;"]
