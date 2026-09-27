"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button, toast } from "@heroui/react";

import { apiRequest } from "./api";
import { Field, type FieldSpec, type FormValues } from "./fields";

type SettingsFormProps = {
  fields: FieldSpec[];
  /** Flat values keyed by field name; nested keys use dots ("seo.metaTitle"). */
  initialValues: FormValues;
  submitLabel?: string;
};

/**
 * Editor for the site-settings singleton.
 *
 * Field names may be dotted paths, which are expanded back into the nested
 * document shape on submit. Zod reports its issues on the same dotted paths, so
 * server-side validation errors land on the right input without extra mapping.
 */
export function SettingsForm({
  fields,
  initialValues,
  submitLabel = "Speichern",
}: SettingsFormProps) {
  const router = useRouter();
  const [values, setValues] = useState<FormValues>(initialValues);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSaving, setIsSaving] = useState(false);

  function updateValue(name: string, value: unknown) {
    setValues((current) => ({ ...current, [name]: value }));
    setErrors((current) => {
      if (!current[name]) return current;
      const next = { ...current };
      delete next[name];
      return next;
    });
  }

  async function save() {
    setIsSaving(true);
    setErrors({});

    const result = await apiRequest<{ item: unknown }>("/api/admin/settings", {
      method: "PUT",
      body: JSON.stringify(expand(values)),
    });

    setIsSaving(false);

    if (!result.ok) {
      if (result.fieldErrors) setErrors(result.fieldErrors);
      toast.danger(result.message);
      return;
    }

    toast.success("Einstellungen wurden gespeichert.");
    router.refresh();
  }

  return (
    <form
      onSubmit={(event) => {
        event.preventDefault();
        void save();
      }}
      className="max-w-3xl"
    >
      <div className="grid gap-5 sm:grid-cols-2">
        {fields.map((field) => (
          <Field
            key={field.name}
            field={field}
            values={values}
            errors={errors}
            onChange={updateValue}
          />
        ))}
      </div>

      <div className="mt-8 flex items-center gap-3 border-t border-ink-800 pt-6">
        <Button variant="primary" type="submit" isDisabled={isSaving}>
          {isSaving ? "Wird gespeichert …" : submitLabel}
        </Button>
        <p className="text-xs text-ink-500">
          Änderungen sind sofort auf der öffentlichen Website sichtbar.
        </p>
      </div>
    </form>
  );
}

/** { "seo.metaTitle": "x" } -> { seo: { metaTitle: "x" } } */
function expand(flat: FormValues): Record<string, unknown> {
  const result: Record<string, unknown> = {};

  for (const [path, value] of Object.entries(flat)) {
    const parts = path.split(".");
    let target = result;

    for (let index = 0; index < parts.length - 1; index += 1) {
      const key = parts[index];
      if (typeof target[key] !== "object" || target[key] === null) target[key] = {};
      target = target[key] as Record<string, unknown>;
    }

    target[parts.at(-1) as string] = value;
  }

  return result;
}
