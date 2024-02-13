import mongoose, { Schema } from "mongoose";

const TransactionSchema = new mongoose.Schema(
  {
    account: {
      required: true,
      type: String,
    },
    amount: {
      type: Number,
      default: 0,
    },
    txid: {
      type: String,
      default: "",
    },
    isRewarded: {
      type: Boolean,
      default: false,
    },
    user: {
      type: Schema.Types.ObjectId,
      ref: "User", // Refers to the 'User' collection
    },
  },
  { timestamps: true }
);

//  here we are creating model / collection
const Transaction = mongoose.model("Transaction", TransactionSchema);

export default Transaction;
