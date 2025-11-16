# Usa Node 20 en Debian con soporte multi-arquitectura
FROM --platform=linux/amd64 node:20-bullseye

# Define el directorio de trabajo
WORKDIR /app

# Copia dependencias primero (para aprovechar cache)
COPY package*.json ./

# Instala dependencias (usa legacy-peer-deps para evitar conflictos)
RUN npm install --legacy-peer-deps

# Copia todo el proyecto
COPY . .

# Expone el puerto de Next.js
EXPOSE 3000

# Configura entorno y API key
ENV NODE_ENV=development
ENV NEXT_TELEMETRY_DISABLED=1
ENV NEXT_PUBLIC_GEMINI_API_KEY=${NEXT_PUBLIC_GEMINI_API_KEY}

# Ejecuta el servidor de desarrollo
CMD ["npm", "run", "dev"]