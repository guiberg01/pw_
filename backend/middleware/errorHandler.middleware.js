export const errorHandler = (err, req, res, next) => {
  console.error(err); //debug

  // Autenticação
  if (err.name === "TokenExpiredError") {
    return res.status(401).json({ message: "Não autorizado - Token expirado" });
  }
  if (err.name === "JsonWebTokenError" || err.message === "NoToken") {
    return res.status(401).json({ message: "Não autorizado - Token inválido ou ausente" });
  }
  if (err.message === "UserNotFound") {
    return res.status(401).json({ message: "Não autorizado - Usuário não encontrado" });
  }
  if (err.message === "NotAdmin") {
    return res.status(403).json({ message: "Acesso proibido - Usuário não é administrador" });
  }
  if (err.message === "Forbidden") {
    return res.status(403).json({ message: "Acesso proibido - Permissão insuficiente" });
  }

  // Validação
  if (err.name === "ValidationError") {
    return res.status(400).json({ message: "Requisição inválida - Falha na validação", details: err.errors });
  }

  // Banco de dados
  if (err.name === "MongoError") {
    return res.status(500).json({ message: "Erro no banco de dados" });
  }

  // Fallback
  return res.status(500).json({ message: "Erro interno do servidor" });
};
