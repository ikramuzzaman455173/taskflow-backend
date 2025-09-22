// import mongoose from 'mongoose';

// export async function connectDB(uri) {
//   mongoose.set('strictQuery', true);
//   await mongoose.connect(uri, {
//     autoIndex: true,
//   });
//   return mongoose.connection;
// }

import dotenv from "dotenv";
import mongoose from "mongoose";
dotenv.config();
export const connectDB = async () => {
  try {
    console.log("Attempting to connect to database.....");
    await mongoose.connect(process.env.MONGO_URI, {
      autoIndex: true
    });
    console.log("Connected to database.....");
  } catch (error) {
    console.log("Failed to connect to database.....", error.message);
    process.exit(1);
  }
};
