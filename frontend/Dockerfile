FROM node:24-alpine

# Install pnpm
RUN corepack enable && corepack prepare pnpm@9.15.9 --activate

WORKDIR /app

ARG INTERNAL_BACKEND_URL=http://localhost:8000
ARG NEXT_PUBLIC_API_URL=/api/v1
ARG NEXT_PUBLIC_DIRECT_API_URL=/api/v1
ARG NEXT_PUBLIC_BACKEND_URL=
ARG NEXT_PUBLIC_MAX_UPLOAD_SIZE=10485760
ENV INTERNAL_BACKEND_URL=$INTERNAL_BACKEND_URL
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL
ENV NEXT_PUBLIC_DIRECT_API_URL=$NEXT_PUBLIC_DIRECT_API_URL
ENV NEXT_PUBLIC_BACKEND_URL=$NEXT_PUBLIC_BACKEND_URL
ENV NEXT_PUBLIC_MAX_UPLOAD_SIZE=$NEXT_PUBLIC_MAX_UPLOAD_SIZE

# Copy package files
COPY package.json pnpm-lock.yaml ./

# Install native build tools required by some dependencies (e.g. sharp)
RUN apk add --no-cache build-base python3 vips-dev zlib-dev libjpeg-turbo-dev

# Install dependencies (allow build scripts to run inside the container).
# If pnpm ignores build scripts, approve them non-interactively and retry.
RUN pnpm install --frozen-lockfile --unsafe-perm || (pnpm approve-builds --all && pnpm install --frozen-lockfile --unsafe-perm)

# Copy source code
COPY . .

RUN pnpm build

EXPOSE 3000

CMD ["pnpm", "start"]
