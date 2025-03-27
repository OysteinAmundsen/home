# use the official Bun image
# see all versions at https://hub.docker.com/r/oven/bun/tags
FROM oven/bun:1 AS base
WORKDIR /usr/src/app
RUN apt-get update && \
    apt-get install -y \
      git \
      unzip \
      # tools needed for whisper ai
      python3 \
      python3-pip \
      ffmpeg && \
    ln -s /usr/bin/python3 /usr/bin/python

# install dependencies into temp directory
# this will cache them and speed up future builds
FROM base AS builder
COPY package.json bun.lock ./
RUN bun install --frozen-lockfile
COPY . .

# Currently hangs because of https://github.com/nrwl/nx/issues/27494
# That's why we skip this step and build the app before we build our docker image.
# The locally built app is copied into the builder image in the previous step.
# RUN export NX_DAEMON=false NX_ISOLATE_PLUGINS=false NX_VERBOSE_LOGGING=true && \
#     bun run nx run home:build:production --skip-nx-cache --verbose && \
#     bun run build:wb

# copy compiled code into final image
FROM base AS release

# Install whisper
RUN python -m pip install --upgrade pip && \
    pip install Flask faster-whisper && \
    python -c "from faster_whisper import WhisperModel; WhisperModel('NbAiLab/nb-whisper-small', device='cpu', compute_type='int8')"

# Don't know yet if having node_modules in the final image is needed.
# If it is, we probably should install a production version
# of our dependencies in the builder stage and copy them here.
# COPY --from=builder /usr/src/app/node_modules ./node_modules
COPY --from=builder /usr/src/app/dist/ .
COPY --from=builder /usr/src/app/.env .
COPY --from=builder /usr/src/app/apps/whisper/ ./apps/whisper/
COPY --from=builder /usr/src/app/package.json .

# run the app
USER bun
EXPOSE 4200/tcp
ENTRYPOINT [ "bun", "apps/frontend/server/server.mjs" ]
