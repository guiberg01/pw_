import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { api } from "@/api/api";
import { setFrontendCookie } from "@/utils/cookies";
import { loginSchema, signupSchema } from "@/validators/auth.validator";

const resolveRedirectPath = (value) => {
  if (typeof value !== "string") return "/";
  return value.startsWith("/") ? value : "/";
};

/**
 * Hook customizado para gerenciar login com validação Zod
 * @returns {Object} Formulário de login e funções associadas
 */
export function useLogin(options = {}) {
  const router = useRouter();
  const redirectTo = resolveRedirectPath(options.redirectTo);

  const form = useForm({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
    mode: "onChange",
    revalidateMode: "onChange",
    shouldFocusError: true,
  });

  const onSubmit = async (values) => {
    try {
      const response = await api.post("/auth/login", values);

      const userName = response.data.data?.name || "Usuário";
      const userRole = response.data.data?.role || "customer";

      setFrontendCookie("userName", userName);
      setFrontendCookie("userRole", userRole);

      toast.success(`Login efetuado com sucesso! Bem vindo, ${userName}!`);

      router.push(redirectTo);
      router.refresh();
      if (typeof window !== "undefined") {
        window.dispatchEvent(new Event("cart:updated"));
      }
    } catch (error) {
      const serverMessage = error.response?.data?.message;
      const genericMessage = "E-mail ou senha incorretos. Tente novamente.";

      toast.error(serverMessage || genericMessage, {
        duration: 4000,
      });

      console.error("Erro ao fazer login:", error);
    }
  };

  return {
    form,
    onSubmit,
  };
}

/**
 * Hook customizado para gerenciar signup com validação Zod
 * @returns {Object} Formulário de signup e funções associadas
 */
export function useSignup(options = {}) {
  const router = useRouter();
  const redirectTo = resolveRedirectPath(options.redirectTo);

  const form = useForm({
    resolver: zodResolver(signupSchema),
    defaultValues: {
      name: "",
      email: "",
      password: "",
      cpf: "",
      telephone: "",
      confirmPassword: "",
      role: "customer",
    },
    mode: "onChange",
    revalidateMode: "onChange",
    shouldFocusError: true,
  });

  const onSubmit = async (values) => {
    try {
      const { confirmPassword, ...dataToSend } = values;

      const response = await api.post("/auth/signup", dataToSend);

      const userName = response.data.data?.name || "Usuário";
      const userRole = response.data.data?.role || "customer";

      setFrontendCookie("userName", userName);
      setFrontendCookie("userRole", userRole);

      toast.success(`Cadastro efetuado com sucesso! Bem vindo, ${userName}!`);

      router.push(redirectTo);
      router.refresh();
      if (typeof window !== "undefined") {
        window.dispatchEvent(new Event("cart:updated"));
      }
    } catch (error) {
      const serverMessage = error.response?.data?.message;
      const genericMessage = "O cadastro falhou... Tente novamente.";

      toast.error(serverMessage || genericMessage, {
        duration: 4000,
      });

      console.error("Erro ao fazer cadastro:", error);
    }
  };

  return {
    form,
    onSubmit,
  };
}
