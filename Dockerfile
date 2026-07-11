# syntax=docker/dockerfile:1

# ── Build args (map from GitHub Actions secrets / repository variables) ────────
ARG FRAMELINE_ENABLE_LOCAL_VISION=false
ARG FRAMELINE_MODELS_DIR=/app/models
ARG PIPER_BIN=/app/models/piper/piper
ARG PIPER_VOICES_DIR=/app/models/piper/voices
ARG PIPER_DEFAULT_VOICE=amy

# ── deps ─────────────────────────────────────────────────────────────────────
FROM node:20-bookworm-slim AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci

# ── builder ──────────────────────────────────────────────────────────────────
FROM node:20-bookworm-slim AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

ENV NEXT_TELEMETRY_DISABLED=1
ENV NODE_ENV=production
ENV FRAMELINE_ENABLE_LOCAL_VISION=${FRAMELINE_ENABLE_LOCAL_VISION}

RUN npm run build

# Piper TTS only — production external-prompt workflow does not need Ollama.
# Models download ONCE here (image build). The runner stage copies /app/models
# into the final image; pods never re-run setup-models at container start.
RUN apt-get update \
  && apt-get install -y --no-install-recommends ca-certificates curl tar \
  && rm -rf /var/lib/apt/lists/* \
  && node scripts/setup-models.mjs --skip-ollama

# ── runner ───────────────────────────────────────────────────────────────────
FROM node:20-bookworm-slim AS runner
WORKDIR /app

ARG FRAMELINE_ENABLE_LOCAL_VISION=false
ARG FRAMELINE_MODELS_DIR=/app/models
ARG PIPER_BIN=/app/models/piper/piper
ARG PIPER_VOICES_DIR=/app/models/piper/voices
ARG PIPER_DEFAULT_VOICE=amy

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV HOSTNAME=0.0.0.0
ENV PORT=3000
ENV FRAMELINE_ENABLE_LOCAL_VISION=${FRAMELINE_ENABLE_LOCAL_VISION}
ENV FRAMELINE_MODELS_DIR=${FRAMELINE_MODELS_DIR}
ENV PIPER_BIN=${PIPER_BIN}
ENV PIPER_VOICES_DIR=${PIPER_VOICES_DIR}
ENV PIPER_DEFAULT_VOICE=${PIPER_DEFAULT_VOICE}

RUN apt-get update \
  && apt-get install -y --no-install-recommends ca-certificates libgomp1 \
  && rm -rf /var/lib/apt/lists/* \
  && groupadd --system --gid 1001 nodejs \
  && useradd --system --uid 1001 --gid nodejs nextjs

COPY --from=builder --chown=nextjs:nodejs /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
COPY --from=builder --chown=nextjs:nodejs /app/models ./models
COPY --from=builder --chown=nextjs:nodejs /app/locales ./locales
COPY --chown=nextjs:nodejs deploy/docker/entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh /app/models/piper/piper

USER nextjs
EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=5s --start-period=40s --retries=3 \
  CMD node -e "fetch('http://127.0.0.1:3000/').then((r)=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"

ENTRYPOINT ["/entrypoint.sh"]
