"use client";

import { useId } from "react";
import {
  Description,
  FieldError,
  Input,
  Label,
  ListBox,
  Select,
  Switch,
  TextArea,
  TextField,
} from "@heroui/react";
import type { Key } from "@heroui/react";

import { cn } from "@/lib/utils";

export type SelectOption = { value: string; label: string };

/**
 * Declarative field definitions.
 *
 * Every CMS form is a list of these, which keeps the seven resource forms
 * consistent (labels, spacing, error placement) and means a new content type
 * needs a field list rather than a new form component.
 */
export type FieldSpec =
  | { kind: "text"; name: string; label: string; placeholder?: string; help?: string; required?: boolean; span?: 1 | 2 }
  | { kind: "slug"; name: string; label: string; from: string; help?: string; span?: 1 | 2 }
  | { kind: "url"; name: string; label: string; placeholder?: string; help?: string; span?: 1 | 2 }
  | { kind: "textarea"; name: string; label: string; rows?: number; placeholder?: string; help?: string; required?: boolean; span?: 1 | 2 }
  | { kind: "select"; name: string; label: string; options: SelectOption[]; help?: string; span?: 1 | 2 }
  | { kind: "multiselect"; name: string; label: string; options: SelectOption[]; help?: string; span?: 1 | 2 }
  | { kind: "tags"; name: string; label: string; help?: string; placeholder?: string; span?: 1 | 2 }
  | { kind: "switch"; name: string; label: string; help?: string; span?: 1 | 2 }
  | { kind: "number"; name: string; label: string; help?: string; span?: 1 | 2 }
  | { kind: "date"; name: string; label: string; help?: string; span?: 1 | 2 }
  | { kind: "time"; name: string; label: string; help?: string; span?: 1 | 2 }
  | { kind: "image"; name: string; label: string; help?: string; span?: 1 | 2 }
  | { kind: "color"; name: string; label: string; help?: string; span?: 1 | 2 };

export type FormValues = Record<string, unknown>;

type FieldProps = {
  field: FieldSpec;
  values: FormValues;
  errors: Record<string, string>;
  onChange: (name: string, value: unknown) => void;
};

const asString = (value: unknown): string =>
  typeof value === "string" ? value : typeof value === "number" ? String(value) : "";

const asArray = (value: unknown): string[] =>
  Array.isArray(value) ? value.filter((item): item is string => typeof item === "string") : [];

export function Field({ field, values, errors, onChange }: FieldProps) {
  const id = useId();
  const error = errors[field.name];
  const span = field.span ?? 1;
  const wrapper = cn(span === 2 && "sm:col-span-2");

  switch (field.kind) {
    case "text":
    case "slug":
    case "url":
    case "date":
    case "time":
    case "number": {
      const type =
        field.kind === "date"
          ? "date"
          : field.kind === "time"
            ? "time"
            : field.kind === "number"
              ? "number"
              : field.kind === "url"
                ? "url"
                : "text";

      return (
        <div className={wrapper}>
          <TextField
            value={asString(values[field.name])}
            onChange={(value) => onChange(field.name, value)}
            isInvalid={Boolean(error)}
            isRequired={"required" in field ? field.required : false}
            type={type}
            className="w-full"
          >
            <Label>{field.label}</Label>
            <Input placeholder={"placeholder" in field ? field.placeholder : undefined} />
            {error ? (
              <FieldError>{error}</FieldError>
            ) : field.help ? (
              <Description>{field.help}</Description>
            ) : null}
          </TextField>
        </div>
      );
    }

    case "textarea":
      return (
        <div className={wrapper}>
          <TextField
            value={asString(values[field.name])}
            onChange={(value) => onChange(field.name, value)}
            isInvalid={Boolean(error)}
            isRequired={field.required}
            className="w-full"
          >
            <Label>{field.label}</Label>
            <TextArea rows={field.rows ?? 4} placeholder={field.placeholder} />
            {error ? (
              <FieldError>{error}</FieldError>
            ) : field.help ? (
              <Description>{field.help}</Description>
            ) : null}
          </TextField>
        </div>
      );

    case "select":
      return (
        <div className={wrapper}>
          <Select
            value={asString(values[field.name]) || null}
            onChange={(key: Key | null) => onChange(field.name, key ? String(key) : "")}
            isInvalid={Boolean(error)}
            className="w-full"
          >
            <Label>{field.label}</Label>
            <Select.Trigger>
              <Select.Value />
              <Select.Indicator />
            </Select.Trigger>
            <Select.Popover>
              <ListBox>
                {field.options.map((option) => (
                  <ListBox.Item key={option.value} id={option.value} textValue={option.label}>
                    {option.label}
                    <ListBox.ItemIndicator />
                  </ListBox.Item>
                ))}
              </ListBox>
            </Select.Popover>
            {error ? (
              <FieldError>{error}</FieldError>
            ) : field.help ? (
              <Description>{field.help}</Description>
            ) : null}
          </Select>
        </div>
      );

    case "multiselect": {
      const selected = asArray(values[field.name]);

      return (
        <div className={wrapper}>
          <fieldset>
            <legend className="mb-2 text-sm font-medium text-ink-100">{field.label}</legend>
            {field.options.length === 0 ? (
              <p className="text-sm text-ink-500">
                Keine Einträge vorhanden – lege zuerst welche an.
              </p>
            ) : (
              <div className="flex flex-wrap gap-2">
                {field.options.map((option) => {
                  const isOn = selected.includes(option.value);

                  return (
                    <button
                      key={option.value}
                      type="button"
                      aria-pressed={isOn}
                      onClick={() =>
                        onChange(
                          field.name,
                          isOn
                            ? selected.filter((value) => value !== option.value)
                            : [...selected, option.value],
                        )
                      }
                      className={cn(
                        "rounded-full border px-3 py-1.5 text-sm font-medium transition-colors",
                        isOn
                          ? "border-gold-500/50 bg-gold-500/15 text-gold-300"
                          : "border-ink-700 bg-ink-850 text-ink-300 hover:border-ink-600",
                      )}
                    >
                      {option.label}
                    </button>
                  );
                })}
              </div>
            )}
            {error ? (
              <p className="mt-2 text-sm text-danger">{error}</p>
            ) : field.help ? (
              <p className="mt-2 text-xs text-ink-500">{field.help}</p>
            ) : null}
          </fieldset>
        </div>
      );
    }

    case "tags": {
      // Stored as an array; edited as a comma separated list.
      const tags = asArray(values[field.name]);

      return (
        <div className={wrapper}>
          <TextField
            value={tags.join(", ")}
            onChange={(value) =>
              onChange(
                field.name,
                value
                  .split(",")
                  .map((part) => part.trim())
                  .filter(Boolean),
              )
            }
            isInvalid={Boolean(error)}
            className="w-full"
          >
            <Label>{field.label}</Label>
            <Input placeholder={field.placeholder} />
            {error ? (
              <FieldError>{error}</FieldError>
            ) : (
              <Description>{field.help ?? "Mehrere Werte mit Komma trennen."}</Description>
            )}
          </TextField>
        </div>
      );
    }

    case "switch":
      return (
        <div className={cn(wrapper, "flex flex-col justify-center")}>
          <Switch
            isSelected={Boolean(values[field.name])}
            onChange={(isSelected) => onChange(field.name, isSelected)}
          >
            <Switch.Content>
              <Switch.Control>
                <Switch.Thumb />
              </Switch.Control>
              {field.label}
            </Switch.Content>
          </Switch>
          {field.help ? <p className="mt-2 text-xs text-ink-500">{field.help}</p> : null}
        </div>
      );

    case "color":
      return (
        <div className={wrapper}>
          <TextField
            value={asString(values[field.name])}
            onChange={(value) => onChange(field.name, value)}
            isInvalid={Boolean(error)}
            className="w-full"
          >
            <Label>{field.label}</Label>
            <div className="flex items-center gap-3">
              <Input placeholder="#ffc61a" className="flex-1" />
              <span
                aria-hidden
                className="size-9 shrink-0 rounded-lg border border-ink-700"
                style={{
                  backgroundColor: /^#(?:[0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/.test(
                    asString(values[field.name]),
                  )
                    ? asString(values[field.name])
                    : "transparent",
                }}
              />
            </div>
            {error ? (
              <FieldError>{error}</FieldError>
            ) : field.help ? (
              <Description>{field.help}</Description>
            ) : null}
          </TextField>
        </div>
      );

    case "image": {
      // Embedded { url, alt } — the alt text is asked for right next to the URL
      // so images added through the CMS stay accessible.
      const image = (values[field.name] ?? {}) as { url?: string; alt?: string };

      return (
        <div className={cn(wrapper, "space-y-3 rounded-xl border border-ink-700 p-4")}>
          <p className="text-sm font-medium text-ink-100" id={`${id}-legend`}>
            {field.label}
          </p>

          <TextField
            value={image.url ?? ""}
            onChange={(value) => onChange(field.name, { ...image, url: value })}
            isInvalid={Boolean(errors[`${field.name}.url`])}
            type="url"
            className="w-full"
          >
            <Label>Bild-URL</Label>
            <Input placeholder="https://…" />
            {errors[`${field.name}.url`] ? (
              <FieldError>{errors[`${field.name}.url`]}</FieldError>
            ) : (
              <Description>{field.help ?? "Direkte https-URL zum Bild."}</Description>
            )}
          </TextField>

          <TextField
            value={image.alt ?? ""}
            onChange={(value) => onChange(field.name, { ...image, alt: value })}
            className="w-full"
          >
            <Label>Alt-Text</Label>
            <Input placeholder="Was ist auf dem Bild zu sehen?" />
            <Description>Wichtig für Screenreader und Suchmaschinen.</Description>
          </TextField>
        </div>
      );
    }

    default:
      return null;
  }
}
