# ─────────────────────────────────────────────────────────────────
#  Hydrolla Telegram Bot — Dockerfile
#  Python 3.12 slim image untuk ukuran minimal
# ─────────────────────────────────────────────────────────────────

FROM python:3.12-slim

# Set working directory
WORKDIR /app

# Install dependencies dulu (layer cache lebih efisien)
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy source code
COPY bot.py .

# Jalankan bot
CMD ["python", "-u", "bot.py"]
