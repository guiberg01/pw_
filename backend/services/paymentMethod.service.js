import Stripe from "stripe";
import User from "../models/user.model.js";
import PaymentMethod from "../models/paymentMethod.model.js";
import { createHttpError } from "../helpers/httpError.js";

const stripeClient = process.env.STRIPE_SECRET_KEY
  ? new Stripe(process.env.STRIPE_SECRET_KEY, { apiVersion: "2024-04-10" })
  : null;

const PAYMENT_METHOD_SORT = { isDefault: -1, createdAt: -1 };

const getStripeClientOrThrow = () => {
  if (!stripeClient) {
    throw createHttpError("Stripe não configurado", 500, undefined, "STRIPE_NOT_CONFIGURED");
  }

  return stripeClient;
};

export const ensureStripeCustomerForUser = async (userId, { session = null, stripePaymentMethodId = null } = {}) => {
  const query = User.findById(userId).select("name email stripeCustomerId");
  if (session) {
    query.session(session);
  }

  const user = await query;

  if (!user) {
    throw createHttpError("Usuário não encontrado", 404, undefined, "USER_NOT_FOUND");
  }

  const stripe = getStripeClientOrThrow();

  if (stripePaymentMethodId) {
    const stripePaymentMethod = await stripe.paymentMethods.retrieve(stripePaymentMethodId);

    if (stripePaymentMethod.customer) {
      if (user.stripeCustomerId && user.stripeCustomerId !== stripePaymentMethod.customer) {
        throw createHttpError(
          "Este método de pagamento já está vinculado a outro cliente",
          409,
          undefined,
          "PAYMENT_METHOD_ALREADY_ASSIGNED",
        );
      }

      user.stripeCustomerId = stripePaymentMethod.customer;
      await user.save({ session });

      return { user, stripeCustomerId: stripePaymentMethod.customer, stripePaymentMethod };
    }
  }

  if (user.stripeCustomerId) {
    return { user, stripeCustomerId: user.stripeCustomerId };
  }

  const customer = await stripe.customers.create({
    name: user.name,
    email: user.email,
    metadata: {
      userId: user._id.toString(),
    },
  });

  user.stripeCustomerId = customer.id;
  await user.save({ session });

  return { user, stripeCustomerId: customer.id };
};

const ensurePaymentMethodBelongsToUserOrThrow = async (paymentMethodId, userId) => {
  const paymentMethod = await PaymentMethod.findOne({ _id: paymentMethodId, user: userId });

  if (!paymentMethod) {
    throw createHttpError("Método de pagamento não encontrado", 404, undefined, "PAYMENT_METHOD_NOT_FOUND");
  }

  return paymentMethod;
};

const setDefaultPaymentMethodForUser = async (userId, paymentMethodId) => {
  await PaymentMethod.updateMany({ user: userId, _id: { $ne: paymentMethodId } }, { $set: { isDefault: false } });
  await PaymentMethod.findOneAndUpdate({ _id: paymentMethodId, user: userId }, { $set: { isDefault: true } });
};

const ensureUserKeepsAtLeastOneDefaultPaymentMethod = async (userId) => {
  const currentDefault = await PaymentMethod.findOne({ user: userId, isDefault: true });
  if (currentDefault) return;

  const fallback = await PaymentMethod.findOne({ user: userId }).sort({ createdAt: -1 });
  if (fallback) {
    fallback.isDefault = true;
    await fallback.save();
  }
};

export const listPaymentMethodsByUser = async (userId) => {
  return PaymentMethod.find({ user: userId }).sort(PAYMENT_METHOD_SORT);
};

export const createPaymentMethodSetupIntentForUser = async (userId) => {
  const { stripeCustomerId } = await ensureStripeCustomerForUser(userId);
  const stripe = getStripeClientOrThrow();

  const setupIntent = await stripe.setupIntents.create({
    customer: stripeCustomerId,
    usage: "off_session",
    payment_method_types: ["card"],
    metadata: {
      userId: String(userId),
    },
  });

  return {
    clientSecret: setupIntent.client_secret,
    setupIntentId: setupIntent.id,
  };
};

export const findPaymentMethodByIdForUserOrThrow = async (paymentMethodId, userId) => {
  return ensurePaymentMethodBelongsToUserOrThrow(paymentMethodId, userId);
};

export const createPaymentMethodForUser = async (userId, payload) => {
  const { stripePaymentMethodId, type } = payload;

  if (!stripePaymentMethodId) {
    throw createHttpError(
      "Identificador do método de pagamento é obrigatório",
      400,
      undefined,
      "PAYMENT_METHOD_STRIPE_ID_REQUIRED",
    );
  }

  const { stripeCustomerId, stripePaymentMethod } = await ensureStripeCustomerForUser(userId, {
    stripePaymentMethodId,
  });

  if (!stripePaymentMethod.customer) {
    await getStripeClientOrThrow().paymentMethods.attach(stripePaymentMethodId, { customer: stripeCustomerId });
  }

  const paymentMethodType = stripePaymentMethod.type ?? type;
  const cardDetails = stripePaymentMethod.card ?? null;
  const hasPaymentMethod = await PaymentMethod.exists({ user: userId });

  const existingPaymentMethod = await PaymentMethod.findOne({ user: userId, stripePaymentMethodId });

  if (existingPaymentMethod) {
    existingPaymentMethod.type = paymentMethodType;
    existingPaymentMethod.cardBrand = cardDetails?.brand ?? existingPaymentMethod.cardBrand ?? null;
    existingPaymentMethod.last4 = cardDetails?.last4 ?? existingPaymentMethod.last4 ?? null;
    existingPaymentMethod.expMonth = cardDetails?.exp_month ?? existingPaymentMethod.expMonth ?? null;
    existingPaymentMethod.expYear = cardDetails?.exp_year ?? existingPaymentMethod.expYear ?? null;
    await existingPaymentMethod.save();
    return PaymentMethod.findById(existingPaymentMethod._id);
  }

  const paymentMethod = await PaymentMethod.create({
    stripePaymentMethodId,
    type: paymentMethodType,
    cardBrand: cardDetails?.brand ?? payload.cardBrand ?? null,
    last4: cardDetails?.last4 ?? payload.last4 ?? null,
    expMonth: cardDetails?.exp_month ?? payload.expMonth ?? null,
    expYear: cardDetails?.exp_year ?? payload.expYear ?? null,
    user: userId,
    isDefault: payload.isDefault ?? !hasPaymentMethod,
  });

  if (paymentMethod.isDefault) {
    await setDefaultPaymentMethodForUser(userId, paymentMethod._id);
  }

  return PaymentMethod.findById(paymentMethod._id);
};

export const updatePaymentMethodForUser = async (paymentMethodId, userId, payload) => {
  const paymentMethod = await ensurePaymentMethodBelongsToUserOrThrow(paymentMethodId, userId);

  Object.assign(paymentMethod, payload);
  await paymentMethod.save();

  if (payload.isDefault === true) {
    await setDefaultPaymentMethodForUser(userId, paymentMethod._id);
  }

  if (payload.isDefault === false) {
    await ensureUserKeepsAtLeastOneDefaultPaymentMethod(userId);
  }

  return PaymentMethod.findById(paymentMethod._id);
};

export const setDefaultPaymentMethodForUserById = async (paymentMethodId, userId) => {
  await ensurePaymentMethodBelongsToUserOrThrow(paymentMethodId, userId);
  await setDefaultPaymentMethodForUser(userId, paymentMethodId);

  return PaymentMethod.findById(paymentMethodId);
};

export const deletePaymentMethodForUser = async (paymentMethodId, userId) => {
  const paymentMethod = await ensurePaymentMethodBelongsToUserOrThrow(paymentMethodId, userId);
  await PaymentMethod.findByIdAndDelete(paymentMethod._id);

  if (paymentMethod.isDefault) {
    await ensureUserKeepsAtLeastOneDefaultPaymentMethod(userId);
  }
};
