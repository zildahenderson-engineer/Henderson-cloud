import { z } from "zod";

export const organizationSchema = z.object({
  name: z.string().trim().min(2, "Informe o nome da empresa.").max(120, "Use no máximo 120 caracteres."),
  slug: z.string().trim().min(3, "O identificador deve ter ao menos 3 caracteres.").max(48).regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Use letras minúsculas, números e hífens."),
  country: z.string().length(2).default("BR"),
  locale: z.enum(["pt-BR", "en", "es"]).default("pt-BR"),
  timezone: z.string().min(3).max(64).default("America/Sao_Paulo"),
  currency: z.string().length(3).default("BRL"),
});

export function toSlug(value: string) {
  return value.normalize("NFKD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 48);
}
