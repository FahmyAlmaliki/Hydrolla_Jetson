FROM python:3.11-slim

WORKDIR /app

RUN apt-get update && apt-get install -y --no-install-recommends \
    gcc \
    && rm -rf /var/lib/apt/lists/*

COPY ai_inference_requirements.txt .
RUN pip install --no-cache-dir -r ai_inference_requirements.txt

COPY ai_models/ ./ai_models/
COPY ai_inference_service.py .

ENV PYTHONUNBUFFERED=1

CMD ["python", "ai_inference_service.py"]
