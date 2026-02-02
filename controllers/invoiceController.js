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

    // Detailed validation
    const validationErrors = [];

    if (!invoiceData.invoiceDate) {
      validationErrors.push({
        field: "invoiceDate",
        message: "Invoice date is required",
      });
    }

    if (!invoiceData.dueDate) {
      validationErrors.push({
        field: "dueDate",
        message: "Due date is required",
      });
    }

    if (
      invoiceData.dueDate &&
      invoiceData.invoiceDate &&
      invoiceData.dueDate < invoiceData.invoiceDate
    ) {
      validationErrors.push({
        field: "dueDate",
        message: "Due date must be after invoice date",
      });
    }

    if (!invoiceData.client) {
      validationErrors.push({
        field: "client",
        message: "Client information is required",
      });
    } else {
      if (!invoiceData.client.name || invoiceData.client.name.trim() === "") {
        validationErrors.push({
          field: "clientName",
          message: "Client name is required",
        });
      }
      if (!invoiceData.client.email || invoiceData.client.email.trim() === "") {
        validationErrors.push({
          field: "clientEmail",
          message: "Client email is required",
        });
      } else {
        // Basic email validation
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(invoiceData.client.email)) {
          validationErrors.push({
            field: "clientEmail",
            message: "Please enter a valid email address",
          });
        }
      }
    }

    if (!invoiceData.lineItems || invoiceData.lineItems.length === 0) {
      validationErrors.push({
        field: "lineItems",
        message: "At least one line item is required",
      });
    } else {
      // Validate each line item
      invoiceData.lineItems.forEach((item, index) => {
        if (!item.description || item.description.trim() === "") {
          validationErrors.push({
            field: `lineItem${index}Description`,
            message: `Line item ${index + 1}: Description is required`,
          });
        }
        if (!item.quantity || item.quantity === "" || item.quantity <= 0) {
          validationErrors.push({
            field: `lineItem${index}Quantity`,
            message: `Line item ${index + 1}: Quantity must be greater than 0`,
          });
        }
        if (
          item.unitPrice === undefined ||
          item.unitPrice === null ||
          item.unitPrice === "" ||
          item.unitPrice < 0
        ) {
          validationErrors.push({
            field: `lineItem${index}UnitPrice`,
            message: `Line item ${index + 1}: Unit price is required and cannot be negative`,
          });
        }
      });
    }

    if (validationErrors.length > 0) {
      return res.status(400).json({
        success: false,
        message: "Please fix the following errors",
        errors: validationErrors,
      });
    }

    // Resolve client (validate, fetch existing, or create new)
    const client = await clientService.resolveClientForInvoice(
      invoiceData.client,
      req.user._id,
    );

    // Use the client data from database
    invoiceData.client = {
      clientId: client._id,
      name: client.name,
      company: client.companyName || "",
      address: client.address || "",
      email: client.email,
      phone: client.mobile || "",
    };

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

    // Handle client email duplicate error
    if (error.field === "clientEmail" && error.statusCode === 400) {
      return res.status(400).json({
        success: false,
        message: error.message,
        errors: [
          {
            field: error.field,
            message: error.message,
          },
        ],
      });
    }

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

    const validationErrors = [];

    if (
      updateData.invoiceDate &&
      updateData.dueDate &&
      updateData.dueDate < updateData.invoiceDate
    ) {
      validationErrors.push({
        field: "dueDate",
        message: "Due date must be after invoice date",
      });
    }

    if (updateData.client) {
      if (!updateData.client.name || updateData.client.name.trim() === "") {
        validationErrors.push({
          field: "clientName",
          message: "Client name is required",
        });
      }
      if (!updateData.client.email || updateData.client.email.trim() === "") {
        validationErrors.push({
          field: "clientEmail",
          message: "Client email is required",
        });
      } else {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(updateData.client.email)) {
          validationErrors.push({
            field: "clientEmail",
            message: "Please enter a valid email address",
          });
        }
      }
    }

    if (updateData.lineItems && updateData.lineItems.length > 0) {
      updateData.lineItems.forEach((item, index) => {
        if (!item.description || item.description.trim() === "") {
          validationErrors.push({
            field: `lineItem${index}Description`,
            message: `Line item ${index + 1}: Description is required`,
          });
        }
        if (!item.quantity || item.quantity === "" || item.quantity <= 0) {
          validationErrors.push({
            field: `lineItem${index}Quantity`,
            message: `Line item ${index + 1}: Quantity must be greater than 0`,
          });
        }
        if (
          item.unitPrice === undefined ||
          item.unitPrice === null ||
          item.unitPrice === "" ||
          item.unitPrice < 0
        ) {
          validationErrors.push({
            field: `lineItem${index}UnitPrice`,
            message: `Line item ${index + 1}: Unit price is required and cannot be negative`,
          });
        }
      });
    }

    if (validationErrors.length > 0) {
      return res.status(400).json({
        success: false,
        message: "Please fix the following errors",
        errors: validationErrors,
      });
    }

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

    if (error.name === "ValidationError") {
      const errors = Object.values(error.errors).map((err) => ({
        field: err.path,
        message: err.message,
      }));
      return res.status(400).json({
        success: false,
        message: "Validation failed",
        errors,
      });
    }

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

// Update invoice status
export const updateInvoiceStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!status) {
      return res.status(400).json({
        success: false,
        message: "Status is required",
      });
    }

    const updatedInvoice = await invoiceService.updateInvoiceStatus(
      id,
      status,
      req.user._id,
    );

    res.status(200).json({
      success: true,
      message: "Invoice status updated successfully",
      data: updatedInvoice,
    });
  } catch (error) {
    console.error("Update Invoice Status Error:", error);

    if (error.message === "Invoice not found") {
      return res.status(404).json({
        success: false,
        message: error.message,
      });
    }

    if (error.message.includes("Invalid status")) {
      return res.status(400).json({
        success: false,
        message: error.message,
      });
    }

    res.status(500).json({
      success: false,
      message: "Failed to update invoice status",
      error: error.message,
    });
  }
};
