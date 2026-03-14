import express from "express";

const router = express.Router();

router.get("/signup", (req, res) => {
  res.send("Rota de cadastro chamada!");
});

router.get("/login", (req, res) => {
  res.send("Rota de login chamada!");
});

router.get("/logout", (req, res) => {
  res.send("Rota de logout chamada!");
});

export default router;
