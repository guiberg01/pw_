import mongoose from "mongoose";
import { useSoftDelete } from "./plugins/softDelete.plugin.js";

const bannerSchema = new mongoose.Schema(
  {
    imageUrl: {
      type: String,
      required: true,
    },
    linkUrl: {
      type: String,
      required: true,
    },
    title: {
      type: String,
      required: true,
    },
    status: {
      type: String,
      enum: ["active", "inactive"],
      default: "active",
    },
    displayOrder: {
      type: Number,
      default: 0,
      required: true,
    },
  },
  { timestamps: true },
);

useSoftDelete(bannerSchema);

bannerSchema.index({ displayOrder: 1 });

const Banner = mongoose.model("Banner", bannerSchema);

export default Banner;
