# base node image
FROM node:18-alpine as base

# set for base and all layer that inherit from it
ENV NODE_ENV production

# Install openssl for Prisma
RUN apk -U update && apk add --no-cache openssl && rm -rf /var/cache/apk/*

# Install all node_modules, including dev dependencies
FROM base as deps

WORKDIR /app

COPY package.json yarn.lock ./
RUN yarn install --production=false

# Setup production node_modules
FROM base as production-deps

WORKDIR /app

COPY --from=deps /app/node_modules /app/node_modules
COPY package.json yarn.lock ./
RUN yarn install --production

# Build the app
FROM base as build

WORKDIR /app

COPY --from=deps /app/node_modules /app/node_modules

COPY package.json yarn.lock ./
COPY prisma .
RUN yarn prisma generate

COPY . .
RUN yarn build

# Finally, build the production image with minimal footprint
FROM base

WORKDIR /app

RUN addgroup -S arolitec && \
    adduser -S arolitec -G arolitec

COPY --from=production-deps /app/node_modules /app/node_modules
COPY --from=build /app/node_modules/.prisma /app/node_modules/.prisma

COPY --from=build /app/build /app/build
COPY --from=build /app/public /app/public
COPY . .

USER arolitec

CMD ["yarn", "start"]
