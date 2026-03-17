#!/usr/bin/env bun
// linear-lite.ts — Minimal Linear GraphQL client for agent use
// Only two commands: setup (interactive config) and api (arbitrary queries).
// Agents construct their own queries using references/api.md as reference.

import { resolve, dirname } from "path";
import { readFileSync, writeFileSync, existsSync } from "fs";

const SKILL_DIR = dirname(new URL(import.meta.url).pathname).replace(/\/scripts$/, "");
const CONFIG_PATH = resolve(SKILL_DIR, "config.json");
const LINEAR_API = "https://api.linear.app/graphql";

// ---------------------------------------------------------------------------
// Config
// ---------------------------------------------------------------------------

interface Config {
  apiKey: string;
  teamKey: string;
}

function loadConfig(): Config {
  if (!existsSync(CONFIG_PATH)) {
    console.error(`❌ config.json not found: ${CONFIG_PATH}`);
    console.error(`   Run 'bun ${process.argv[1]} setup' to initialize.`);
    process.exit(1);
  }
  const raw = JSON.parse(readFileSync(CONFIG_PATH, "utf-8"));
  const apiKey = raw.apiKey?.startsWith("$")
    ? process.env[raw.apiKey.slice(1)] || ""
    : raw.apiKey;
  if (!apiKey) {
    console.error(`❌ API key not resolved. Check config.json and env vars.`);
    process.exit(1);
  }
  return { ...raw, apiKey };
}

// ---------------------------------------------------------------------------
// GraphQL client
// ---------------------------------------------------------------------------

async function gql(apiKey: string, query: string, variables: Record<string, unknown> = {}): Promise<unknown> {
  const res = await fetch(LINEAR_API, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: apiKey },
    body: JSON.stringify({ query, variables }),
  });

  if (!res.ok) {
    console.error(`❌ Linear API ${res.status}: ${await res.text()}`);
    process.exit(1);
  }

  const json = (await res.json()) as { data?: unknown; errors?: Array<{ message: string }> };
  if (json.errors?.length) {
    console.error(`❌ GraphQL error: ${json.errors.map((e) => e.message).join(", ")}`);
    process.exit(1);
  }
  return json.data;
}

// ---------------------------------------------------------------------------
// Commands
// ---------------------------------------------------------------------------

async function cmdSetup() {
  const apiKey = process.env.LINEAR_API_KEY;
  if (!apiKey) {
    console.error("❌ Set LINEAR_API_KEY env var first.");
    process.exit(1);
  }

  console.log("🔍 Fetching teams...");
  const data = (await gql(apiKey, `query { teams(first: 20) { nodes { id name key } } }`)) as any;
  const teams = data.teams.nodes;
  teams.forEach((t: any, i: number) => console.log(`  ${i + 1}. ${t.name} (${t.key})`));

  const teamKey = teams[0]?.key;
  if (!teamKey) {
    console.error("❌ No teams found.");
    process.exit(1);
  }

  const config = { apiKey: "$LINEAR_API_KEY", teamKey };
  writeFileSync(CONFIG_PATH, JSON.stringify(config, null, 2) + "\n");
  console.log(`✅ config.json written: ${CONFIG_PATH} (team: ${teamKey})`);
}

async function cmdApi(args: string[]) {
  const config = loadConfig();
  const queryStr = args[0];
  if (!queryStr) {
    console.error("❌ Provide a GraphQL query string.");
    console.error(`   Example: bun ${process.argv[1]} api 'query { teams(first:5) { nodes { id name } } }'`);
    process.exit(1);
  }

  const varsIdx = args.indexOf("--vars");
  const variables = varsIdx !== -1 && args[varsIdx + 1] ? JSON.parse(args[varsIdx + 1]) : {};

  const data = await gql(config.apiKey, queryStr, variables);
  console.log(JSON.stringify(data, null, 2));
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

const [command, ...args] = process.argv.slice(2);

if (!command || command === "--help") {
  console.log(`Usage: bun ${process.argv[1]} <command>

Commands:
  setup                                    Initialize config.json
  api '<graphql query>' [--vars '<json>']   Execute any GraphQL query

Examples:
  bun linear-lite.ts api 'query { teams(first:5) { nodes { id name key } } }'
  bun linear-lite.ts api 'query($id:String!) { issue(id:$id) { title state { name } } }' --vars '{"id":"xxx"}'

See references/api.md for query examples.`);
  process.exit(0);
}

switch (command) {
  case "setup": await cmdSetup(); break;
  case "api":   await cmdApi(args); break;
  default:
    console.error(`❌ Unknown command: ${command}. Use 'api' for arbitrary queries.`);
    process.exit(1);
}
