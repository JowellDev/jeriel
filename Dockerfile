FROM node:22-alpine AS base

ENV PNPM_VERSION="10.20.0"

RUN apk add --no-cache \
    openssl && \
    npm install -g corepack@latest && \
    corepack enable && \
    corepack prepare pnpm@${PNPM_VERSION} --activate

FROM base AS deps

WORKDIR /app

COPY package.json pnpm-lock.yaml ./

RUN --mount=type=cache,target=/root/.pnpm-store pnpm i --frozen-lockfile

FROM base AS production-deps

WORKDIR /app

COPY --from=deps /app/node_modules /app/node_modules

COPY package.json pnpm-lock.yaml ./

RUN --mount=type=cache,target=/root/.pnpm-store pnpm i --production --ignore-scripts

FROM base AS build

WORKDIR /app

COPY --from=deps /app/node_modules /app/node_modules

COPY package.json pnpm-lock.yaml ./

COPY prisma ./prisma

RUN pnpm db:generate

COPY . .

RUN pnpm build

FROM base

ENV PORT=3000
ENV NODE_ENV="production"

WORKDIR /app

COPY package.json pnpm-lock.yaml ./

COPY --from=production-deps /app/node_modules /app/node_modules

COPY --from=deps /app/node_modules/.bin/prisma /app/node_modules/.bin/prisma
COPY --from=build /app/node_modules/prisma /app/node_modules/prisma
COPY --from=build /app/node_modules/.pnpm /app/node_modules/.pnpm
COPY --from=build /app/node_modules/@prisma /app/node_modules/@prisma

COPY --from=build /app/prisma ./prisma
COPY --from=build /app/build /app/build
COPY --from=build /app/public /app/public
COPY --from=build /app/scripts /app/scripts

COPY entrypoint.sh .

RUN chmod +x ./entrypoint.sh

EXPOSE ${PORT}/tcp

ENTRYPOINT ["./entrypoint.sh"]