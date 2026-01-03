#!/bin/bash
# Complete Docker cleanup and rebuild

echo "Step 1: Force stop all puggle containers..."
docker stop puggle-game 2>/dev/null || true

echo "Step 2: Force remove puggle containers..."
docker rm -f puggle-game 2>/dev/null || true

echo "Step 3: Remove all puggle images..."
docker rmi -f $(docker images | grep puggle | awk '{print $3}') 2>/dev/null || true
docker rmi -f $(docker images | grep chinniproject | awk '{print $3}') 2>/dev/null || true

echo "Step 4: Remove dangling volumes..."
docker volume rm chinniproject_ratings-data 2>/dev/null || echo "Volume doesn't exist yet"

echo "Step 5: Prune system (removes unused data)..."
docker system prune -f

echo "Step 6: Rebuild image from scratch..."
docker-compose build --no-cache --pull

echo "Step 7: Create and start containers..."
docker-compose up -d

echo "Step 8: Check status..."
docker-compose ps

echo ""
echo "✅ Done! Check logs with: docker-compose logs -f"
