// the app's data boundary: fixed records are fetched once at startup, like an API response.
// swapping these URLs for real endpoints is the only change a backend needs
const files = ["accounts", "initiatives", "metrics", "funnel", "retention", "help"];

async function getJson(name) {
  const response = await fetch(new URL(`./${name}.json`, import.meta.url));

  if (!response.ok) {
    throw new Error(`${name}.json responded ${response.status}`);
  }

  return response.json();
}

// top-level await: modules importing `seed` run once the data has arrived
const results = await Promise.all(files.map(getJson));

export const seed = Object.fromEntries(files.map((name, i) => [name, results[i]]));
