import "dotenv/config";

import bcrypt from "bcryptjs";

import connectDB from "../src/config/db.js";
import User from "../src/models/User.js";

const createAdmin = async () => {
  try {
    await connectDB();

    const name =
      process.env.ADMIN_NAME || "SkillCert Admin";

    const email = process.env.ADMIN_EMAIL
      ?.trim()
      .toLowerCase();

    const password = process.env.ADMIN_PASSWORD;

    if (!email || !password) {
      throw new Error(
        "ADMIN_EMAIL aur ADMIN_PASSWORD .env file me add karo"
      );
    }

    const hashedPassword = await bcrypt.hash(
      password,
      12
    );

    const existingUser = await User.findOne({
      email,
    }).select("+password");

    if (existingUser) {
      existingUser.name = name;
      existingUser.password = hashedPassword;
      existingUser.role = "admin";
      existingUser.isActive = true;

      await existingUser.save();

      console.log(
        "Existing user successfully admin bana diya gaya"
      );
    } else {
      await User.create({
        name,
        email,
        password: hashedPassword,
        role: "admin",
        isActive: true,
      });

      console.log("Admin created successfully");
    }

    console.log(`Admin email: ${email}`);

    process.exit(0);
  } catch (error) {
    console.error(
      `Admin creation error: ${error.message}`
    );

    process.exit(1);
  }
};

createAdmin();