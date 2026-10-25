import { html } from "htm/preact";
import { Icon } from "./icons.js";
import { Panel } from "./layout.js";
import { EmptyState } from "./ui.js";
import { events, now } from "../state/activity-signals.js";
import { liveUpdates } from "../state/settings-signals.js";
import { formatSignedCurrency, formatTimeAgo } from "../lib/format.js";

const toneIcon = { success: "statusPositive", info: "statusInfo", warning: "statusWarning", error: "statusNegative", pending: "statusPending" };

function FeedItem({ event, clock }) {
  return html`
    <li class=${`feed-item ${event.isLive ? "is-new" : ""}`}>
      <span class=${`feed-icon tone-${event.tone}`}><${Icon} name=${toneIcon[event.tone]} /></span>
      <div class="feed-body">
        <p class="feed-text">
          <a href=${`#/customers/${event.customerId}`}>${event.customerName}</a> ${event.text}
        </p>
        <p class="feed-meta">${formatTimeAgo(event.at, clock)} | ${event.region}</p>
      </div>
      ${event.amount
        ? html`<span class=${`feed-amount ${event.amount > 0 ? "is-positive" : "is-negative"}`}>${formatSignedCurrency(event.amount)}</span>`
        : null}
    </li>
  `;
}

export function ActivityFeed({ region }) {
  const live = liveUpdates.value;
  const clock = now.value;
  const items = events.value.filter((event) => !region || event.region === region);

  return html`
    <${Panel}
      class="feed-panel"
      title="Live activity"
      counter=${items.length}
      info="activity"
      description=${region ? `Account events in ${region}` : "Account events across all regions"}
      actions=${html`
        <button
          type="button"
          class="btn"
          aria-pressed=${live}
          onClick=${() => {
            liveUpdates.value = !live;
          }}
        >
          <${Icon} name=${live ? "pause" : "play"} />${live ? "Pause" : "Resume"}
        </button>
      `}
    >
      <div class="feed-scroll">
        ${items.length === 0
          ? html`<${EmptyState} title="No events yet">No recent activity for accounts in ${region}.<//>`
          : html`
              <ul class="feed-list">
                ${items.map((event) => html`<${FeedItem} key=${event.id} event=${event} clock=${clock} />`)}
              </ul>
            `}
      </div>
    <//>
  `;
}
