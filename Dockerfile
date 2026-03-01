# Multi-stage build for Trading Engineer
# Stage 1: Build Frontend
FROM node:18-alpine AS frontend-build
WORKDIR /app/frontend
COPY frontend/package*.json ./
RUN npm ci
COPY frontend/ ./
RUN npm run build

# Stage 2: Python Backend + Serve Frontend
FROM python:3.11-slim
WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    gcc \
    && rm -rf /var/lib/apt/lists/*

# Install Python dependencies (lightweight for Render - no torch/transformers)
COPY requirements-render.txt .
RUN pip install --no-cache-dir -r requirements-render.txt

# Copy backend code
COPY . .

# Copy frontend build to serve as static files
COPY --from=frontend-build /app/frontend/dist ./frontend/dist

# Create data directory
RUN mkdir -p ai_stock/data

# Expose port (Render uses PORT env variable)
EXPOSE 10000

# Start command - use Render's PORT env variable
CMD ["sh", "-c", "uvicorn main:app --host 0.0.0.0 --port ${PORT:-10000}"]
