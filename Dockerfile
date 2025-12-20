FROM node:24-slim AS base

# PNPM setup
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN corepack enable

WORKDIR /app

# Dependencies installation
FROM base AS prod-deps
COPY package.json pnpm-lock.yaml ./
RUN pnpm install --prod --frozen-lockfile

FROM base
COPY --from=prod-deps /app/node_modules /app/node_modules

# Copy source code
COPY . .

EXPOSE 8000

USER node

CMD [ "node", "src/server.js" ]