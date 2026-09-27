"use client";

import { useCallback, useMemo, useState } from "react";
import type { ReactNode } from "react";
import { useRouter } from "next/navigation";
import { Button, Modal, SearchField, Spinner, Table, toast } from "@heroui/react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import type { IconDefinition } from "@fortawesome/fontawesome-svg-core";
import {
  faArrowDown,
  faArrowUp,
  faCopy,
  faEye,
  faEyeSlash,
  faPen,
  faPlus,
  faTrash,
} from "@fortawesome/free-solid-svg-icons";

import { slugify } from "@/lib/utils";
import { EmptyState } from "@/components/ui/EmptyState";

import { apiRequest } from "./api";
import { ConfirmDialog } from "./ConfirmDialog";
import { Field, type FieldSpec, type FormValues } from "./fields";

export type Column<T> = {
  key: string;
  label: string;
  isRowHeader?: boolean;
  className?: string;
  render: (item: T) => ReactNode;
};

export type ResourceManagerProps<T extends { id: string }> = {
  /** API base, e.g. "/api/admin/games". */
  endpoint: string;
  /** Server-rendered initial rows — the table is populated on first paint. */
  initialItems: T[];
  columns: Column<T>[];
  fields: FieldSpec[];
  /** Blank form values for a new entry. */
  emptyValues: FormValues;
  /** Maps an existing row back into form values. */
  toFormValues: (item: T) => FormValues;
  singular: string;
  plural: string;
  emptyIcon: IconDefinition;
  emptyTitle: string;
  emptyDescription?: string;
  /** Free-text search over the rows, client side. */
  searchFields?: (item: T) => string;
  /** Adds activate/deactivate toggles when the resource has an `active` flag. */
  hasActiveToggle?: boolean;
  /** Adds a duplicate action (POST <endpoint>/:id/duplicate). */
  hasDuplicate?: boolean;
  /** Adds the move-up / move-down buttons driven by `sortOrder`. */
  hasSorting?: boolean;
  pageSize?: number;
};

type Mode = { type: "create" } | { type: "edit"; item: { id: string } };

/**
 * One table-plus-form screen, driven by a column list and a field list.
 *
 * Every action talks to the real API: create, edit, duplicate, activate,
 * deactivate, reorder and delete all persist to MongoDB, then refresh the
 * server-rendered list so the CMS and the public site agree.
 */
export function ResourceManager<T extends { id: string; active?: boolean; sortOrder?: number }>({
  endpoint,
  initialItems,
  columns,
  fields,
  emptyValues,
  toFormValues,
  singular,
  plural,
  emptyIcon,
  emptyTitle,
  emptyDescription,
  searchFields,
  hasActiveToggle = false,
  hasDuplicate = false,
  hasSorting = false,
  pageSize = 12,
}: ResourceManagerProps<T>) {
  const router = useRouter();

  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [mode, setMode] = useState<Mode | null>(null);
  const [values, setValues] = useState<FormValues>(emptyValues);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSaving, setIsSaving] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [pendingDelete, setPendingDelete] = useState<T | null>(null);

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term || !searchFields) return initialItems;
    return initialItems.filter((item) => searchFields(item).toLowerCase().includes(term));
  }, [initialItems, search, searchFields]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const currentPage = Math.min(page, totalPages);
  const visible = filtered.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  const refresh = useCallback(() => router.refresh(), [router]);

  function openCreate() {
    setValues(emptyValues);
    setErrors({});
    setMode({ type: "create" });
  }

  function openEdit(item: T) {
    setValues(toFormValues(item));
    setErrors({});
    setMode({ type: "edit", item });
  }

  function updateValue(name: string, value: unknown) {
    setValues((current) => {
      const next = { ...current, [name]: value };

      // A slug field derived from another field auto-fills while it is still
      // untouched, and stops the moment it has been edited by hand.
      for (const field of fields) {
        if (field.kind !== "slug" || field.from !== name) continue;

        const previousSource = typeof current[name] === "string" ? (current[name] as string) : "";
        const currentSlug = typeof current[field.name] === "string" ? (current[field.name] as string) : "";

        if (currentSlug === "" || currentSlug === slugify(previousSource)) {
          next[field.name] = slugify(typeof value === "string" ? value : "");
        }
      }

      return next;
    });

    setErrors((current) => {
      if (!current[name]) return current;
      const next = { ...current };
      delete next[name];
      return next;
    });
  }

  async function save() {
    if (!mode) return;

    setIsSaving(true);
    setErrors({});

    const isCreate = mode.type === "create";
    const result = await apiRequest<{ item: T }>(
      isCreate ? endpoint : `${endpoint}/${mode.item.id}`,
      { method: isCreate ? "POST" : "PATCH", body: JSON.stringify(values) },
    );

    setIsSaving(false);

    if (!result.ok) {
      if (result.fieldErrors) setErrors(result.fieldErrors);
      toast.danger(result.message);
      return;
    }

    toast.success(isCreate ? `${singular} wurde angelegt.` : `${singular} wurde gespeichert.`);
    setMode(null);
    refresh();
  }

  async function patch(item: T, body: Record<string, unknown>, successMessage: string) {
    setBusyId(item.id);

    const result = await apiRequest<{ item: T }>(`${endpoint}/${item.id}`, {
      method: "PATCH",
      body: JSON.stringify(body),
    });

    setBusyId(null);

    if (!result.ok) {
      toast.danger(result.message);
      return;
    }

    toast.success(successMessage);
    refresh();
  }

  async function duplicate(item: T) {
    setBusyId(item.id);

    const result = await apiRequest<{ item: T }>(`${endpoint}/${item.id}/duplicate`, {
      method: "POST",
    });

    setBusyId(null);

    if (!result.ok) {
      toast.danger(result.message);
      return;
    }

    toast.success(`${singular} wurde dupliziert (deaktiviert).`);
    refresh();
  }

  async function confirmDelete() {
    if (!pendingDelete) return;

    setBusyId(pendingDelete.id);

    const result = await apiRequest<{ deleted: boolean }>(`${endpoint}/${pendingDelete.id}`, {
      method: "DELETE",
    });

    setBusyId(null);
    setPendingDelete(null);

    if (!result.ok) {
      toast.danger(result.message);
      return;
    }

    toast.success(`${singular} wurde gelöscht.`);
    refresh();
  }

  /** Swaps `sortOrder` with the neighbour so the move is persisted, not local. */
  async function move(item: T, direction: -1 | 1) {
    const index = filtered.findIndex((entry) => entry.id === item.id);
    const neighbour = filtered[index + direction];
    if (!neighbour) return;

    setBusyId(item.id);

    const itemOrder = item.sortOrder ?? index;
    const neighbourOrder = neighbour.sortOrder ?? index + direction;
    const [a, b] =
      itemOrder === neighbourOrder
        ? [index + direction, index]
        : [neighbourOrder, itemOrder];

    const results = await Promise.all([
      apiRequest(`${endpoint}/${item.id}`, {
        method: "PATCH",
        body: JSON.stringify({ sortOrder: a }),
      }),
      apiRequest(`${endpoint}/${neighbour.id}`, {
        method: "PATCH",
        body: JSON.stringify({ sortOrder: b }),
      }),
    ]);

    setBusyId(null);

    if (results.some((result) => !result.ok)) {
      toast.danger("Die Sortierung konnte nicht geändert werden.");
      return;
    }

    refresh();
  }

  const actionCount =
    1 + (hasActiveToggle ? 1 : 0) + (hasDuplicate ? 1 : 0) + (hasSorting ? 2 : 0) + 1;

  return (
    <>
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        {searchFields ? (
          <SearchField
            aria-label={`${plural} durchsuchen`}
            value={search}
            onChange={(value) => {
              setSearch(value);
              setPage(1);
            }}
            className="w-full sm:max-w-xs"
          >
            <SearchField.Group>
              <SearchField.SearchIcon />
              <SearchField.Input placeholder={`${plural} durchsuchen …`} />
              {search ? <SearchField.ClearButton /> : null}
            </SearchField.Group>
          </SearchField>
        ) : (
          <span />
        )}

        <Button variant="primary" onPress={openCreate}>
          <FontAwesomeIcon icon={faPlus} className="size-3.5" aria-hidden />
          {singular} hinzufügen
        </Button>
      </div>

      {initialItems.length === 0 ? (
        <EmptyState
          icon={emptyIcon}
          title={emptyTitle}
          description={emptyDescription}
          action={
            <Button variant="primary" onPress={openCreate}>
              <FontAwesomeIcon icon={faPlus} className="size-3.5" aria-hidden />
              {singular} hinzufügen
            </Button>
          }
        />
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={emptyIcon}
          title="Keine Treffer."
          description="Für diese Suche gibt es keine Einträge."
        />
      ) : (
        <>
          <Table>
            <Table.ScrollContainer>
              <Table.Content aria-label={plural} className="min-w-[640px]">
                <Table.Header>
                  {columns.map((column) => (
                    <Table.Column
                      key={column.key}
                      isRowHeader={column.isRowHeader}
                      className={column.className}
                    >
                      {column.label}
                    </Table.Column>
                  ))}
                  <Table.Column className="text-right">Aktionen</Table.Column>
                </Table.Header>

                <Table.Body>
                  {visible.map((item) => (
                    <Table.Row key={item.id}>
                      {columns.map((column) => (
                        <Table.Cell key={column.key} className={column.className}>
                          {column.render(item)}
                        </Table.Cell>
                      ))}

                      <Table.Cell className="text-right">
                        <div
                          className="flex items-center justify-end gap-1"
                          style={{ minWidth: `${actionCount * 2.25}rem` }}
                        >
                          {busyId === item.id ? (
                            <Spinner size="sm" aria-label="Wird verarbeitet" />
                          ) : (
                            <>
                              {hasSorting ? (
                                <>
                                  <IconAction
                                    icon={faArrowUp}
                                    label="Nach oben"
                                    onPress={() => move(item, -1)}
                                  />
                                  <IconAction
                                    icon={faArrowDown}
                                    label="Nach unten"
                                    onPress={() => move(item, 1)}
                                  />
                                </>
                              ) : null}

                              {hasActiveToggle ? (
                                <IconAction
                                  icon={item.active ? faEye : faEyeSlash}
                                  label={item.active ? "Deaktivieren" : "Aktivieren"}
                                  onPress={() =>
                                    patch(
                                      item,
                                      { active: !item.active },
                                      item.active
                                        ? `${singular} ist jetzt ausgeblendet.`
                                        : `${singular} ist jetzt öffentlich sichtbar.`,
                                    )
                                  }
                                />
                              ) : null}

                              {hasDuplicate ? (
                                <IconAction
                                  icon={faCopy}
                                  label="Duplizieren"
                                  onPress={() => duplicate(item)}
                                />
                              ) : null}

                              <IconAction
                                icon={faPen}
                                label="Bearbeiten"
                                onPress={() => openEdit(item)}
                              />

                              <IconAction
                                icon={faTrash}
                                label="Löschen"
                                danger
                                onPress={() => setPendingDelete(item)}
                              />
                            </>
                          )}
                        </div>
                      </Table.Cell>
                    </Table.Row>
                  ))}
                </Table.Body>
              </Table.Content>
            </Table.ScrollContainer>
          </Table>

          {totalPages > 1 ? (
            <div className="mt-5 flex items-center justify-between gap-4">
              <p className="text-sm text-ink-400">
                Seite {currentPage} von {totalPages} · {filtered.length} Einträge
              </p>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  isDisabled={currentPage <= 1}
                  onPress={() => setPage(currentPage - 1)}
                >
                  Zurück
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  isDisabled={currentPage >= totalPages}
                  onPress={() => setPage(currentPage + 1)}
                >
                  Weiter
                </Button>
              </div>
            </div>
          ) : null}
        </>
      )}

      <Modal.Backdrop
        isOpen={mode !== null}
        onOpenChange={(open) => {
          if (!open) setMode(null);
        }}
      >
        <Modal.Container size="lg">
          <Modal.Dialog>
            <Modal.CloseTrigger />
            <Modal.Header>
              <Modal.Heading>
                {mode?.type === "edit" ? `${singular} bearbeiten` : `${singular} hinzufügen`}
              </Modal.Heading>
            </Modal.Header>

            <Modal.Body>
              <form
                id="resource-form"
                onSubmit={(event) => {
                  event.preventDefault();
                  void save();
                }}
                className="grid gap-5 sm:grid-cols-2"
              >
                {fields.map((field) => (
                  <Field
                    key={field.name}
                    field={field}
                    values={values}
                    errors={errors}
                    onChange={updateValue}
                  />
                ))}
              </form>
            </Modal.Body>

            <Modal.Footer>
              <Button slot="close" variant="tertiary" isDisabled={isSaving}>
                Abbrechen
              </Button>
              <Button
                variant="primary"
                type="submit"
                form="resource-form"
                isDisabled={isSaving}
              >
                {isSaving ? "Wird gespeichert …" : "Speichern"}
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
        title={`${singular} wirklich löschen?`}
        description={`Dieser Eintrag wird dauerhaft aus der Datenbank entfernt. Diese Aktion kann nicht rückgängig gemacht werden.`}
        isPending={busyId !== null}
        onConfirm={() => void confirmDelete()}
      />
    </>
  );
}

function IconAction({
  icon,
  label,
  onPress,
  danger = false,
}: {
  icon: IconDefinition;
  label: string;
  onPress: () => void;
  danger?: boolean;
}) {
  return (
    <Button
      variant="ghost"
      size="sm"
      isIconOnly
      aria-label={label}
      onPress={onPress}
      className={danger ? "text-danger" : undefined}
    >
      <FontAwesomeIcon icon={icon} className="size-3.5" aria-hidden />
    </Button>
  );
}
