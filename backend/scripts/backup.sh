#!/bin/bash

# Exit on any error
set -e

# Configuration
BACKUP_DIR="/app/backups"
DB_CONTAINER="mediledger_db"
DB_USER="postgres"
DB_NAME="mediledger"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
BACKUP_FILE="${BACKUP_DIR}/mediledger_backup_${TIMESTAMP}.sql"

echo "Starting automated backup for MediLedger..."

# Ensure backup directory exists
mkdir -p "${BACKUP_DIR}"

# Run pg_dump against the running Postgres container
echo "Running pg_dump on container ${DB_CONTAINER}..."
docker exec -t "${DB_CONTAINER}" pg_dump -U "${DB_USER}" -d "${DB_NAME}" > "${BACKUP_FILE}"

# Compress the backup file to save space
gzip "${BACKUP_FILE}"
echo "Backup saved and compressed: ${BACKUP_FILE}.gz"

# Retain only the last 30 days of backups
echo "Cleaning up backups older than 30 days..."
find "${BACKUP_DIR}" -name "mediledger_backup_*.sql.gz" -mtime +30 -type f -delete

echo "Backup process finished successfully."
