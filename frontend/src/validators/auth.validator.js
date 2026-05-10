import { z } from "zod";
import { validarCPF } from "./cpf.helper";

const passwordSchema = z.string().min(6, "A senha deve ter pelo menos 6 caracteres");

const emailSchema = z.string().trim().toLowerCase().pipe(z.email("Email inválido"));

const nameSchema = z.string().trim().min(1, "Nome é obrigatório");

const cpfSchema = z
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
  });

const telephoneSchema = z
  .string()
  .transform((val) => val.replace(/[^\d]+/g, ""))
  .superRefine((val, ctx) => {
    if (val.length < 10 || val.length > 11) {
      ctx.addIssue({
        code: z.custom,
        message: "Telefone inválido. Deve ter 10 ou 11 dígitos.",
      });
    }
  });

const roleSchema = z.enum(["customer", "seller"]).optional().default("customer");

export const loginSchema = z.object({
  email: emailSchema,
  password: passwordSchema,
});

export const signupSchema = z
  .object({
    name: nameSchema,
    email: emailSchema,
    password: passwordSchema,
    cpf: cpfSchema,
    telephone: telephoneSchema,
    confirmPassword: z.string({ required_error: "Confirme sua senha" }),
    role: roleSchema,
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "As senhas não coincidem",
    path: ["confirmPassword"],
  });
