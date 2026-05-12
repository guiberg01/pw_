import { sendSuccess } from "../helpers/successResponse.js";
import { listFavoritesForUser, removeFavoriteForUser, toggleFavoriteForUser } from "../services/favorite.service.js";

export const getMyFavorites = async (req, res, next) => {
  const favorites = await listFavoritesForUser(req.user._id, req.validatedQuery ?? {});
  return sendSuccess(res, 200, "Favoritos carregados com sucesso", favorites);
};

export const toggleMyFavorite = async (req, res, next) => {
  const { productId } = req.params;
  const result = await toggleFavoriteForUser(req.user._id, productId);

  return sendSuccess(
    res,
    200,
    result.isFavorited ? "Produto adicionado aos favoritos" : "Produto removido dos favoritos",
    result,
  );
};

export const removeMyFavorite = async (req, res, next) => {
  const { productId } = req.params;
  const result = await removeFavoriteForUser(req.user._id, productId);
  return sendSuccess(res, 200, "Produto removido dos favoritos", result);
};
