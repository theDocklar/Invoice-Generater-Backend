import Client from "../models/clientModel.js";

const clientService = {
  // Create a new client
  async createClient(clientData, userId) {
    const client = new Client({ ...clientData, user: userId });
    await client.save();
    return client;
  },

  // Get all clients
  async getAllClients(userId) {
    const clients = await Client.find({ user: userId }).sort({ createdAt: -1 });
    return clients;
  },

  // Get client by ID
  async getClientById(clientId, userId) {
    const client = await Client.findOne({ _id: clientId, user: userId });
    if (!client) {
      throw new Error("Client not found");
    }
    return client;
  },

  // Get client by email
  async getClientByEmail(email, userId) {
    const client = await Client.findOne({ email: email, user: userId });
    return client; // Can be null if not found
  },

  // Update client
  async updateClient(clientId, updateData, userId) {
    const client = await Client.findOneAndUpdate(
      { _id: clientId, user: userId },
      updateData,
      {
        new: true,
        runValidators: true,
      },
    );
    if (!client) {
      throw new Error("Client not found");
    }
    return client;
  },

  // Delete client
  async deleteClient(clientId, userId) {
    const client = await Client.findOneAndDelete({
      _id: clientId,
      user: userId,
    });
    if (!client) {
      throw new Error("Client not found");
    }
    return client;
  },

  // Resolve client for invoice: validate, fetch existing, or create new
  async resolveClientForInvoice(clientData, userId) {
    const existingClient = await this.getClientByEmail(
      clientData.email,
      userId,
    );

    if (existingClient && !clientData.clientId) {
      const error = new Error(
        "A client with this email already exists. Please select the existing client from the dropdown.",
      );
      error.field = "clientEmail";
      error.statusCode = 400;
      throw error;
    }

    if (clientData.clientId) {
      return await this.getClientById(clientData.clientId, userId);
    }

    // Create new client
    const newClientData = {
      name: clientData.name,
      companyName: clientData.company || "",
      email: clientData.email,
      mobile: clientData.phone || "",
      address: clientData.address || "",
    };

    return await this.createClient(newClientData, userId);
  },

  // Find client by email or create new one
  async findOrCreateClient(clientData, userId) {
    let client = await Client.findOne({
      email: clientData.email,
      user: userId,
    });

    if (client) {
      return { client, isNew: false };
    }

    const newClientData = {
      name: clientData.name,
      companyName: clientData.company || "",
      email: clientData.email,
      mobile: clientData.phone || "",
      address: clientData.address || "",
      user: userId,
    };

    client = new Client(newClientData);
    await client.save();

    return { client, isNew: true };
  },
};

export default clientService;
