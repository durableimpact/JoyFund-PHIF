#!/bin/bash

# Script to delete all migration files except __init__.py
# Run from the backend directory

echo "Finding migration files..."

# Find all 0*.py migration files in migrations directories, excluding __init__.py
find . -path "*/migrations/0*.py" -type f ! -name "__init__.py" -delete

echo "Migration files deleted (excluding __init__.py)"
