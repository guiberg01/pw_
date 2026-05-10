import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { createBannerSchema, updateBannerSchema } from "@/validators/banner.validator";

/**
 * Hook customizado para gerenciar formulário de banner com validação Zod
 * @param {Object} options
 * @param {"create" | "edit"} options.mode - Modo de operação
 * @param {Object} options.initialData - Dados iniciais para edição
 * @param {Function} options.onSuccess - Callback ao enviar com sucesso
 * @returns {Object} Formulário configurado e estado
 */
export function useBannerForm({ mode = "create", initialData = null, onSuccess } = {}) {
  const schema = mode === "create" ? createBannerSchema : updateBannerSchema;

  const defaultValues =
    mode === "edit" && initialData
      ? {
          title: initialData.title || "",
          linkUrl: initialData.linkUrl || "",
          imageUrl: initialData.imageUrl || "",
          displayOrder: initialData.displayOrder ?? 0,
          status: initialData.status || "active",
        }
      : {
          title: "",
          linkUrl: "",
          imageUrl: "",
          displayOrder: 0,
          status: "active",
        };

  const form = useForm({
    resolver: zodResolver(schema),
    defaultValues,
    mode: "onChange",
    revalidateMode: "onChange",
    shouldFocusError: true,
  });

  const handleValidationError = () => {
    const errors = form.formState.errors;
    const firstErrorKey = Object.keys(errors)[0];

    if (firstErrorKey) {
      const errorMessage = errors[firstErrorKey]?.message;
      if (errorMessage) {
        toast.error(errorMessage);
      }
    }
  };

  const handleImageUpload = (imageUrl) => {
    form.setValue("imageUrl", imageUrl, { shouldValidate: true });
  };

  return {
    form,
    schema,
    mode,
    initialValues: defaultValues,
    handleValidationError,
    handleImageUpload,
    resetForm: () =>
      form.reset({
        title: "",
        linkUrl: "",
        imageUrl: "",
        displayOrder: 0,
        status: "active",
      }),
  };
}
