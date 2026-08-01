#!/bin/sh

# This script triggers the TypeScript cloud backup script
echo "Starting Cloud Backup via TypeScript script..."
pnpm dlx tsx src/scripts/cloud-backup.ts
