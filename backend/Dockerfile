FROM python:3.12-slim

WORKDIR /app
ENV PYTHONUNBUFFERED=1 PIP_NO_CACHE_DIR=1

COPY pyproject.toml ./
COPY app ./app
RUN pip install --upgrade pip && pip install .

EXPOSE 8000
# Fly sets $PORT and terminates TLS in front of us; --proxy-headers +
# --forwarded-allow-ips makes request URLs honor X-Forwarded-Proto (https), so
# generated image URLs are https and don't trip mixed-content blocking.
CMD ["sh", "-c", "uvicorn app.main:app --host 0.0.0.0 --port ${PORT:-8000} --proxy-headers --forwarded-allow-ips='*'"]
