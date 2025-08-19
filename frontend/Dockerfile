FROM node:20-alpine
WORKDIR /app

COPY package.json ./
RUN corepack enable && corepack prepare pnpm@9 --activate

COPY tsconfig.json ./
COPY next.config.mjs ./
COPY postcss.config.js ./
COPY tailwind.config.ts ./
COPY app ./app
COPY components ./components
COPY lib ./lib

RUN pnpm install
RUN pnpm build

EXPOSE 3000
CMD ["pnpm","start"]
