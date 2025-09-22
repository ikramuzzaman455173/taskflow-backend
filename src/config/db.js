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
const uri = process.env.MONGO_URL;
export const connectDB = async () => {
  try {
    console.log("Attempting to connect to database.....");
    await mongoose.connect(uri, {
       autoIndex: true,
    });
    console.log("Connected to database.....");
  } catch (error) {
    console.log("Failed to connect to database.....", error.message);
    process.exit(1);
  }
};
