import Product from "../models/product.model.js";

export const allProducts = async (req, res) => {
  try {
    const products = await Product.find();
    res.status(200).json(products);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const createProduct = async (req, res) => {
  try {
    const { name, description, price, imageUrl, category, highlighted, stock } = req.body;

    if (!name || !description || !price || !imageUrl || !category || stock === undefined) {
      return res.status(400).json({ message: "Todos os campos são obrigatórios" });
    }

    const product = new Product({ name, description, price, imageUrl, category, highlighted, stock });
    await product.save();

    res.status(201).json(product);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
