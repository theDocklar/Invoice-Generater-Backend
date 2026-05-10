import Invoice from "../models/invoiceModel.js";

class InvoiceService {
  roundMoney(amount) {
    return Math.round(Number(amount) || 0);
  }

  // Function to generate a unique invoice number
  async generateInvoiceNumber(userId) {
    const now = new Date();
    const dd = String(now.getDate()).padStart(2, "0");
    const mm = String(now.getMonth() + 1).padStart(2, "0");
    const yyyy = now.getFullYear();
    const datePart = `${dd}${mm}${yyyy}`;

    // Keep sequence incrementing for every new invoice in this account.
    const numberedInvoices = await Invoice.find({
      user: userId,
      invoiceNumber: { $regex: "^\\d{8}-\\d{3}$" },
    }).select("invoiceNumber");

    let maxSequence = 0;
    numberedInvoices.forEach((invoice) => {
      const [, sequencePart] = invoice.invoiceNumber.split("-");
      const sequence = parseInt(sequencePart, 10);
      if (!Number.isNaN(sequence) && sequence > maxSequence) {
        maxSequence = sequence;
      }
    });

    const nextSequence = maxSequence + 1;
    return `${datePart}-${String(nextSequence).padStart(3, "0")}`;
  }

  //Function to calculate line item total
  calculateLineTotal(lineItems) {
    const { quantity, unitPrice, discount, tax } = lineItems;

    // Calculate base amount
    let lineSubtotal = quantity * unitPrice;

    // Apply discount
    let discountAmount = 0;
    if (discount?.type === "percentage") {
      discountAmount = (lineSubtotal * (discount.value || 0)) / 100;
    } else if (discount?.type === "fixed") {
      discountAmount = discount.value || 0;
    }

    lineSubtotal -= discountAmount;

    // Apply tax
    const taxAmount = (lineSubtotal * (tax || 0)) / 100;

    return this.roundMoney(lineSubtotal + taxAmount);
  }

  // Function to calculate invoice totals
  calculateInvoiceTotals(lineItems) {
    let subtotal = 0;
    let totalDiscount = 0;
    let totalTax = 0;

    lineItems.forEach((item) => {
      const { quantity, unitPrice, discount, tax } = item;
      const lineSubtotal = quantity * unitPrice;
      subtotal += lineSubtotal;

      // Calculate discount amount
      let discountAmount = 0;
      if (discount?.type === "percentage") {
        discountAmount = (lineSubtotal * (discount.value || 0)) / 100;
      } else if (discount?.type === "fixed") {
        discountAmount = discount.value || 0;
      }
      totalDiscount += discountAmount;

      // Calculate tax amount
      const taxableAmount = lineSubtotal - discountAmount;
      const taxAmount = (taxableAmount * (tax || 0)) / 100;
      totalTax += taxAmount;
    });

    const grandTotal = subtotal - totalDiscount + totalTax;

    return {
      subtotal: this.roundMoney(subtotal),
      totalDiscount: this.roundMoney(totalDiscount),
      totalTax: this.roundMoney(totalTax),
      grandTotal: this.roundMoney(grandTotal),
    };
  }

  // Create New Invoice
  async createInvoice(invoiceData, userId) {
    // Invoice Number Generation
    if (invoiceData.lineItems) {
      invoiceData.invoiceNumber = await this.generateInvoiceNumber(userId);
    }

    // Calculate line totals
    if (invoiceData.lineItems) {
      invoiceData.lineItems = invoiceData.lineItems.map((item) => ({
        ...item,
        lineTotal: this.calculateLineTotal(item),
      }));
    }

    // Calculate Invoice Totals
    const totals = this.calculateInvoiceTotals(invoiceData.lineItems);
    invoiceData.totals = totals;

    // Add user reference
    invoiceData.user = userId;

    // Create and save invoice
    const invoice = new Invoice(invoiceData);
    await invoice.save();

    return invoice;
  }

  // Get invoice by ID
  async getInvoiceById(invoiceId, userId) {
    const invoice = await Invoice.findOne({ _id: invoiceId, user: userId });
    if (!invoice) {
      throw new Error("Invoice not found");
    }
    return invoice;
  }

  // Get all invoices
  async getAllInvoices(userId) {
    const invoices = await Invoice.find({ user: userId }).sort({
      createdAt: -1,
    });
    return invoices;
  }

  // Update invoice
  async updateInvoice(invoiceId, updatedData, userId) {
    try {
      const invoice = await Invoice.findOne({ _id: invoiceId, user: userId });

      if (!invoice) {
        throw new Error("Invoice not found");
      }

      if (invoice.status !== "Draft") {
        throw new Error("Only drafts can be edited");
      }

      // Recalculate line totals if line items are being updated
      if (updatedData.lineItems) {
        updatedData.lineItems = updatedData.lineItems.map((item) => ({
          ...item,
          lineTotal: this.calculateLineTotal(item),
        }));

        // Recalculate invoice totals
        const totals = this.calculateInvoiceTotals(updatedData.lineItems);
        updatedData.totals = totals;
      }

      const updatedInvoice = await Invoice.findOneAndUpdate(
        { _id: invoiceId, user: userId },
        updatedData,
        {
          new: true,
          runValidators: true,
        },
      );

      return updatedInvoice;
    } catch (error) {
      throw error;
    }
  }

  // Delete invoice
  async deleteInvoice(invoiceId, userId) {
    const invoice = await Invoice.findOneAndDelete({
      _id: invoiceId,
      user: userId,
    });

    if (!invoice) {
      throw new Error("Invoice not found");
    }
    return invoice;
  }

  // Update invoice status
  async updateInvoiceStatus(invoiceId, status, userId) {
    try {
      const invoice = await Invoice.findOne({ _id: invoiceId, user: userId });

      if (!invoice) {
        throw new Error("Invoice not found");
      }

      const validStatuses = ["Paid", "Sent", "Overdue", "Draft", "Cancelled"];
      if (!validStatuses.includes(status)) {
        throw new Error(
          `Invalid status. Must be one of: ${validStatuses.join(", ")}`,
        );
      }

      const updatedInvoice = await Invoice.findOneAndUpdate(
        { _id: invoiceId, user: userId },
        { status },
        {
          new: true,
          runValidators: true,
        },
      );

      return updatedInvoice;
    } catch (error) {
      throw error;
    }
  }
}

const invoiceService = new InvoiceService();
export default invoiceService;
