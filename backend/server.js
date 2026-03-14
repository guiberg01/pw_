import express from "express";
import dotenv from "dotenv";

// Routes
import authRoutes from "./routes/auth.route.js";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3980;

app.use("/api/auth", authRoutes);

app.listen(PORT, () => {
  console.log(`Server rodando em: http://localhost:${PORT}`);
});
