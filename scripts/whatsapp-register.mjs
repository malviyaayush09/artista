// Switches the WhatsApp number on for the Cloud API and sets its two-step PIN.
// Reads WHATSAPP_ACCESS_TOKEN and WHATSAPP_PHONE_NUMBER_ID from .env.local.
//   npm run whatsapp:status     show the number's status only
//   npm run whatsapp:register   ask for a 6-digit PIN, then register the number
import { readFileSync } from "node:fs";
import { createInterface } from "node:readline/promises";

const GRAPH = "https://graph.facebook.com/v25.0";

const env = Object.fromEntries(
  readFileSync(new URL("../.env.local", import.meta.url), "utf8")
    .split(/\r?\n/)
    .map((l) => l.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*?)\s*$/))
    .filter(Boolean)
    .map((m) => [m[1], m[2].replace(/^["']|["']$/g, "")]),
);
const token = env.WHATSAPP_ACCESS_TOKEN;
const id = env.WHATSAPP_PHONE_NUMBER_ID;
// Errors set exitCode and stop instead of calling process.exit(): exiting while
// fetch's sockets close trips a libuv assertion on Windows.
class Stop extends Error {}
const stop = (...msg) => {
  console.error(...msg);
  throw new Stop();
};

async function call(path, init = {}) {
  const res = await fetch(`${GRAPH}/${path}`, { ...init, headers: { authorization: `Bearer ${token}`, "content-type": "application/json" } });
  const body = await res.json().catch(() => ({}));
  if (!res.ok) {
    const e = body.error ?? {};
    stop(
      `Meta said (${res.status}): ${e.message ?? JSON.stringify(body)}`,
      ...[e.error_user_title, e.error_user_msg, e.error_data?.details, e.code && `code ${e.code}${e.error_subcode ? `/${e.error_subcode}` : ""}`, e.fbtrace_id && `trace ${e.fbtrace_id}`]
        .filter(Boolean)
        .map((x) => `\n  ${x}`),
    );
  }
  return body;
}

async function main() {
  if (!token || !id) stop("Add WHATSAPP_ACCESS_TOKEN and WHATSAPP_PHONE_NUMBER_ID to .env.local first.");

  const info = await call(`${id}?fields=display_phone_number,verified_name,name_status,status,code_verification_status,quality_rating,platform_type,health_status`);
  console.log("Number:        ", info.display_phone_number);
  console.log("Display name:  ", info.verified_name, `(${info.name_status ?? "unknown"})`);
  console.log("Status:        ", info.status ?? "unknown");
  console.log("Platform:      ", info.platform_type ?? "not registered");
  console.log("Code verified: ", info.code_verification_status ?? "unknown");
  if (info.quality_rating) console.log("Quality:       ", info.quality_rating);

  // What Meta says is stopping messages. Calling (SIP) notes don't affect messaging.
  const health = info.health_status;
  if (health) {
    console.log("\nCan send:      ", health.can_send_message);
    for (const ent of health.entities ?? []) {
      for (const err of ent.errors ?? []) {
        if (/SIP/i.test(err.error_description)) continue;
        console.log(`  ✗ ${ent.entity_type}: ${err.error_description}\n      → ${err.possible_solution}`);
      }
    }
  }

  if (process.argv[2] !== "register") return;

  const prompt = "Choose a 6-digit PIN for this number (hidden while you type): ";
  console.log("");
  const rl = createInterface({ input: process.stdin, output: process.stdout, terminal: true });
  const ask = rl.question(prompt);
  // Hide the PIN: when readline redraws the line, show only the prompt, never the typed digits.
  rl._writeToOutput = (str) => {
    const at = str.indexOf(prompt);
    if (at !== -1) process.stdout.write(str.slice(0, at + prompt.length));
  };
  const pin = (await ask).trim();
  rl.close();
  console.log("");
  if (!/^\d{6}$/.test(pin)) stop("The PIN must be exactly 6 digits.");
  await call(`${id}/register`, { method: "POST", body: JSON.stringify({ messaging_product: "whatsapp", pin }) });
  console.log("\nRegistered. The number can now send messages (once templates are approved). Save the PIN somewhere safe.");
}

main().catch((e) => {
  if (!(e instanceof Stop)) console.error(e);
  process.exitCode = 1;
});
