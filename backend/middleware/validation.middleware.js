import { createHttpError } from "../helpers/httpError.js";

const validate = (schema, target) => {
  return (req, res, next) => {
    const result = schema.safeParse(req[target]);

    if (!result.success) {
      const flattened = result.error.flatten();
      const fieldErrorMessages = Object.entries(flattened.fieldErrors).reduce((acc, [field, errors]) => {
        acc[field] = errors || [];
        return acc;
      }, {});

      const validationError = createHttpError(
        `Requisição inválida - Falha na validação (${target})`,
        400,
        {
          receivedData: req[target],
          fieldErrors: fieldErrorMessages,
        },
        "REQUEST_VALIDATION_FAILED",
      );
      return next(validationError);
    }

    if (target === "query") {
      req.validatedQuery = result.data;
    } else {
      req[target] = result.data;
    }

    next();
  };
};

export const validateBody = (schema) => validate(schema, "body");
export const validateParams = (schema) => validate(schema, "params");
export const validateQuery = (schema) => validate(schema, "query");
