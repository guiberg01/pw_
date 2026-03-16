import Store from "../models/store.model.js";

//função para gerar um slug único a partir do nome da loja (slug pra deixar a url bonitinha)
const slugify = (value) => {
  return value
    .toString()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
};

//função para garantir que o slug seja único no banco de dados
const buildUniqueSlug = async (name) => {
  const baseSlug = slugify(name);
  let slug = baseSlug;
  let suffix = 1;

  while (await Store.findOne({ slug })) {
    slug = `${baseSlug}-${suffix}`;
    suffix += 1;
  }

  return slug;
};

export const createStore = async (req, res) => {
  try {
    const { name, description, logoUrl } = req.body;

    if (!name) {
      return res.status(400).json({ message: "Nome da loja é obrigatório" });
    }

    const existingStore = await Store.findOne({ owner: req.user._id });
    if (existingStore) {
      return res.status(409).json({ message: "Este seller já possui uma loja" });
    }

    const slug = await buildUniqueSlug(name);

    const store = await Store.create({
      name,
      slug,
      description,
      logoUrl,
      owner: req.user._id,
    });

    return res.status(201).json(store);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

export const getMyStore = async (req, res) => {
  try {
    const store = await Store.findOne({ owner: req.user._id });

    if (!store) {
      return res.status(404).json({ message: "Loja não encontrada" });
    }

    return res.status(200).json(store);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

export const getStoreById = async (req, res) => {
  try {
    const { storeId } = req.params;
    const store = await Store.findById(storeId).populate("owner", "name email role");

    if (!store) {
      return res.status(404).json({ message: "Loja não encontrada" });
    }

    return res.status(200).json(store);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

export const updateMyStore = async (req, res) => {
  try {
    const { name, description, logoUrl, status } = req.body;

    const store = await Store.findOne({ owner: req.user._id });
    if (!store) {
      return res.status(404).json({ message: "Loja não encontrada" });
    }

    if (name && name !== store.name) {
      store.name = name;
      store.slug = await buildUniqueSlug(name);
    }

    if (description !== undefined) {
      store.description = description;
    }

    if (logoUrl !== undefined) {
      store.logoUrl = logoUrl;
    }

    if (req.user.role === "admin" && status) {
      store.status = status;
    }

    await store.save();

    return res.status(200).json(store);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};
