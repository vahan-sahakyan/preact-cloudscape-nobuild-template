import { html } from "htm/preact";
import { InfoLink } from "./ui.js";

function Heading({ level, title, counter, info }) {
  const Tag = level;

  return html`
    <div class="heading-row">
      <${Tag} class="heading-title">
        ${title}${counter != null ? html` <span class="heading-counter">(${counter})</span>` : null}
      <//>
      ${info ? html`<${InfoLink} topic=${info} />` : null}
    </div>
  `;
}

// Cloudscape Header variant="h1"
export function PageHeader({ title, counter, info, description, actions, children }) {
  return html`
    <header class="page-header">
      <div class="page-header-main">
        <${Heading} level="h1" title=${title} counter=${counter} info=${info} />
        ${description ? html`<p class="page-description">${description}</p>` : null}
        ${children}
      </div>
      ${actions ? html`<div class="page-actions">${actions}</div>` : null}
    </header>
  `;
}

// Cloudscape Header variant="h2", groups the containers below it
export function SectionHeader({ title, info, description }) {
  return html`
    <header class="section-header">
      <${Heading} level="h2" title=${title} info=${info} />
      ${description ? html`<p class="page-description">${description}</p>` : null}
    </header>
  `;
}

// Cloudscape Container with an h2 header and an optional footer
export function Panel({ title, counter, info, description, actions, footer, class: className = "", children }) {
  return html`
    <section class=${`panel ${className}`}>
      ${title
        ? html`
            <header class="panel-header">
              <div class="panel-title">
                <${Heading} level="h2" title=${title} counter=${counter} info=${info} />
                ${description ? html`<p class="panel-description">${description}</p>` : null}
              </div>
              ${actions ? html`<div class="panel-actions">${actions}</div>` : null}
            </header>
          `
        : null}
      <div class="panel-body">${children}</div>
      ${footer ? html`<footer class="panel-footer">${footer}</footer>` : null}
    </section>
  `;
}

export function Breadcrumbs({ items }) {
  return html`
    <nav class="breadcrumbs" aria-label="Breadcrumbs">
      <ol>
        ${items.map((item, i) => {
          const isLast = i === items.length - 1;
          return html`
            <li key=${`${i}-${item.label}`}>
              ${isLast || !item.href ? html`<span aria-current=${isLast ? "page" : undefined}>${item.label}</span>` : html`<a href=${item.href}>${item.label}</a>`}
            </li>
          `;
        })}
      </ol>
    </nav>
  `;
}
