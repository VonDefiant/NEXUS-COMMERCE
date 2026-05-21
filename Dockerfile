# Dockerfile (Para Railway / Tu Cloud Propio - SaaS)
# Esta versión CONTIENE tu código original (protegido por Railway) y es más rápida de actualizar.

FROM node:20-alpine

WORKDIR /app

# 1. Copiamos manifiestos y prisma
COPY package*.json ./
COPY prisma ./prisma/

# 2. Instalamos todas las dependencias (incluyendo devDependencies para compilar)
RUN npm ci

# 3. Generamos Prisma (vital para conectarse a tu base de datos cloud)
RUN npx prisma generate

# 4. Copiamos el código fuente de tu app
COPY . .

# 5. Compilamos el frontend (React/Vite -> /dist)
RUN npm run build

# 6. Exponemos el puerto
ENV NODE_ENV=production
ENV PORT=3000
EXPOSE 3000

# 7. Ejecutamos el servidor como lo harías normalmente
CMD ["npm", "start"]
