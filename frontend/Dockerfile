# Build static assets (empty VITE_API_URL = same-origin; nginx proxies API paths — see nginx.conf for /tickets vs SPA)
FROM node:20-alpine AS build
WORKDIR /app

COPY package.json ./
RUN npm install

COPY . .
ENV VITE_API_URL=

# FIX: Limit Node's memory to 768MB to prevent the Droplet from freezing
RUN NODE_OPTIONS="--max-old-space-size=768" npm run build

FROM nginx:1.27-alpine
COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
