#!/bin/bash
# Fix Docker Compose container configuration error

echo "Stopping and removing existing containers..."
docker-compose down

echo "Removing old images..."
docker rmi puggle-game 2>/dev/null || echo "Image already removed"
docker rmi chinniproject_puggle 2>/dev/null || echo "Image already removed"

echo "Building fresh image..."
docker-compose build --no-cache

echo "Starting containers..."
docker-compose up -d

echo "Checking status..."
docker-compose ps

echo "Done! View logs with: docker-compose logs -f"
