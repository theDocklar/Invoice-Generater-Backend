import express from "express";
import {
  generateInvoicePDF,
  previewInvoicePDF,
} from "../controllers/pdfController.js";
import {
  createInvoice,
  getNextInvoiceNumber,
  getInvoiceById,
  getAllInvoices,
  updateInvoice,
  deleteInvoice,
} from "../controllers/invoiceController.js";
import { protect } from "../middlewares/auth.js";

const router = express.Router();

// All routes require authentication
router.use(protect);

router.get("/next-invoice-number", getNextInvoiceNumber);
router.post("/create-invoice", createInvoice);
router.get("/view/:id", getInvoiceById);
router.get("/all-invoices", getAllInvoices);
router.get("/download/:id", generateInvoicePDF);
router.get("/preview/:id", previewInvoicePDF);
router.put("/update/:id", updateInvoice);
router.delete("/delete-invoice/:id", deleteInvoice);

export default router;
