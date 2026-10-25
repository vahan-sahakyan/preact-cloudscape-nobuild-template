import { signal, computed } from "@preact/signals";
import { statusTone, planOrder } from "../data/customers.js";
import { persistedSignal } from "../lib/storage.js";
import { downloadCsv } from "../lib/csv.js";
import { showToast } from "./ui-signals.js";
import { selectedRegion } from "./dashboard-signals.js";
import { accounts } from "./accounts-signals.js";

export const PAGE_SIZE = 10;

export const searchTerm = signal("");
export const statusFilter = signal([]);
export const planFilter = signal("all");
export const ownerFilter = signal("all");
export const starredOnly = signal(false);
export const sortState = signal({ key: "updatedAt", direction: "desc" });
export const page = signal(1);
export const selectedIds = signal([]);

export const starredIds = persistedSignal("starred", ["C-1050", "C-1044"]);
export const notesById = persistedSignal("notes", {});

const sortValue = {
  name: (customer) => customer.name,
  plan: (customer) => planOrder.indexOf(customer.plan),
  seats: (customer) => customer.seatsUsed / customer.seats,
  mrr: (customer) => customer.mrr,
  health: (customer) => customer.health,
  status: (customer) => statusTone[customer.status].rank,
  owner: (customer) => customer.owner,
  updatedAt: (customer) => customer.updatedAt
};

const textColumns = new Set(["name", "owner"]);

export const hasActiveFilters = computed(() => {
  return (
    searchTerm.value.trim() !== "" ||
    statusFilter.value.length > 0 ||
    planFilter.value !== "all" ||
    ownerFilter.value !== "all" ||
    starredOnly.value
  );
});

export const filteredCustomers = computed(() => {
  const query = searchTerm.value.trim().toLowerCase();
  const statuses = statusFilter.value;
  const starred = starredOnly.value ? new Set(starredIds.value) : null;
  const region = selectedRegion.value;

  return accounts.value.filter((customer) => {
    if (region && customer.region !== region) {
      return false;
    }

    const fields = [customer.name, customer.id, customer.plan, customer.owner, customer.region];

    if (query && !fields.some((field) => field.toLowerCase().includes(query))) {
      return false;
    }

    if (statuses.length > 0 && !statuses.includes(customer.status)) {
      return false;
    }

    if (planFilter.value !== "all" && customer.plan !== planFilter.value) {
      return false;
    }

    if (ownerFilter.value !== "all" && customer.owner !== ownerFilter.value) {
      return false;
    }

    return !starred || starred.has(customer.id);
  });
});

export const sortedCustomers = computed(() => {
  const { key, direction } = sortState.value;
  const read = sortValue[key];
  const multiplier = direction === "asc" ? 1 : -1;

  return [...filteredCustomers.value].sort((a, b) => {
    const left = read(a);
    const right = read(b);
    const order = typeof left === "number" ? left - right : String(left).localeCompare(String(right));
    return order * multiplier;
  });
});

export const pageCount = computed(() => Math.max(1, Math.ceil(sortedCustomers.value.length / PAGE_SIZE)));
export const currentPage = computed(() => Math.min(page.value, pageCount.value));

export const pagedCustomers = computed(() => {
  const start = (currentPage.value - 1) * PAGE_SIZE;
  return sortedCustomers.value.slice(start, start + PAGE_SIZE);
});

// any filter change jumps back to the first page
export function updateFilter(target, value) {
  target.value = value;
  page.value = 1;
}

export function resetFilters() {
  searchTerm.value = "";
  statusFilter.value = [];
  planFilter.value = "all";
  ownerFilter.value = "all";
  starredOnly.value = false;
  page.value = 1;
}

export function toggleSort(key) {
  const current = sortState.value;

  if (current.key === key) {
    sortState.value = { key, direction: current.direction === "asc" ? "desc" : "asc" };
  } else {
    sortState.value = { key, direction: textColumns.has(key) ? "asc" : "desc" };
  }

  page.value = 1;
}

export function setSelected(ids, selected) {
  const next = new Set(selectedIds.value);
  ids.forEach((id) => (selected ? next.add(id) : next.delete(id)));
  selectedIds.value = [...next];
}

export function clearSelection() {
  selectedIds.value = [];
}

export function setStarred(ids, starred) {
  const next = new Set(starredIds.value);
  ids.forEach((id) => (starred ? next.add(id) : next.delete(id)));
  starredIds.value = [...next];
  showToast(`${starred ? "Starred" : "Unstarred"} ${ids.length} account${ids.length === 1 ? "" : "s"}`, "info");
}

export function toggleStar(id) {
  const starred = starredIds.value.includes(id);
  starredIds.value = starred ? starredIds.value.filter((item) => item !== id) : [...starredIds.value, id];
  showToast(starred ? "Removed from starred" : "Added to starred", "info");
}

export function addNote(customerId, text) {
  const note = { id: `N-${Date.now()}`, text, at: Date.now() };
  const existing = notesById.value[customerId] || [];
  notesById.value = { ...notesById.value, [customerId]: [note, ...existing] };
  showToast("Note saved");
}

export function removeNote(customerId, noteId) {
  const remaining = (notesById.value[customerId] || []).filter((note) => note.id !== noteId);
  notesById.value = { ...notesById.value, [customerId]: remaining };
}

const csvColumns = [
  { label: "ID", value: (customer) => customer.id },
  { label: "Account", value: (customer) => customer.name },
  { label: "Plan", value: (customer) => customer.plan },
  { label: "Region", value: (customer) => customer.region },
  { label: "MRR", value: (customer) => customer.mrr },
  { label: "Seats used", value: (customer) => customer.seatsUsed },
  { label: "Seats", value: (customer) => customer.seats },
  { label: "Health", value: (customer) => customer.health },
  { label: "Status", value: (customer) => statusTone[customer.status].label },
  { label: "Owner", value: (customer) => customer.owner },
  { label: "Customer since", value: (customer) => customer.since },
  { label: "Updated at", value: (customer) => new Date(customer.updatedAt).toISOString() }
];

export function exportCustomers(rows) {
  const stamp = new Date().toISOString().slice(0, 10);
  downloadCsv(`pulse-accounts-${stamp}.csv`, rows, csvColumns);
  showToast(`Exported ${rows.length} account${rows.length === 1 ? "" : "s"} to CSV`);
}
