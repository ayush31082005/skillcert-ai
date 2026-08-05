import mongoose from "mongoose";

const connectDB = async () => {
  try {
    if (!process.env.MONGODB_URI) {
      throw new Error(
        "MONGODB_URI backend/.env file me add nahi hai"
      );
    }

    mongoose.set("strictQuery", true);

    const connection = await mongoose.connect(
      process.env.MONGODB_URI,
      {
        serverSelectionTimeoutMS: 10000,
      }
    );

    console.log(
      `MongoDB connected successfully: ${connection.connection.host}`
    );

    return connection;
  } catch (error) {
    console.error(
      `MongoDB connection error: ${error.message}`
    );

    throw error;
  }
};

export default connectDB;