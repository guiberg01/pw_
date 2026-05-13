import mongoose from "mongoose";

const orderReviewSchema = new mongoose.Schema(
  {
    order: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Order",
      required: true,
      index: true,
    },
    subOrder: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "SubOrder",
      required: true,
      index: true,
    },
    store: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Store",
      required: true,
      index: true,
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    orderRating: {
      type: Number,
      required: true,
      min: 1,
      max: 5,
    },
    storeRating: {
      type: Number,
      required: true,
      min: 1,
      max: 5,
    },
    comment: {
      type: String,
      default: "",
      trim: true,
    },
    images: {
      type: [String],
      default: [],
    },
  },
  { timestamps: true },
);

orderReviewSchema.index({ order: 1, user: 1, subOrder: 1 }, { unique: true });

const OrderReview = mongoose.model("OrderReview", orderReviewSchema);

export default OrderReview;
