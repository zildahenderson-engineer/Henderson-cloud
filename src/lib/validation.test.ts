import { describe, expect, it } from "vitest";
import { organizationSchema, toSlug } from "./validation";

describe("toSlug", () => {
  it("normalizes accents, punctuation and whitespace", () => {
    expect(toSlug("São José / Operações & Dados")).toBe("sao-jose-operacoes-dados");
  });
  it("caps the slug at the server-side limit", () => {
    expect(toSlug("a".repeat(80))).toHaveLength(48);
  });
});

describe("organizationSchema", () => {
  it("accepts valid organization metadata", () => {
    const result = organizationSchema.safeParse({ name: "Empresa Ágil", slug: "empresa-agil", country: "BR", locale: "pt-BR", timezone: "America/Sao_Paulo", currency: "BRL" });
    expect(result.success).toBe(true);
  });
  it("rejects unsafe slugs", () => {
    expect(organizationSchema.safeParse({ name: "Empresa", slug: "../empresa" }).success).toBe(false);
  });
  it("rejects unsupported locales", () => {
    expect(organizationSchema.safeParse({ name: "Empresa", slug: "empresa", locale: "fr" }).success).toBe(false);
  });
});
