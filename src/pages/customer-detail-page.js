import { html } from "htm/preact";
import { useState } from "preact/hooks";
import { PageHeader, Panel } from "../components/layout.js";
import { Icon } from "../components/icons.js";
import { EmptyState, KeyValue, ProgressBar, StatusIndicator } from "../components/ui.js";
import { MetricLineChart } from "../components/charts/metric-line.js";
import { statusTone, healthTone, getAccountSeries, getCustomerTimeline, getRenewalDate } from "../data/customers.js";
import { accounts, findAccount } from "../state/accounts-signals.js";
import { events, now } from "../state/activity-signals.js";
import { sortedCustomers, starredIds, notesById, toggleStar, addNote, removeNote } from "../state/customers-signals.js";
import { showToast } from "../state/ui-signals.js";
import { formatCurrency, formatCurrencyCompact, formatDate, formatDelta, formatSignedCurrency, formatTimeAgo, formatTimeUntil } from "../lib/format.js";
import { usePage } from "../hooks/use-page.js";

// prev/next follow the table's current sort and filters when the account is in it
function getNeighbours(id) {
  const list = sortedCustomers.value.some((customer) => customer.id === id) ? sortedCustomers.value : accounts.value;
  const index = list.findIndex((customer) => customer.id === id);
  return { prev: list[index - 1], next: list[index + 1], position: index + 1, total: list.length };
}

// generated milestones plus this account's entries from the shared activity feed
function getTimeline(customer) {
  const activity = events.value
    .filter((event) => event.customerId === customer.id)
    .map((event) => ({
      at: new Date(event.at),
      title: event.text[0].toUpperCase() + event.text.slice(1),
      detail: event.amount ? `${formatSignedCurrency(event.amount)} MRR` : `Activity in ${event.region}`,
      tone: event.tone
    }));

  return [...activity, ...getCustomerTimeline(customer)].sort((a, b) => b.at - a.at);
}

function copyId(id) {
  if (!navigator.clipboard) {
    showToast("Clipboard is not available here", "error");
    return;
  }

  navigator.clipboard.writeText(id).then(
    () => showToast(`Copied ${id}`),
    () => showToast("Could not copy to clipboard", "error")
  );
}

function NotesPanel({ customerId }) {
  const [draft, setDraft] = useState("");
  const notes = notesById.value[customerId] || [];

  const submit = (event) => {
    event.preventDefault();
    const text = draft.trim();

    if (!text) {
      return;
    }

    addNote(customerId, text);
    setDraft("");
  };

  return html`
    <${Panel} title="Notes" counter=${notes.length} description="Saved in this browser only">
      <form class="note-form" onSubmit=${submit}>
        <label class="sr-only" for="note-input">New note</label>
        <textarea
          id="note-input"
          class="input textarea"
          rows="3"
          placeholder="Add context for the next touchpoint..."
          value=${draft}
          onInput=${(event) => setDraft(event.currentTarget.value)}
          onKeyDown=${(event) => {
            if (event.key === "Enter" && (event.metaKey || event.ctrlKey)) {
              submit(event);
            }
          }}
        ></textarea>
        <div class="note-form-actions">
          <span class="form-hint">Ctrl/Cmd + Enter to save</span>
          <button type="submit" class="btn btn-primary btn-sm" disabled=${!draft.trim()}>Add note</button>
        </div>
      </form>

      ${notes.length === 0
        ? html`<p class="muted note-empty">No notes yet.</p>`
        : html`
            <ul class="note-list">
              ${notes.map(
                (note) => html`
                  <li key=${note.id} class="note">
                    <div class="note-head">
                      <span>${formatTimeAgo(note.at)}</span>
                      <button type="button" class="btn btn-ghost btn-icon btn-sm" aria-label="Delete note" onClick=${() => removeNote(customerId, note.id)}>
                        <${Icon} name="trash" />
                      </button>
                    </div>
                    <p>${note.text}</p>
                  </li>
                `
              )}
            </ul>
          `}
    <//>
  `;
}

export function CustomerDetailPage({ id }) {
  const customer = findAccount(id);
  usePage({
    title: customer ? customer.name : "Account not found",
    topic: "account",
    crumbs: [{ label: "Customers", href: "#/customers" }, { label: customer ? customer.name : id }]
  });

  if (!customer) {
    return html`
      <${PageHeader} title="Account not found" />
      <section class="panel">
        <${EmptyState} icon="search" title=${`No account matches "${id}"`}>
          <a class="btn" href="#/customers"><${Icon} name="arrowLeft" />Back to customers</a>
        <//>
      </section>
    `;
  }

  const status = statusTone[customer.status];
  const starred = starredIds.value.includes(customer.id);
  const series = getAccountSeries(customer);
  const change = ((series[series.length - 1].value - series[0].value) / series[0].value) * 100;
  const renewal = getRenewalDate(customer);
  const timeline = getTimeline(customer);
  const clock = now.value;
  const { prev, next, position, total } = getNeighbours(customer.id);

  return html`
    <${PageHeader}
      title=${customer.name}
      info="account"
      actions=${html`
        <button type="button" class=${`btn ${starred ? "is-starred" : ""}`} aria-pressed=${starred} onClick=${() => toggleStar(customer.id)}>
          <${Icon} name="star" filled=${starred} />${starred ? "Starred" : "Star"}
        </button>
        <button type="button" class="btn" onClick=${() => copyId(customer.id)}><${Icon} name="copy" />Copy ID</button>
        <span class="pager">
          <a class=${`btn btn-icon ${prev ? "" : "is-disabled"}`} href=${prev ? `#/customers/${prev.id}` : undefined} aria-label="Previous account" aria-disabled=${!prev}>
            <${Icon} name="chevronLeft" />
          </a>
          <span class="pager-label">${position} / ${total}</span>
          <a class=${`btn btn-icon ${next ? "" : "is-disabled"}`} href=${next ? `#/customers/${next.id}` : undefined} aria-label="Next account" aria-disabled=${!next}>
            <${Icon} name="chevronRight" />
          </a>
        </span>
      `}
    >
      <p class="account-meta">
        <${StatusIndicator} tone=${status.tone} label=${status.label} />
        <span>${customer.id}</span>
        <span>${customer.plan} plan</span>
        <span>${customer.region}</span>
        <span>Managed by ${customer.owner}</span>
      </p>
    <//>

    <${Panel} title="Account summary">
      <div class="column-layout">
        <${KeyValue}
          label="MRR"
          value=${formatCurrencyCompact(customer.mrr)}
          hint=${customer.status === "trial" ? "Projected at conversion" : `${formatDelta(change, "currency")} over 12 months`}
        />
        <${KeyValue} label="Seats used" value=${`${customer.seatsUsed} of ${customer.seats}`}>
          <${ProgressBar} value=${(customer.seatsUsed / customer.seats) * 100} label="Seat utilization" />
        <//>
        <${KeyValue} label="Health score" value=${customer.health} tone=${healthTone(customer.health)}>
          <${ProgressBar} value=${customer.health} tone=${healthTone(customer.health)} label="Health score" showValue=${false} />
        <//>
        <${KeyValue} label="Renewal" value=${formatDate(renewal)} hint=${formatTimeUntil(renewal)} />
      </div>
    <//>

    <div class="grid-main">
      <${Panel} title="MRR history" description="Monthly recurring revenue, last 12 months">
        ${customer.status === "trial"
          ? html`<${EmptyState} icon="analytics" title="Trial account">Billing history starts once the trial converts.<//>`
          : html`<${MetricLineChart} series=${series} format="currency" label="MRR" height=${260} />`}
      <//>

      <${Panel} title="Account details">
        <dl class="detail-list">
          <div><dt>Account ID</dt><dd>${customer.id}</dd></div>
          <div><dt>Plan</dt><dd>${customer.plan}</dd></div>
          <div><dt>Annual value</dt><dd>${formatCurrency(customer.mrr * 12)}</dd></div>
          <div><dt>Region</dt><dd>${customer.region}</dd></div>
          <div><dt>Owner</dt><dd>${customer.owner}</dd></div>
          <div><dt>Customer since</dt><dd>${formatDate(customer.since)}</dd></div>
          <div><dt>Last updated</dt><dd title=${new Date(customer.updatedAt).toLocaleString()}>${formatTimeAgo(customer.updatedAt, clock)}</dd></div>
        </dl>
      <//>
    </div>

    <div class="grid-halves">
      <${Panel} title="Timeline" counter=${timeline.length} description="Key moments for this account">
        <ol class="timeline">
          ${timeline.map(
            (entry) => html`
              <li key=${`${entry.title}-${entry.at.getTime()}`} class=${`timeline-item tone-${entry.tone}`}>
                <span class="timeline-dot" aria-hidden="true"></span>
                <div>
                  <p class="timeline-title">${entry.title}</p>
                  <p class="timeline-detail">${entry.detail}</p>
                  <p class="timeline-date">${formatTimeAgo(entry.at, clock)}</p>
                </div>
              </li>
            `
          )}
        </ol>
      <//>

      <${NotesPanel} customerId=${customer.id} />
    </div>
  `;
}
