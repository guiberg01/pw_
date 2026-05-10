import { z } from "zod";

function validarCPF(cpf) {
  cpf = cpf.replace(/[^\d]+/g, "");
  if (cpf.length !== 11 || /^(\d)\1+$/.test(cpf)) return false;

  let soma = 0;
  for (let i = 0; i < 9; i++) soma += parseInt(cpf.charAt(i)) * (10 - i);
  let resto = (soma * 10) % 11;
  if (resto === 10 || resto === 11) resto = 0;
  if (resto !== parseInt(cpf.charAt(9))) return false;

  soma = 0;
  for (let i = 0; i < 10; i++) soma += parseInt(cpf.charAt(i)) * (11 - i);
  resto = (soma * 10) % 11;
  if (resto === 10 || resto === 11) resto = 0;
  if (resto !== parseInt(cpf.charAt(10))) return false;

  return true;
}

export const signupSchema = z.object({
  name: z.string().trim().min(1, "Nome é obrigatório"),
  email: z
    .string()
    .trim()
    .pipe(z.email({ error: "Email inválido" })),
  password: z.string().min(6, "A senha deve ter pelo menos 6 caracteres"),
  role: z.enum(["customer", "seller"]).optional().default("customer"),
  cpf: z
    .string()
    .transform((val) => val.replace(/[^\d]+/g, ""))
    .superRefine((val, ctx) => {
      if (val.length !== 11) {
        ctx.addIssue({
          code: z.custom,
          message: "CPF deve conter 11 dígitos",
        });
        return;
      }

      if (!validarCPF(val)) {
        ctx.addIssue({
          code: z.custom,
          message: "CPF inválido",
        });
      }
    }),
  telephone: z
    .string()
    .transform((val) => val.replace(/[^\d]+/g, ""))
    .superRefine((val, ctx) => {
      if (val.length < 10 || val.length > 11) {
        ctx.addIssue({
          code: z.custom,
          message: "Telefone inválido. Deve ter 10 ou 11 dígitos.",
        });
      }
    }),
});

export const loginSchema = z.object({
  email: z
    .string()
    .trim()
    .pipe(z.email({ error: "Email inválido" })),
  password: z.string().min(1, "Senha é obrigatória"),
});
