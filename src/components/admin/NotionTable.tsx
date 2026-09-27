"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Button,
  Input,
  Label,
  ListBox,
  Modal,
  SearchField,
  Select,
  Spinner,
  Switch,
  TextArea,
  TextField,
  toast,
} from "@heroui/react";
import type { Key } from "@heroui/react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faArrowUpRightFromSquare,
  faPen,
  faPlus,
  faRotate,
  faTrash,
  faTriangleExclamation,
} from "@fortawesome/free-solid-svg-icons";

import {
  NOTION_DB_LABELS,
  type NotionDbKey,
  type NotionField,
  type NotionRow,
  type NotionRowValue,
  type NotionTable as NotionTableData,
} from "@/lib/notion-manage-types";
import { cn, formatShortDate } from "@/lib/utils";

import { apiRequest } from "./api";
import { ConfirmDialog } from "./ConfirmDialog";

type FormValues = Record<string, NotionRowValue>;

/**
 * One Creator Buddy database, rendered from its live Notion schema.
 *
 * Columns and form fields come from the schema rather than from hard-coded
 * definitions, so adding a property in Notion surfaces it here without a code
 * change. Everything goes through the protected admin API — the Notion token
 * never reaches the browser.
 */
export function NotionTable({ dbKey }: { dbKey: NotionDbKey }) {
  const [table, setTable] = useState<NotionTableData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState("");

  const [editing, setEditing] = useState<{ row: NotionRow | null } | null>(null);
  const [values, setValues] = useState<FormValues>({});
  const [isSaving, setIsSaving] = useState(false);
  const [pendingDelete, setPendingDelete] = useState<NotionRow | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  // No setState before the await: the effect below calls this on mount, and a
  // synchronous state write inside an effect body triggers a cascading render.
  // The refresh button sets the spinner itself, from an event handler.
  const load = useCallback(async () => {
    const result = await apiRequest<NotionTableData>(`/api/admin/notion/db/${dbKey}`);

    setIsLoading(false);

    if (!result.ok) {
      setError(result.message);
      setTable(null);
      return;
    }

    setError(null);
    setTable(result.data);
  }, [dbKey]);

  const refresh = useCallback(() => {
    setIsLoading(true);
    void load();
  }, [load]);

  // Fetching on mount is what effects are for. The rule fires because it treats
  // `load` as a unit and cannot see that every setState inside it happens after
  // the await, i.e. asynchronously rather than during the effect body.
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void load();
  }, [load]);

  const titleField = table?.fields.find((field) => field.isTitle) ?? null;

  // Keep the table readable: the title plus the first few editable columns.
  const columns = useMemo(() => {
    if (!table) return [];
    const rest = table.fields.filter((field) => !field.isTitle && field.type !== "readonly");
    return [...(titleField ? [titleField] : []), ...rest].slice(0, 5);
  }, [table, titleField]);

  const rows = useMemo(() => {
    if (!table) return [];
    const term = search.trim().toLowerCase();
    if (!term) return table.rows;

    return table.rows.filter((row) =>
      Object.values(row.values).some((value) =>
        String(Array.isArray(value) ? value.join(" ") : (value ?? ""))
          .toLowerCase()
          .includes(term),
      ),
    );
  }, [table, search]);

  function openCreate() {
    if (!table) return;
    setValues(
      Object.fromEntries(
        table.fields
          .filter((field) => field.type !== "readonly")
          .map((field) => [field.name, emptyFor(field)]),
      ),
    );
    setEditing({ row: null });
  }

  function openEdit(row: NotionRow) {
    if (!table) return;
    setValues(
      Object.fromEntries(
        table.fields
          .filter((field) => field.type !== "readonly")
          .map((field) => [field.name, row.values[field.name] ?? emptyFor(field)]),
      ),
    );
    setEditing({ row });
  }

  async function save() {
    if (!editing || !table) return;
    setIsSaving(true);

    const isCreate = editing.row === null;
    const result = await apiRequest(
      isCreate
        ? `/api/admin/notion/db/${dbKey}`
        : `/api/admin/notion/db/${dbKey}/${editing.row!.id}`,
      { method: isCreate ? "POST" : "PATCH", body: JSON.stringify({ values }) },
    );

    setIsSaving(false);

    if (!result.ok) {
      toast.danger(result.message);
      return;
    }

    toast.success(isCreate ? "In Notion angelegt." : "In Notion gespeichert.");
    setEditing(null);
    void load();
  }

  async function archive() {
    if (!pendingDelete) return;
    setBusyId(pendingDelete.id);

    const result = await apiRequest(`/api/admin/notion/db/${dbKey}/${pendingDelete.id}`, {
      method: "DELETE",
    });

    setBusyId(null);
    setPendingDelete(null);

    if (!result.ok) {
      toast.danger(result.message);
      return;
    }

    toast.success("Eintrag in Notion archiviert.");
    void load();
  }

  if (isLoading) {
    return (
      <div className="flex items-center gap-3 py-12 text-sm text-ink-400">
        <Spinner size="sm" aria-label="Wird geladen" />
        {NOTION_DB_LABELS[dbKey]} werden aus Notion geladen …
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex gap-4 rounded-xl border border-gold-500/30 bg-gold-500/5 p-5">
        <FontAwesomeIcon
          icon={faTriangleExclamation}
          className="mt-0.5 size-4 shrink-0 text-gold-500"
          aria-hidden
        />
        <div className="text-sm leading-relaxed text-ink-300">
          <p className="font-semibold text-ink-100">Notion antwortet nicht wie erwartet.</p>
          <p className="mt-1.5">{error}</p>
          <Button variant="outline" size="sm" className="mt-4" onPress={refresh}>
            <FontAwesomeIcon icon={faRotate} className="size-3.5" aria-hidden />
            Erneut versuchen
          </Button>
        </div>
      </div>
    );
  }

  if (!table) return null;

  return (
    <>
      <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <SearchField
          aria-label={`${NOTION_DB_LABELS[dbKey]} durchsuchen`}
          value={search}
          onChange={setSearch}
          className="w-full sm:max-w-xs"
        >
          <SearchField.Group>
            <SearchField.SearchIcon />
            <SearchField.Input placeholder="Durchsuchen …" />
            {search ? <SearchField.ClearButton /> : null}
          </SearchField.Group>
        </SearchField>

        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onPress={refresh}>
            <FontAwesomeIcon icon={faRotate} className="size-3.5" aria-hidden />
            Aktualisieren
          </Button>
          <Button variant="primary" size="sm" onPress={openCreate}>
            <FontAwesomeIcon icon={faPlus} className="size-3.5" aria-hidden />
            Neu
          </Button>
        </div>
      </div>

      {rows.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-ink-700 bg-ink-900/60 px-6 py-12 text-center">
          <p className="font-display text-sm font-semibold text-ink-100">
            {search ? "Keine Treffer." : `Noch keine Einträge in „${table.title}“.`}
          </p>
          {!search ? (
            <Button variant="primary" size="sm" className="mt-5" onPress={openCreate}>
              <FontAwesomeIcon icon={faPlus} className="size-3.5" aria-hidden />
              Eintrag anlegen
            </Button>
          ) : null}
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-ink-700">
          <table className="w-full min-w-[640px] text-left text-sm">
            <thead className="border-b border-ink-700 bg-ink-880">
              <tr>
                {columns.map((field) => (
                  <th
                    key={field.name}
                    scope="col"
                    className="px-4 py-3 font-display text-xs font-semibold tracking-wide text-ink-400 uppercase"
                  >
                    {field.name}
                  </th>
                ))}
                <th scope="col" className="px-4 py-3 text-right">
                  <span className="sr-only">Aktionen</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.id} className="border-b border-ink-800 last:border-0">
                  {columns.map((field) => (
                    <td key={field.name} className="px-4 py-3 align-top text-ink-300">
                      <CellValue field={field} value={row.values[field.name]} />
                    </td>
                  ))}
                  <td className="px-4 py-3 text-right whitespace-nowrap">
                    {busyId === row.id ? (
                      <Spinner size="sm" aria-label="Wird verarbeitet" />
                    ) : (
                      <span className="inline-flex items-center gap-1">
                        {row.url ? (
                          <a
                            href={row.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            aria-label="In Notion öffnen"
                            className="inline-flex size-8 items-center justify-center rounded-lg text-ink-500 transition-colors hover:bg-ink-850 hover:text-ink-200"
                          >
                            <FontAwesomeIcon
                              icon={faArrowUpRightFromSquare}
                              className="size-3"
                              aria-hidden
                            />
                          </a>
                        ) : null}
                        <Button
                          variant="ghost"
                          size="sm"
                          isIconOnly
                          aria-label="Bearbeiten"
                          onPress={() => openEdit(row)}
                        >
                          <FontAwesomeIcon icon={faPen} className="size-3.5" aria-hidden />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          isIconOnly
                          aria-label="Archivieren"
                          className="text-danger"
                          onPress={() => setPendingDelete(row)}
                        >
                          <FontAwesomeIcon icon={faTrash} className="size-3.5" aria-hidden />
                        </Button>
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {table.rows.length > 0 ? (
        <p className="mt-4 text-xs text-ink-500">
          {rows.length} von {table.rows.length} Einträgen · Datenbank „{table.title}“
        </p>
      ) : null}

      <Modal.Backdrop
        isOpen={editing !== null}
        onOpenChange={(open) => {
          if (!open) setEditing(null);
        }}
      >
        <Modal.Container size="lg">
          <Modal.Dialog>
            <Modal.CloseTrigger />
            <Modal.Header>
              <Modal.Heading>
                {editing?.row ? "Eintrag bearbeiten" : "Neuer Eintrag"}
              </Modal.Heading>
            </Modal.Header>

            <Modal.Body>
              <form
                id="notion-form"
                onSubmit={(event) => {
                  event.preventDefault();
                  void save();
                }}
                className="grid gap-5 sm:grid-cols-2"
              >
                {table.fields
                  .filter((field) => field.type !== "readonly")
                  .map((field) => (
                    <NotionFieldInput
                      key={field.name}
                      field={field}
                      value={values[field.name]}
                      onChange={(value) =>
                        setValues((current) => ({ ...current, [field.name]: value }))
                      }
                    />
                  ))}
              </form>
            </Modal.Body>

            <Modal.Footer>
              <Button slot="close" variant="tertiary" isDisabled={isSaving}>
                Abbrechen
              </Button>
              <Button variant="primary" type="submit" form="notion-form" isDisabled={isSaving}>
                {isSaving ? "Wird gespeichert …" : "In Notion speichern"}
              </Button>
            </Modal.Footer>
          </Modal.Dialog>
        </Modal.Container>
      </Modal.Backdrop>

      <ConfirmDialog
        isOpen={pendingDelete !== null}
        onOpenChange={(open) => {
          if (!open) setPendingDelete(null);
        }}
        title="Eintrag archivieren?"
        description="Der Eintrag wandert in Notion in den Papierkorb und verschwindet aus dieser Liste. Du kannst ihn in Notion wiederherstellen."
        confirmLabel="Archivieren"
        isPending={busyId !== null}
        onConfirm={() => void archive()}
      />
    </>
  );
}

/* -------------------------------------------------------------------------- */

function emptyFor(field: NotionField): NotionRowValue {
  if (field.type === "checkbox") return false;
  if (field.type === "multi_select" || field.type === "relation") return [];
  return "";
}

function CellValue({ field, value }: { field: NotionField; value: NotionRowValue }) {
  if (field.type === "checkbox") {
    return (
      <span className={cn("text-xs font-semibold", value ? "text-emerald-400" : "text-ink-600")}>
        {value ? "Ja" : "Nein"}
      </span>
    );
  }

  if (Array.isArray(value)) {
    if (value.length === 0) return <span className="text-ink-600">–</span>;

    const labels = value.map(
      (item) => field.options.find((option) => option.value === item)?.label ?? item,
    );

    return (
      <span className="flex flex-wrap gap-1">
        {labels.slice(0, 3).map((label) => (
          <span
            key={label}
            className="rounded-full border border-ink-650 bg-ink-800 px-2 py-0.5 text-xs text-ink-300"
          >
            {label}
          </span>
        ))}
        {labels.length > 3 ? (
          <span className="self-center text-xs text-ink-500">+{labels.length - 3}</span>
        ) : null}
      </span>
    );
  }

  const text = String(value ?? "").trim();
  if (!text) return <span className="text-ink-600">–</span>;

  if (field.type === "date") {
    return <span>{text.length >= 10 ? formatShortDate(text) : text}</span>;
  }

  if (field.isTitle) {
    return <span className="font-medium text-ink-100">{text}</span>;
  }

  return <span className="line-clamp-2">{text}</span>;
}

function NotionFieldInput({
  field,
  value,
  onChange,
}: {
  field: NotionField;
  value: NotionRowValue;
  onChange: (value: NotionRowValue) => void;
}) {
  const wide = field.isTitle || field.type === "rich_text" || field.type === "relation";
  const wrapper = wide ? "sm:col-span-2" : undefined;

  if (field.type === "checkbox") {
    return (
      <div className={cn(wrapper, "flex flex-col justify-center")}>
        <Switch isSelected={value === true} onChange={(selected) => onChange(selected)}>
          <Switch.Content>
            <Switch.Control>
              <Switch.Thumb />
            </Switch.Control>
            {field.name}
          </Switch.Content>
        </Switch>
      </div>
    );
  }

  if (field.type === "select" || field.type === "status") {
    return (
      <div className={wrapper}>
        <Select
          value={typeof value === "string" && value ? value : null}
          onChange={(key: Key | null) => onChange(key ? String(key) : "")}
          className="w-full"
        >
          <Label>{field.name}</Label>
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
        </Select>
      </div>
    );
  }

  if (field.type === "multi_select" || field.type === "relation") {
    const selected = Array.isArray(value) ? value : [];

    return (
      <div className={wrapper}>
        <fieldset>
          <legend className="mb-2 text-sm font-medium text-ink-100">{field.name}</legend>
          {field.options.length === 0 ? (
            <p className="text-sm text-ink-500">Keine Auswahl verfügbar.</p>
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
                        isOn
                          ? selected.filter((item) => item !== option.value)
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
        </fieldset>
      </div>
    );
  }

  if (field.type === "rich_text") {
    return (
      <div className={wrapper}>
        <TextField
          value={typeof value === "string" ? value : ""}
          onChange={(next) => onChange(next)}
          className="w-full"
        >
          <Label>{field.name}</Label>
          <TextArea rows={3} />
        </TextField>
      </div>
    );
  }

  const inputType =
    field.type === "date"
      ? "date"
      : field.type === "number"
        ? "number"
        : field.type === "url"
          ? "url"
          : field.type === "email"
            ? "email"
            : "text";

  return (
    <div className={wrapper}>
      <TextField
        value={
          typeof value === "string"
            ? // A Notion date can carry a time; the date input only takes the day.
              field.type === "date" && value.length > 10
              ? value.slice(0, 10)
              : value
            : typeof value === "number"
              ? String(value)
              : ""
        }
        onChange={(next) => onChange(next)}
        type={inputType}
        isRequired={field.isTitle}
        className="w-full"
      >
        <Label>{field.name}</Label>
        <Input />
      </TextField>
    </div>
  );
}
