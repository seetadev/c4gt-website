# SocialCalc with Flask Backend

A Flask app serving the SocialCalc spreadsheet editor. Sheets and users are stored in an S3-compatible bucket (AWS S3, or MinIO for local development). A PHP/Composer module (`excelinterop`) handles Excel import/export, and `wkhtmltopdf` handles PDF export.

## Prerequisites

| Tool | Needed for |
|------|-----------|
| Python 3.11 | Flask app (`numpy>=2.1` requires Python 3.10+; `.python-version` pins 3.11) |
| PHP 8.x CLI with the `gd`, `mbstring`, `xml` and `zip` extensions | xlsx/xls import and export |
| Composer | PHP dependencies in `excelinterop/` |
| `wkhtmltopdf` | PDF export (without it, PDF export returns HTTP 501) |
| Docker with Compose v2 | Docker path (and a convenient local MinIO) |

Ubuntu:

```bash
sudo apt update
sudo apt install -y python3.11 python3.11-venv php-cli php-gd php-mbstring php-xml php-zip composer
sudo apt install -y wkhtmltopdf   # optional, for PDF export
```

Recent Ubuntu/Debian releases no longer ship `wkhtmltopdf` (the second command fails with "no installation candidate"); download a package from [wkhtmltopdf.org](https://wkhtmltopdf.org/downloads.html) or use Path A, whose image includes it. If your release does not ship `python3.11`, install Python with [uv](https://docs.astral.sh/uv/) (`uv venv --python 3.11 .venv`) instead of `python3.11 -m venv`.

## Local development

Clone and enter the repository:

```bash
git clone https://github.com/seetadev/c4gt-website.git
cd c4gt-website
```

### Path A: Docker Compose (recommended)

Starts the app, MinIO, and a one-shot job that creates the bucket. No AWS account needed.

```bash
cp .env.local.example .env.local
docker compose -f docker-compose.local.yml up --build
```

- App: http://localhost:5000
- MinIO console: http://localhost:9101 (login `minioadmin` / `minioadmin`, from `.env.local`)
- MinIO S3 API on the host: http://localhost:9100

Change the host ports with `MINIO_PORT` and `MINIO_CONSOLE_PORT` (defaults 9100 and 9101), for example `MINIO_PORT=9200 docker compose -f docker-compose.local.yml up --build`. Stop with `Ctrl+C`; `docker compose -f docker-compose.local.yml down -v` also removes the stored data.

### Path B: Native (Python 3.11)

You need any S3-compatible endpoint. The easiest is the MinIO from Path A:

```bash
cp .env.local.example .env.local
docker compose -f docker-compose.local.yml up -d minio createbuckets   # MinIO on localhost:9100
```

Then, from the repository root:

```bash
# PHP dependencies
(cd excelinterop && composer install)

# Python environment (Linux/macOS)
python3.11 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt

# Configuration: same values as .env.local, but pointing at the host-side MinIO port
cp .env.local.example .env
sed -i 's#http://minio:9000#http://localhost:9100#' .env

python main.py
```

On Windows use `py -3.11 -m venv .venv` and `.venv\Scripts\activate`, and edit `AWS_S3_ENDPOINT` in `.env` by hand.

Open http://127.0.0.1:5000, register an account, and open or create a sheet.

Notes:
- Run `python main.py` from the repository root. The import/export handlers use paths relative to it, and the app creates `excelinterop/tmp/tmp/preview` on startup.
- To use another MinIO or LocalStack, set `AWS_S3_ENDPOINT`, `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY` and `S3_BUCKET_NAME` in `.env`. The bucket is created automatically if it is missing.
- To use real AWS S3, start from `.env.example` and leave `AWS_S3_ENDPOINT` blank.
- Set `FLASK_DEBUG=true` for the Flask debugger and reloader. It is off by default.

## Known issues

- The browser console shows repeated `404` responses for `/broadcast` and `/updates` in the editor. Those are real-time collaboration endpoints implemented in the Tornado backend, not in this Flask app. Editing, saving and import/export are unaffected.
- The lost-password flow does not send email. With `FLASK_DEBUG=true` the reset link is printed to the server output; otherwise it is not shown anywhere.
- Import/export uses fixed file names under `excelinterop/tmp/`, so two users exporting at the same moment can overwrite each other's temporary files.
- Importing an xlsx file leaves `c:undefined` and `color:...:undefined` entries in the saved sheet string. The sheet still loads and displays correctly.
- MySQL settings in `.env.example` (`MYSQL_*`) are read but not used; the app does not query a database.
