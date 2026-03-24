#!/bin/bash

# Script to delete all migration files except __init__.py
# Run from the backend directory

echo "Finding migration files..."

# Find all 0*.py migration files in local app migrations directories, excluding __init__.py
# Excludes the virtual environment (env/) to avoid deleting Django's own migrations
find . -path "*/migrations/0*.py" -type f ! -name "__init__.py" ! -path "./env/*" -delete

echo "Migration files deleted (excluding __init__.py)"
