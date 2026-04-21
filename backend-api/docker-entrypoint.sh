#!/bin/sh
set -e

echo "Waiting for MongoDB to accept connections..."

until node --input-type=module -e "
  import mongoose from 'mongoose';

  const mongoUri =
    process.env.MONGO_URI ||
    process.env.MONGODB_URI ||
    'mongodb://mongodb:27017/insurance-platform';

  try {
    await mongoose.connect(mongoUri, {
      serverSelectionTimeoutMS: 2000
    });
    await mongoose.connection.close();
    process.exit(0);
  } catch (error) {
    process.exit(1);
  }
"; do
  echo "MongoDB is not ready yet..."
  sleep 1
done

echo "MongoDB is ready."
echo "Seeding roles..."
npm run role_seed

echo "Starting backend..."
exec npm run dev