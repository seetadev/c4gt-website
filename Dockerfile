# Builder stage — pinned to bookworm; wkhtmltopdf is not in Debian trixie
FROM python:3.11-slim-bookworm AS builder

WORKDIR /app

RUN apt-get update && apt-get install -y --no-install-recommends \
    gcc \
    && rm -rf /var/lib/apt/lists/*

COPY requirements.txt .
RUN pip install --no-cache-dir --upgrade pip setuptools wheel \
    && pip install --no-cache-dir -r requirements.txt

# Final runtime stage
FROM python:3.11-slim-bookworm

WORKDIR /app

RUN apt-get update && apt-get install -y --no-install-recommends \
    libgomp1 \
    curl \
    php-cli \
    php-mbstring \
    php-xml \
    php-gd \
    php-zip \
    wkhtmltopdf \
    xvfb \
    && rm -rf /var/lib/apt/lists/*

# Install Composer
COPY --from=composer:latest /usr/bin/composer /usr/bin/composer

COPY --from=builder /usr/local/lib/python3.11/ /usr/local/lib/python3.11/
COPY --from=builder /usr/local/bin/ /usr/local/bin/

RUN useradd --create-home appuser

COPY . .

# Install PHP dependencies for Excel import/export
RUN cd excelinterop && composer install --no-dev --no-interaction && cd ..

# Create tmp directories required by HTMLToPDF and Import handlers
RUN mkdir -p excelinterop/tmp/tmp/preview \
    && chown -R appuser:appuser /app

USER appuser

ENV FLASK_APP=main.py
ENV FLASK_RUN_PORT=5000
ENV FLASK_RUN_HOST=0.0.0.0

EXPOSE 5000

HEALTHCHECK --interval=30s --timeout=5s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:5000/ || exit 1

CMD ["flask", "run", "--host=0.0.0.0", "--port=5000"]
