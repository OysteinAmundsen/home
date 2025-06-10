###########################################
# Base image for building and running the application
#
#
###########################################
FROM node:22-slim AS base
WORKDIR /usr/src/app

# Install dependencies and prerequisites
RUN apt-get update && \
    apt-get install -y --no-install-recommends \
      git \
      unzip \
      curl \
      # tools needed for whisper ai
      python3 \
      python3-pip \
      python3-venv \
      ffmpeg && \
    # Install bun
    curl -fsSL https://bun.sh/install | bash && \
    # Install whisper dependencies
    ln -s /usr/bin/python3 /usr/bin/python && \
    python -m pip install --upgrade pip --break-system-packages && \
    python -m venv /opt/venv && \
    . /opt/venv/bin/activate && \
    pip install Flask faster-whisper --break-system-packages && \
    python -c "from faster_whisper import WhisperModel; WhisperModel('NbAiLab/nb-whisper-small', device='cpu', compute_type='int8')" && \
    # Clean up
    apt-get clean && rm -rf /var/lib/apt/lists/* /tmp/* /var/tmp/*

# Ensure bun and virtual environment are available in all stages
ENV BUN_INSTALL="/root/.bun"
ENV PATH="$BUN_INSTALL/bin:/opt/venv/bin:$PATH"

###########################################
# Install layer for dependencies
###########################################
FROM base AS installer
RUN mkdir -p /temp/dev
COPY package.json bun.lock /temp/dev/
RUN cd /temp/dev && bun install --frozen-lockfile

# install with --production (exclude devDependencies)
RUN mkdir -p /temp/prod
COPY package.json bun.lock /temp/prod/
RUN cd /temp/prod && bun install --frozen-lockfile --production

###########################################
# Builder stage
###########################################
FROM base AS builder
COPY --from=installer /temp/dev/node_modules ./node_modules
COPY . .

RUN export NX_DAEMON=false NX_ISOLATE_PLUGINS=false && \
    bun run nx run dash:build:production --skip-nx-cache && \
    bun run build:wb

###########################################
# Final image for running the application
###########################################
FROM base AS release

# Copy production dependencies
COPY --from=installer /temp/prod/node_modules ./node_modules

# Copy other necessary files
COPY --from=builder /usr/src/app/dist/ .
COPY --from=builder /usr/src/app/.env .
COPY --from=builder /usr/src/app/apps/whisper/ ./apps/whisper/
COPY --from=builder /usr/src/app/package.json .

# run the app
EXPOSE 4200/tcp
ENTRYPOINT [ "bun", "apps/dash/server/server.mjs" ]
