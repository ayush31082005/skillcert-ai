import mongoose from "mongoose";
import dns from "node:dns";

const connectDB = async () => {
  try {
    if (!process.env.MONGODB_URI) {
      throw new Error(
        "MONGODB_URI backend/.env file me add nahi hai"
      );
    }

    if (process.env.MONGODB_URI.startsWith("mongodb+srv://")) {
      try {
        dns.setServers(["8.8.8.8", "8.8.4.4", "1.1.1.1"]);
      } catch (dnsErr) {
        // Continue if setting custom DNS servers is restricted
      }
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