export const formatCurrency = (value) => {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value);
};

export const parseCurrency = (value) => {
  if (typeof value !== "string") return parseFloat(value);
  return parseFloat(value.replace(/[^\d,.-]/g, "").replace(",", "."));
};
