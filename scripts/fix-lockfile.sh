#!/bin/bash

# Fix npm lock file sync issue
# This script removes the old lock file and regenerates it with npm install

echo "Removing old package-lock.json..."
rm -f package-lock.json

echo "Running npm install to regenerate lock file..."
npm install

echo "Lock file has been successfully regenerated!"
