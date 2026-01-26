import User from "../models/userModel.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

const userService = {
  // Generate JWT token
  generateToken(userId) {
    return jwt.sign({ id: userId }, process.env.JWT_SECRET, {
      expiresIn: process.env.JWT_EXPIRE || "7d",
    });
  },

  // Validate password strength
  validatePassword(password) {
    const minLength = 8;
    const hasUpperCase = /[A-Z]/.test(password);
    const hasLowerCase = /[a-z]/.test(password);
    const hasNumber = /[0-9]/.test(password);
    const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);

    const errors = [];

    if (password.length < minLength) {
      errors.push(`Password must be at least ${minLength} characters long`);
    }
    if (!hasUpperCase) {
      errors.push("Password must contain at least one uppercase letter");
    }
    if (!hasLowerCase) {
      errors.push("Password must contain at least one lowercase letter");
    }
    if (!hasNumber) {
      errors.push("Password must contain at least one number");
    }
    if (!hasSpecialChar) {
      errors.push("Password must contain at least one special character");
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  },

  // User Registration
  async registerUser(userData) {
    const { email, password, confirmPassword } = userData;

    if (password !== confirmPassword) {
      throw new Error("Passwords do not match");
    }

    // Validate password strength
    const passwordValidation = this.validatePassword(password);
    if (!passwordValidation.isValid) {
      throw new Error(passwordValidation.errors.join(". "));
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      throw new Error("User already exists with this email");
    }

    const salt = await bcrypt.genSalt(12);
    const hashedPassword = await bcrypt.hash(password, salt);

    const user = await User.create({
      email,
      password: hashedPassword,
    });

    const token = this.generateToken(user._id);

    return {
      user: { id: user._id, email: user.email },
      token,
    };
  },

  // User Login
  async loginUser(email, password) {
    const user = await User.findOne({ email });

    if (!user) {
      throw new Error("Invalid credentials");
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      throw new Error("Invalid credentials");
    }

    const token = this.generateToken(user._id);

    return {
      user: { id: user._id, email: user.email },
      token,
    };
  },

  // Get currently logged in user
  async getCurrentUser(userId) {
    const user = await User.findById(userId).select("-password");

    if (!user) {
      throw new Error("User not found");
    }

    return {
      id: user._id,
      email: user.email,
      createdAt: user.createdAt,
    };
  },

  // Logout user
  async logoutUser() {
    // Cookie clearing happens in controller
    // This is for consistency and potential future logout logging
    return {
      message: "User logged out successfully",
    };
  },

  // Update user details
  async updateUser(userId, newData) {},

  // Delete User
  async deleteUser(userId) {
    const user = await User.findByIdAndDelete(userId);
    if (!user) {
      throw new Error("User not found");
    }
    return {
      id: user._id,
      email: user.email,
    };
  },
};

export default userService;
