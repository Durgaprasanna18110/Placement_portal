import { Job } from '../models/job.model.js';
import mongoose from 'mongoose';
import dotenv from 'dotenv';

// Suppress deprecation warnings
process.removeAllListeners('warning');

async function migrateApplicantCounts() {
  try {
    // Configure Mongoose
    mongoose.set('strictQuery', false);
    
    // Load environment variables from backend/.env
    dotenv.config({ path: './.env' });
    console.log('Loaded MONGO_URI:', process.env.MONGO_URI ? 'Found' : 'Missing');
    
    // Require MongoDB connection string
    if (!process.env.MONGO_URI) {
      console.error('Error: MONGO_URI environment variable is required');
      console.log('Please add your MongoDB connection string to .env file');
      process.exit(1);
    }
    const mongoUri = process.env.MONGO_URI;
    console.log('Using MongoDB URI:', mongoUri);
    
    // Add connection options
    await mongoose.connect(mongoUri, {
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 30000,
      connectTimeoutMS: 10000
    });
    console.log('Successfully connected to MongoDB');
    
    const jobs = await Job.find({});
    
    for (const job of jobs) {
      if (job.totalApplicants === undefined) {
        job.totalApplicants = job.applications?.length || 0;
        await job.save();
        console.log(`Updated count for job ${job._id}: ${job.totalApplicants}`);
      }
    }
    
    console.log('Migration completed successfully');
    process.exit(0);
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  }
}

migrateApplicantCounts();
