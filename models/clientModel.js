import mongoose from "mongoose";

const clientSchema = mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    name: {
      type: String,
      required: [true, "Client name is required"],
      trim: true,
    },
    companyName: {
      type: String,
      trim: true,
    },
    email: {
      type: String,
      required: [true, "Email is required"],
      trim: true,
      lowercase: true,
      match: [/^\S+@\S+\.\S+$/, "Please provide a valid email address"],
    },
    mobile: {
      type: String,
      required: [true, "Mobile number is required"],
      trim: true,
    },
    address: {
      type: String,
      trim: true,
    },
  },
  { timestamps: true },
);

// Indexes
clientSchema.index({ name: 1 });
clientSchema.index({ user: 1, email: 1 }, { unique: true });

const Client = mongoose.model("Client", clientSchema);
export default Client;
