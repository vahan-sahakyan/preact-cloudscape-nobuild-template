import { html } from "htm/preact";
import { PageHeader, Panel } from "../components/layout.js";
import { Icon } from "../components/icons.js";
import { EmptyState, KeyValue, ProgressBar, StatusIndicator } from "../components/ui.js";
import { ButtonDropdown } from "../components/button-dropdown.js";
import { Toggle } from "../components/toggle-switch.js";
import { TrendSparkline } from "../components/trend-sparkline.js";
import { statusTone, planOrder, healthTone, isAtRisk, getCustomerTrend } from "../data/customers.js";
import { accounts, owners } from "../state/accounts-signals.js";
import {
  PAGE_SIZE,
  searchTerm,
  statusFilter,
  planFilter,
  ownerFilter,
  starredOnly,
  sortState,
  page,
  selectedIds,
  starredIds,
  hasActiveFilters,
  sortedCustomers,
  pagedCustomers,
  pageCount,
  currentPage,
  updateFilter,
  resetFilters,
  toggleSort,
  setSelected,
  setStarred,
  clearSelection,
  toggleStar,
  exportCustomers
} from "../state/customers-signals.js";
import { selectedRegion } from "../state/dashboard-signals.js";
import { navigate } from "../router/router.js";
import { formatCurrency, formatCurrencyCompact, formatTimeAgo } from "../lib/format.js";
import { now } from "../state/activity-signals.js";
import { usePage } from "../hooks/use-page.js";

const columns = [
  { key: "name", label: "Account" },
  { key: "plan", label: "Plan" },
  { key: "seats", label: "Seats" },
  { key: "mrr", label: "MRR", numeric: true },
  { key: null, label: "12-month trend" },
  { key: "health", label: "Health" },
  { key: "status", label: "Status" },
  { key: "owner", label: "Owner" },
  { key: "updatedAt", label: "Updated" }
];


function Summary({ rows }) {
  const totalMrr = rows.reduce((sum, customer) => sum + customer.mrr, 0);
  const atRisk = rows.filter(isAtRisk);
  const atRiskMrr = atRisk.reduce((sum, customer) => sum + customer.mrr, 0);
  const avgHealth = rows.length ? Math.round(rows.reduce((sum, customer) => sum + customer.health, 0) / rows.length) : 0;

  return html`
    <${Panel} title="Summary" description="Totals for the accounts matching the current filters">
      <div class="column-layout">
        <${KeyValue} label="Accounts" value=${rows.length} hint=${`of ${accounts.value.length} total`} />
        <${KeyValue} label="Total MRR" value=${formatCurrencyCompact(totalMrr)} hint=${`${formatCurrency(totalMrr * 12)} ARR`} />
        <${KeyValue} label="MRR at risk" value=${formatCurrencyCompact(atRiskMrr)} hint=${`${atRisk.length} past due or churn risk`}>
          ${atRisk.length > 0 ? html`<${StatusIndicator} tone="warning" label="Needs attention" />` : null}
        <//>
        <${KeyValue} label="Average health" value=${rows.length ? avgHealth : "-"} hint="Score out of 100">
          ${rows.length ? html`<${ProgressBar} value=${avgHealth} tone=${healthTone(avgHealth)} label="Average health" showValue=${false} />` : null}
        <//>
      </div>
    <//>
  `;
}

function Select({ label, value, options, onChange }) {
  return html`
    <label class="select-wrap">
      <span class="sr-only">${label}</span>
      <select class="input select" value=${value} onChange=${(event) => onChange(event.currentTarget.value)}>
        ${options.map((option) => html`<option key=${option.value} value=${option.value}>${option.label}</option>`)}
      </select>
      <${Icon} name="caretDown" />
    </label>
  `;
}

function Filters({ matches }) {
  return html`
    <div class="table-filters">
      <label class="search-field">
        <span class="sr-only">Find accounts</span>
        <${Icon} name="search" />
        <input
          id="customer-search"
          class="input"
          type="search"
          placeholder="Find accounts"
          value=${searchTerm.value}
          onInput=${(event) => updateFilter(searchTerm, event.currentTarget.value)}
          onKeyDown=${(event) => {
            if (event.key === "Escape") {
              updateFilter(searchTerm, "");
              event.currentTarget.blur();
            }
          }}
        />
      </label>
      <${Select}
        label="Status"
        value=${statusFilter.value[0] || "all"}
        options=${[{ value: "all", label: "Any status" }, ...Object.entries(statusTone).map(([value, status]) => ({ value, label: status.label }))]}
        onChange=${(value) => updateFilter(statusFilter, value === "all" ? [] : [value])}
      />
      <${Select}
        label="Plan"
        value=${planFilter.value}
        options=${[{ value: "all", label: "Any plan" }, ...planOrder.map((plan) => ({ value: plan, label: plan }))]}
        onChange=${(value) => updateFilter(planFilter, value)}
      />
      <${Select}
        label="Owner"
        value=${ownerFilter.value}
        options=${[{ value: "all", label: "Any owner" }, ...owners.value.map((owner) => ({ value: owner, label: owner }))]}
        onChange=${(value) => updateFilter(ownerFilter, value)}
      />
      <${Toggle} label="Starred only" checked=${starredOnly.value} onChange=${(value) => updateFilter(starredOnly, value)} />
      ${hasActiveFilters.value
        ? html`
            <span class="filter-matches">${matches} ${matches === 1 ? "match" : "matches"}</span>
            <button type="button" class="link-button" onClick=${resetFilters}>Clear filters</button>
          `
        : null}
      <span class="toolbar-spacer"></span>
      <${Pagination} />
    </div>
  `;
}

function SortHeader({ column }) {
  const sort = sortState.value;

  if (!column.key) {
    return html`<th scope="col">${column.label}</th>`;
  }

  const active = sort.key === column.key;
  const ariaSort = active ? (sort.direction === "asc" ? "ascending" : "descending") : "none";

  return html`
    <th scope="col" aria-sort=${ariaSort} class=${column.numeric ? "num" : ""}>
      <button type="button" class=${`sort-button ${active ? "is-active" : ""}`} onClick=${() => toggleSort(column.key)}>
        ${column.label}<${Icon} name=${active && sort.direction === "asc" ? "caretUp" : "caretDown"} class="sort-icon" />
      </button>
    </th>
  `;
}

function CustomerRow({ customer, selected, starred }) {
  const status = statusTone[customer.status];

  return html`
    <tr
      class=${selected ? "is-selected" : ""}
      onClick=${(event) => {
        if (!event.target.closest("a, button, input, label")) {
          navigate(`/customers/${customer.id}`);
        }
      }}
    >
      <td class="col-check">
        <input
          type="checkbox"
          checked=${selected}
          aria-label=${`Select ${customer.name}`}
          onChange=${(event) => setSelected([customer.id], event.currentTarget.checked)}
        />
      </td>
      <td>
        <span class="cell-account">
          <button
            type="button"
            class=${`star-button ${starred ? "is-on" : ""}`}
            aria-pressed=${starred}
            aria-label=${`Star ${customer.name}`}
            onClick=${() => toggleStar(customer.id)}
          >
            <${Icon} name="star" filled=${starred} />
          </button>
          <span>
            <a href=${`#/customers/${customer.id}`}>${customer.name}</a>
            <span class="cell-sub">${customer.id} | ${customer.region}</span>
          </span>
        </span>
      </td>
      <td>${customer.plan}</td>
      <td class="cell-progress">
        <${ProgressBar} value=${(customer.seatsUsed / customer.seats) * 100} label="Seat utilization" showValue=${false} />
        <span class="cell-sub">${customer.seatsUsed} of ${customer.seats}</span>
      </td>
      <td class="num">${formatCurrencyCompact(customer.mrr)}</td>
      <td>
        ${customer.status === "trial"
          ? html`<span class="muted">-</span>`
          : html`<${TrendSparkline} class="table-spark" values=${getCustomerTrend(customer)} width=${88} height=${24} />`}
      </td>
      <td class="cell-progress"><${ProgressBar} value=${customer.health} tone=${healthTone(customer.health)} label="Health score" unit="" /></td>
      <td><${StatusIndicator} tone=${status.tone} label=${status.label} /></td>
      <td>${customer.owner}</td>
      <td title=${new Date(customer.updatedAt).toLocaleString()}>${formatTimeAgo(customer.updatedAt, now.value)}</td>
    </tr>
  `;
}

// Cloudscape Pagination: plain page numbers, current one bold
function Pagination() {
  const pageNumber = currentPage.value;
  const pages = pageCount.value;

  return html`
    <nav class="pagination" aria-label="Pagination">
      <button type="button" class="page-button" aria-label="Previous page" disabled=${pageNumber === 1} onClick=${() => (page.value = pageNumber - 1)}>
        <${Icon} name="chevronLeft" />
      </button>
      ${Array.from({ length: pages }, (_, i) => i + 1).map(
        (number) => html`
          <button
            key=${number}
            type="button"
            class="page-button"
            aria-label=${`Page ${number}`}
            aria-current=${number === pageNumber ? "true" : undefined}
            onClick=${() => (page.value = number)}
          >
            ${number}
          </button>
        `
      )}
      <button type="button" class="page-button" aria-label="Next page" disabled=${pageNumber === pages} onClick=${() => (page.value = pageNumber + 1)}>
        <${Icon} name="chevronRight" />
      </button>
    </nav>
  `;
}

export function CustomersPage() {
  usePage({ title: "Customers", topic: "customers", crumbs: [{ label: "Customers" }] });

  const all = sortedCustomers.value;
  const rows = pagedCustomers.value;
  // rows hidden by filters or the region stay out of bulk actions and the counter
  const selectedRows = all.filter((customer) => selectedIds.value.includes(customer.id));
  const selected = selectedRows.map((customer) => customer.id);
  const starred = new Set(starredIds.value);
  const pageIds = rows.map((customer) => customer.id);
  const selectedOnPage = pageIds.filter((id) => selected.includes(id)).length;
  const region = selectedRegion.value;

  const onAction = (id) => {
    if (id === "export-selected") {
      exportCustomers(selectedRows);
    } else if (id === "star") {
      setStarred(selected, true);
    } else if (id === "unstar") {
      setStarred(selected, false);
    } else if (id === "clear") {
      clearSelection();
    }
  };

  return html`
    <${PageHeader}
      title="Customers"
      info="customers"
      description=${region ? `Named accounts in ${region}. Change the region from the top navigation.` : "Named accounts across plans, owners and regions."}
    />

    <${Summary} rows=${all} />

    <${Panel}
      class="table-panel"
      title="Accounts"
      counter=${selected.length > 0 ? `${selected.length}/${all.length}` : all.length}
      actions=${html`
        <${ButtonDropdown}
          label="Actions"
          items=${[
            { id: "export-selected", text: "Export selected", disabled: selected.length === 0 },
            { id: "star", text: "Star selected", disabled: selected.length === 0 },
            { id: "unstar", text: "Unstar selected", disabled: selected.length === 0 },
            { id: "divider", divider: true },
            { id: "clear", text: "Clear selection", disabled: selected.length === 0 }
          ]}
          onItemClick=${onAction}
        />
        <button type="button" class="btn btn-primary" onClick=${() => exportCustomers(all)} disabled=${all.length === 0}>
          <${Icon} name="download" />Export CSV
        </button>
      `}
    >
      <${Filters} matches=${all.length} />

      ${all.length === 0
        ? html`
            <${EmptyState} icon="search" title="No matches">
              <p>We can't find a match.</p>
              <button type="button" class="btn" onClick=${resetFilters}>Clear filters</button>
            <//>
          `
        : html`
            <div class="table-wrap">
              <table class="data-table">
                <thead>
                  <tr>
                    <th scope="col" class="col-check">
                      <input
                        type="checkbox"
                        aria-label="Select all accounts on this page"
                        checked=${selectedOnPage > 0 && selectedOnPage === pageIds.length}
                        ref=${(node) => {
                          if (node) {
                            node.indeterminate = selectedOnPage > 0 && selectedOnPage < pageIds.length;
                          }
                        }}
                        onChange=${(event) => setSelected(pageIds, event.currentTarget.checked)}
                      />
                    </th>
                    ${columns.map((column) => html`<${SortHeader} key=${column.label} column=${column} />`)}
                  </tr>
                </thead>
                <tbody>
                  ${rows.map(
                    (customer) => html`
                      <${CustomerRow}
                        key=${customer.id}
                        customer=${customer}
                        selected=${selected.includes(customer.id)}
                        starred=${starred.has(customer.id)}
                      />
                    `
                  )}
                </tbody>
              </table>
            </div>
            <p class="table-footnote">Showing ${(currentPage.value - 1) * PAGE_SIZE + 1}-${Math.min(currentPage.value * PAGE_SIZE, all.length)} of ${all.length}</p>
          `}
    <//>
  `;
}
