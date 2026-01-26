import clientService from "../services/clientService.js";

// Create a new client
export const createClient = async (req, res) => {
  try {
    const clientData = req.body;

    // Basic validation
    if (!clientData.name || !clientData.email || !clientData.mobile) {
      return res.status(400).json({
        success: false,
        message: "Name, email, and mobile are required",
      });
    }

    const newClient = await clientService.createClient(
      clientData,
      req.user._id,
    );

    res.status(201).json({
      success: true,
      message: "Client created successfully",
      data: newClient,
    });
  } catch (error) {
    console.error("Error creating client:", error);

    // Handle validation errors
    if (error.name === "ValidationError") {
      const errors = Object.values(error.errors).map((err) => err.message);
      return res.status(400).json({
        success: false,
        message: "Validation failed",
        errors,
      });
    }

    // Handle duplicate email
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: "Email already exists",
      });
    }

    res.status(500).json({
      success: false,
      message: "Failed to create client",
      error: error.message,
    });
  }
};

// Get all clients
export const getAllClients = async (req, res) => {
  try {
    const clients = await clientService.getAllClients(req.user._id);

    res.status(200).json({
      success: true,
      count: clients.length,
      data: clients,
    });
  } catch (error) {
    console.error("Error fetching clients:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch clients",
      error: error.message,
    });
  }
};

// Get client by ID
export const getClientById = async (req, res) => {
  try {
    const { id } = req.params;
    const client = await clientService.getClientById(id, req.user._id);

    res.status(200).json({
      success: true,
      data: client,
    });
  } catch (error) {
    console.error("Error fetching client:", error);

    if (error.message === "Client not found") {
      return res.status(404).json({
        success: false,
        message: error.message,
      });
    }

    res.status(500).json({
      success: false,
      message: "Failed to fetch client",
      error: error.message,
    });
  }
};

// Update client
export const updateClient = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    const updatedClient = await clientService.updateClient(
      id,
      updateData,
      req.user._id,
    );

    res.status(200).json({
      success: true,
      message: "Client updated successfully",
      data: updatedClient,
    });
  } catch (error) {
    console.error("Error updating client:", error);

    if (error.message === "Client not found") {
      return res.status(404).json({
        success: false,
        message: error.message,
      });
    }

    // Handle validation errors
    if (error.name === "ValidationError") {
      const errors = Object.values(error.errors).map((err) => err.message);
      return res.status(400).json({
        success: false,
        message: "Validation failed",
        errors,
      });
    }

    // Handle duplicate email
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: "Email already exists",
      });
    }

    res.status(500).json({
      success: false,
      message: "Failed to update client",
      error: error.message,
    });
  }
};

// Delete client
export const deleteClient = async (req, res) => {
  try {
    const { id } = req.params;
    const deletedClient = await clientService.deleteClient(id, req.user._id);

    res.status(200).json({
      success: true,
      message: "Client deleted successfully",
      data: deletedClient,
    });
  } catch (error) {
    console.error("Error deleting client:", error);

    if (error.message === "Client not found") {
      return res.status(404).json({
        success: false,
        message: error.message,
      });
    } else {
      res.status(500).json({
        success: false,
        message: "Failed to delete client",
        error: error.message,
      });
    }
  }
};
