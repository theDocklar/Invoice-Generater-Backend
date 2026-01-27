import mongoose from "mongoose";

const lineItemSchema = new mongoose.Schema({
  description: {
    type: String,
    required: [true, "Item description is required."],
    trim: true,
  },
  quantity: {
    type: Number,
    required: [true, "Quantity is required."],
    min: [0, "Quantity can't be negative."],
  },
  unitPrice: {
    type: Number,
    required: [true, "Unit price is required"],
    min: [0, "Unit price can't be negative"],
  },
  discount: {
    type: {
      type: String,
      enum: ["percentage", "fixed"],
      default: "percentage",
    },
    value: {
      type: Number,
      default: 0,
      min: [0, "Discount can't be negative"],
    },
  },
  tax: {
    type: Number,
    default: 0,
    min: [0, "Tax can't be negative"],
    max: [100, "Tax percentage can't exceed 100%"],
  },
  lineTotals: {
    type: Number,
    default: 0,
  },
});

const invoiceSchema = mongoose.Schema(
  {
    //User Reference
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    //Invoice Metadata
    invoiceNumber: {
      type: String,
      required: true,
      trim: true,
    },
    invoiceDate: {
      type: Date,
      required: true,
      default: Date.now,
    },
    dueDate: {
      type: Date,
      required: [true, "Date is required"],
    },
    currency: {
      type: String,
      required: true,
      default: "LKR",
      trim: true,
      uppercase: true,
    },
    status: {
      type: String,
      enum: {
        values: ["Paid", "Sent", "Overdue", "Draft", "Cancelled"],
        message: "{VALUE} is not supported",
      },
      default: "Draft",
    },
    referenceNumber: {
      type: String,
      trim: true,
    },
    projectName: {
      type: String,
      trim: true,
    },

    //Client Information
    client: {
      clientId: {
        type: mongoose.Schema.ObjectId,
        ref: "Client",
        default: null, // For one-time clients
      },
      name: {
        type: String,
        required: [true, "Client name is required."],
        trim: true,
      },
      company: {
        type: String,
        trim: true,
      },
      address: {
        type: String,
        trim: true,
      },
      email: {
        type: String,
        required: [true, "Client email is required."],
        trim: true,
        lowercase: true,
        match: [/^\S+@\S+\.\S+$/, "Please provide a valid email address"],
      },
      phone: {
        type: String,
        trim: true,
      },
    },
    //Line Items
    lineItems: {
      type: [lineItemSchema],
      validate: {
        validator: function (items) {
          return items && items.length > 0;
        },
        message: "At least one line item is required.",
      },
    },

    //Items Totals
    totals: {
      subtotal: {
        type: Number,
        required: true,
        default: 0,
        min: [0, "Subtotal can't be negative"],
      },
      totalDiscount: {
        type: Number,
        default: 0,
        min: 0,
      },
      totalTax: {
        type: Number,
        default: 0,
        min: 0,
      },
      grandTotal: {
        type: Number,
        required: true,
        default: 0,
        min: [0, "Grand total can't be negative"],
      },
    },

    //Additional Information
    notes: {
      type: String,
      default: "",
      trim: true,
    },
  },
  { timestamps: true },
);

// Indexes
invoiceSchema.index({ user: 1, invoiceNumber: 1 }, { unique: true });
invoiceSchema.index({ "client.name": 1 });
invoiceSchema.index({ invoiceDate: -1 });
invoiceSchema.index({ dueDate: -1 });
invoiceSchema.index({ status: 1 });

const Invoice = mongoose.model("Invoice", invoiceSchema);

export default Invoice;
