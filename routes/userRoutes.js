import express from "express";
import {
  registerUser,
  loginUser,
  logoutUser,
  getCurrentUser,
  deleteUser,
} from "../controllers/userController.js";
import { protect } from "../middlewares/auth.js";

const router = express.Router();

// Public Routes
router.post("/register", registerUser);
router.post("/login", loginUser);

// Protected Routes
router.get("/me", protect, getCurrentUser);
router.delete("/:id", protect, deleteUser);
router.post("/logout", protect, logoutUser);


export default router;
