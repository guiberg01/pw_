import axios from "axios";
import { sendSuccess } from "../helpers/successResponse.js";
import { createHttpError } from "../helpers/httpError.js";

export const lookupCep = async (req, res, next) => {
  const { cep } = req.query;
  if (!cep) {
    throw createHttpError("CEP é obrigatório", 400, undefined, "CEP_REQUIRED");
  }

  const sanitized = String(cep).replace(/\D/g, "").trim();
  if (sanitized.length !== 8) {
    throw createHttpError("CEP inválido", 400, undefined, "CEP_INVALID");
  }

  try {
    const url = `https://viacep.com.br/ws/${sanitized}/json/`;
    const response = await axios.get(url, { timeout: 5000 });
    const data = response.data;

    if (data.erro) {
      throw createHttpError("CEP não encontrado", 404, data, "CEP_NOT_FOUND");
    }

    const normalized = {
      zipCode: data.cep || sanitized,
      street: data.logradouro || "",
      complement: data.complemento || "",
      neighborhood: data.bairro || "",
      city: data.localidade || "",
      state: data.uf || "",
    };

    return sendSuccess(res, 200, "CEP consultado com sucesso", normalized);
  } catch (error) {
    if (error.response && error.response.status === 404) {
      throw createHttpError("CEP não encontrado", 404, undefined, "CEP_NOT_FOUND");
    }

    throw createHttpError("Falha ao consultar CEP", 502, error?.message || error, "CEP_LOOKUP_FAILED");
  }
};
