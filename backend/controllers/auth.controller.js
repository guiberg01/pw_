// definindo as funções de controle para as rotas de autenticação
import mongoose from "mongoose";
import Address from "../models/address.model.js";
import Favorite from "../models/favorite.model.js";
import Product from "../models/product.model.js";
import ProductVariant from "../models/productVariant.model.js";
import Notification from "../models/notification.model.js";
import Order from "../models/order.model.js";
import PaymentMethod from "../models/paymentMethod.model.js";
import Review from "../models/review.model.js";
import Store from "../models/store.model.js";
import User from "../models/user.model.js";
import { createHttpError } from "../helpers/httpError.js";
import { sendSuccess } from "../helpers/successResponse.js";
import { endUserSession, rotateAccessToken, startUserSession } from "../services/auth.service.js";
import { orderStatuses } from "../constants/orderStatuses.js";
import { accountStatuses } from "../constants/accountStatuses.js";

export const signup = async (req, res, next) => {
  const { name, email, password, role, cpf, telephone } = req.body;
  const userExists = await User.findOne({
    $or: [{ email }, { cpf }],
  });

  if (userExists) {
    console.log(req.body);
    throw createHttpError(
      "Usuário já existe (email ou cpf já cadastrado!)",
      400,
      undefined,
      "AUTH_USER_ALREADY_EXISTS",
    );
  }

  const user = await User.create({ name, email, password, role, cpf, telephone });

  await startUserSession(req, res, user._id);

  return sendSuccess(res, 201, "Cadastro realizado com sucesso", {
    id: user._id,
    name: user.name,
    email: user.email,
    role: user.role,
    cpf: user.cpf,
    telephone: user.telephone,
  });
};

export const login = async (req, res, next) => {
  const { email, password } = req.body;
  const user = await User.findOne({ email });

  if (!user || !(await user.comparePassword(password))) {
    throw createHttpError("Credenciais inválidas", 401, undefined, "AUTH_INVALID_CREDENTIALS");
  }

  await startUserSession(req, res, user._id);

  return sendSuccess(res, 200, "Login realizado com sucesso", {
    id: user._id,
    name: user.name,
    email: user.email,
    role: user.role,
    cpf: user.cpf,
    telephone: user.telephone,
  });
};

export const logout = async (req, res, next) => {
  await endUserSession(req, res);
  return sendSuccess(res, 200, "Logout realizado com sucesso");
};

export const refreshToken = async (req, res, next) => {
  await rotateAccessToken(req, res);

  return sendSuccess(res, 200, "Token renovado com sucesso");
};

export const getMyProfile = async (req, res, next) => {
  const userId = req.user._id;

  const [
    store,
    orderCount,
    pendingOrderCount,
    reviewCount,
    notificationCount,
    unreadNotificationCount,
    favoriteCount,
    addressCount,
    paymentMethodCount,
  ] = await Promise.all([
    req.user.role === "seller" ? Store.findOne({ owner: userId }).select("name slug logoUrl bannerUrl status") : null,
    Order.countDocuments({ user: userId }),
    Order.countDocuments({ user: userId, status: orderStatuses.PENDING }),
    Review.countDocuments({ user: userId }),
    Notification.countDocuments({ user: userId }),
    Notification.countDocuments({ user: userId, isRead: false }),
    Favorite.countDocuments({ user: userId }),
    Address.countDocuments({ user: userId }),
    PaymentMethod.countDocuments({ user: userId }),
  ]);

  return sendSuccess(res, 200, "Perfil carregado com sucesso", {
    user: {
      id: req.user._id,
      name: req.user.name,
      email: req.user.email,
      role: req.user.role,
      cpf: req.user.cpf ?? null,
      telephone: req.user.telephone ?? null,
      status: req.user.status,
      createdAt: req.user.createdAt,
      updatedAt: req.user.updatedAt,
    },
    store: store
      ? {
          id: store._id,
          name: store.name,
          slug: store.slug,
          logoUrl: store.logoUrl,
          bannerUrl: store.bannerUrl,
          status: store.status,
        }
      : null,
    summary: {
      orders: orderCount,
      pendingOrders: pendingOrderCount,
      reviews: reviewCount,
      favorites: favoriteCount,
      notifications: notificationCount,
      unreadNotifications: unreadNotificationCount,
      addresses: addressCount,
      paymentMethods: paymentMethodCount,
    },
  });
};

export const updateMyProfile = async (req, res, next) => {
  const userId = req.user._id;
  const { name, email, telephone } = req.body;

  if (email && email !== req.user.email) {
    const emailExists = await User.findOne({ email, _id: { $ne: userId } }).select("_id");

    if (emailExists) {
      throw createHttpError("Email já cadastrado por outro usuário", 400, undefined, "AUTH_EMAIL_ALREADY_EXISTS");
    }
  }

  if (name !== undefined) {
    req.user.name = name;
  }

  if (email !== undefined) {
    req.user.email = email;
  }

  if (telephone !== undefined) {
    req.user.telephone = telephone;
  }

  await req.user.save();

  return sendSuccess(res, 200, "Perfil atualizado com sucesso", {
    user: {
      id: req.user._id,
      name: req.user.name,
      email: req.user.email,
      role: req.user.role,
      cpf: req.user.cpf ?? null,
      telephone: req.user.telephone ?? null,
      status: req.user.status,
      createdAt: req.user.createdAt,
      updatedAt: req.user.updatedAt,
    },
  });
};

export const deleteMyProfile = async (req, res, next) => {
  const userId = req.user._id;
  const now = new Date();
  const session = await mongoose.startSession();

  try {
    await session.withTransaction(async () => {
      const storeIds = await Store.find({ owner: userId }).distinct("_id").session(session);
      const productIds =
        storeIds.length > 0
          ? await Product.find({ store: { $in: storeIds } })
              .distinct("_id")
              .session(session)
          : [];

      if (productIds.length > 0) {
        await ProductVariant.deleteMany({ product: { $in: productIds } }, { session });
        await Product.updateMany({ store: { $in: storeIds } }, { $set: { deletedAt: now } }, { session });
      }

      if (storeIds.length > 0) {
        await Store.updateMany(
          { _id: { $in: storeIds } },
          { $set: { deletedAt: now, status: accountStatuses.BLOCKED } },
          { session },
        );
      }

      await User.findByIdAndUpdate(
        userId,
        {
          deletedAt: now,
          status: accountStatuses.BLOCKED,
          suspendedSince: now,
        },
        { session },
      );
    });
  } finally {
    session.endSession();
  }

  await endUserSession(req, res);

  return sendSuccess(res, 200, "Perfil excluído com sucesso");
};
