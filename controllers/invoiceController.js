import invoiceService from "../services/invoiceService.js";
import clientService from "../services/clientService.js";

// Get next invoice number
export const getNextInvoiceNumber = async (req, res) => {
  try {
    const invoiceNumber = await invoiceService.generateInvoiceNumber(
      req.user._id,
    );
    res.status(200).json({
      success: true,
      data: { invoiceNumber },
    });
  } catch (error) {
    console.error("Error generating invoice number:", error);
    res.status(500).json({
      success: false,
      message: "Failed to generate invoice number",
      error: error.message,
    });
  }
};

// Create a new invoice
export const createInvoice = async (req, res) => {
  try {
    const invoiceData = req.body;

    // Validation
    if (!invoiceData.dueDate) {
      return res.status(400).json({
        success: false,
        message: "Due date is required",
      });
    }

    if (!invoiceData.client) {
      return res.status(400).json({
        success: false,
        message: "Client information is required",
      });
    }

    if (!invoiceData.lineItems || invoiceData.lineItems.length === 0) {
      return res.status(400).json({
        success: false,
        message: "At least one line item is required",
      });
    }

    // Check if client exists
    const { client, isNew } = await clientService.findOrCreateClient(
      invoiceData.client,
      req.user._id,
    );

    invoiceData.client.clientId = client._id;

    const newInvoice = await invoiceService.createInvoice(
      invoiceData,
      req.user._id,
    );

    res.status(201).json({
      success: true,
      message: "Invoice created successfully",
      data: newInvoice,
    });
  } catch (error) {
    console.error("Error creating invoice:", error);

    if (error.name === "ValidationError") {
      const errors = Object.values(error.errors).map((err) => err.message);
      return res.status(400).json({
        success: false,
        message: "Validation failed",
        errors,
      });
    }

    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: "Invoice number already exists",
      });
    }

    res.status(500).json({
      success: false,
      message: "Failed to create invoice",
      error: error.message,
    });
  }
};

// Get all invoices
export const getAllInvoices = async (req, res) => {
  try {
    const invoices = await invoiceService.getAllInvoices(req.user._id);
    res.status(200).json({
      success: true,
      count: invoices.length,
      data: invoices,
    });
  } catch (error) {
    console.error("Error fetching clients: ", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch clients",
      error: error.message,
    });
  }
};

// Get invoice by ID
export const getInvoiceById = async (req, res) => {
  try {
    const { id } = req.params;

    const invoice = await invoiceService.getInvoiceById(id, req.user._id);

    res.status(200).json({
      success: true,
      data: invoice,
    });
  } catch (error) {
    console.error("Get Invoice Error:", error);
    res.status(404).json({
      success: false,
      message: error.message || "Invoice not found",
      error: error.message,
    });
  }
};

// Update invoice
export const updateInvoice = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    const updatedInvoice = await invoiceService.updateInvoice(
      id,
      updateData,
      req.user._id,
    );

    res.status(200).json({
      success: true,
      message: "Invoice updated successfully",
      data: updatedInvoice,
    });
  } catch (error) {
    console.error("Update Invoice Error:", error);
    res.status(400).json({
      success: false,
      message: error.message || "Failed to update invoice",
      error: error.message,
    });
  }
};

// Delete invoice
export const deleteInvoice = async (req, res) => {
  try {
    const { id } = req.params;
    const deletedInvoice = await invoiceService.deleteInvoice(id, req.user._id);

    res.status(200).json({
      success: true,
      message: "Invoice deleted successfully",
      data: deletedInvoice,
    });
  } catch (error) {
    console.error("Error deleting client: ", error);

    if (error.message === "Invoice not found") {
      return res.status(404).json({
        success: false,
        message: error.message,
      });
    }

    res.status(500).json({
      success: false,
      message: "Failed to delete invoice",
      error: error.message,
    });
  }
};
