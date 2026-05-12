FROM node:22-alpine3.22 AS base

ENV PNPM_VERSION="10.28.0"

RUN apk add --no-cache openssl && \
    npm install -g corepack@latest && \
    corepack enable && \
    corepack prepare pnpm@${PNPM_VERSION} --activate

FROM base AS deps

WORKDIR /app

COPY package.json pnpm-lock.yaml ./
COPY prisma ./prisma

RUN --mount=type=cache,id=pnpm-store,target=/root/.local/share/pnpm/store \
    pnpm i --frozen-lockfile

RUN pnpm db:generate


FROM deps AS build

COPY . .

RUN pnpm build

FROM base AS production

ENV PORT=3000
ENV NODE_ENV="production"

WORKDIR /app

COPY package.json pnpm-lock.yaml ./
COPY prisma ./prisma

RUN --mount=type=cache,id=pnpm-store,target=/root/.local/share/pnpm/store \
    pnpm i --frozen-lockfile --prod


COPY --from=deps /app/node_modules/prisma ./node_modules/prisma
COPY --from=deps /app/node_modules/.bin/prisma ./node_modules/.bin/prisma

RUN pnpm db:generate

COPY --from=build /app/build ./build
COPY --from=build /app/public ./public
COPY --from=build /app/scripts ./scripts

COPY entrypoint.sh .
RUN chmod +x ./entrypoint.sh

EXPOSE ${PORT}/tcp

ENTRYPOINT ["./entrypoint.sh"]
