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
      mobile: clientData.phone,
      address: clientData.address || "",
      user: userId,
    };

    client = new Client(newClientData);
    await client.save();

    return { client, isNew: true };
  },
};

export default clientService;
