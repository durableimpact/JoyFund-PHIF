# ──────────────────────────────────────────────────────────────────────────────
# JoyFund-PHIF  –  Django + GeoDjango  (Python 3.12 / Alpine 3.20)
# ──────────────────────────────────────────────────────────────────────────────
FROM python:3.13.12-alpine3.23

# ── System labels ─────────────────────────────────────────────────────────────
LABEL maintainer="JoyFund-PHIF"
LABEL description="Django backend with GeoDjango support"

# ── System dependencies ───────────────────────────────────────────────────────
# gdal-dev / geos-dev / proj-dev   → GeoDjango PointField
# postgresql-dev                   → compile psycopg2 from source (musl-safe)
# gcc / musl-dev / g++             → C extensions (psycopg2, cffi, cryptography)
# libffi-dev                       → cryptography / jwcrypto
# jpeg-dev / zlib-dev              → Pillow
# gettext                          → Django i18n (.mo files)
RUN apk add --no-cache \
        gdal-dev \
        geos-dev \
        proj-dev \
        binutils \
        postgresql-dev \
        gcc \
        g++ \
        musl-dev \
        libffi-dev \
        jpeg-dev \
        zlib-dev \
        gettext

# ── GeoDjango geo library paths on Alpine ─────────────────────────────────────
# Django auto-discovers these via the env vars when they are set.
ENV GDAL_LIBRARY_PATH=/usr/lib/libgdal.so \
    GEOS_LIBRARY_PATH=/usr/lib/libgeos_c.so \
    PROJ_LIB=/usr/share/proj

# ── Python environment ────────────────────────────────────────────────────────
ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1

# ── Working directory ─────────────────────────────────────────────────────────
WORKDIR /app

# ── Python dependencies (cached layer) ───────────────────────────────────────
COPY requirements.txt .
RUN pip install --upgrade pip \
 && pip install --no-cache-dir -r requirements.txt

# ── Application source ────────────────────────────────────────────────────────
COPY . .

# ── Entrypoint script ─────────────────────────────────────────────────────────
COPY entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh

# ── Static / media volume mount points ───────────────────────────────────────
RUN mkdir -p /app/static /app/media

EXPOSE 8000

ENTRYPOINT ["/entrypoint.sh"]
