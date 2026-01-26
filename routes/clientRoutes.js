import express from "express";
import {
  createClient,
  getAllClients,
  getClientById,
  updateClient,
  deleteClient,
} from "../controllers/clientController.js";
import { protect } from "../middlewares/auth.js";

const router = express.Router();

// All routes require authentication
router.use(protect);

router.post("/create-client", createClient);
router.get("/all-clients", getAllClients);
router.get("/:id", getClientById);
router.put("/:id", updateClient);
router.delete("/:id", deleteClient);

export default router;
