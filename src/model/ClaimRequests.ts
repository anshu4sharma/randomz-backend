import mongoose from "mongoose";

const ClaimRequestsSchema = new mongoose.Schema(
  {
    email: {
      required: true,
      type: String,
    },
    amount: {
      type: Number,
      default: 0,
    },
    status: {
      type: String,
      default: "",
    },
    transactionId: {
      type: String,
      default: "",
    },
  },
  { timestamps: true }
);

//  here we are creating model / collection
const ClaimRequests = mongoose.model("ClaimRequests", ClaimRequestsSchema);

export default ClaimRequests;
