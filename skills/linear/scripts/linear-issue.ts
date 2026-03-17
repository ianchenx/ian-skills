#!/usr/bin/env bun
// linear.ts — Self-contained Linear CLI for agent use
// Zero external dependencies. Reads config.json from same directory.

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
  defaultProject?: string;
  templateIds?: Record<string, string>;
  doneStateId?: string;
}

function resolveEnvValue(value: string): string {
  if (value.startsWith("$")) {
    const envName = value.slice(1);
    const envVal = process.env[envName];
    if (!envVal) {
      console.error(`❌ Environment variable ${envName} is not set`);
      process.exit(1);
    }
    return envVal;
  }
  return value;
}

function loadConfig(): Config {
  if (!existsSync(CONFIG_PATH)) {
    console.error(`❌ config.json not found: ${CONFIG_PATH}`);
    console.error(`   Run 'bun ${process.argv[1]} setup' to initialize.`);
    process.exit(1);
  }
  const raw = JSON.parse(readFileSync(CONFIG_PATH, "utf-8"));
  return {
    ...raw,
    apiKey: resolveEnvValue(raw.apiKey),
  };
}

// ---------------------------------------------------------------------------
// GraphQL client
// ---------------------------------------------------------------------------

async function gql<T = any>(
  apiKey: string,
  query: string,
  variables: Record<string, unknown> = {}
): Promise<T> {
  const res = await fetch(LINEAR_API, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: apiKey,
    },
    body: JSON.stringify({ query, variables }),
  });

  if (!res.ok) {
    const body = await res.text();
    console.error(`❌ Linear API ${res.status}: ${body}`);
    process.exit(1);
  }

  const json = (await res.json()) as {
    data?: T;
    errors?: Array<{ message: string }>;
  };
  if (json.errors?.length) {
    console.error(`❌ GraphQL error: ${json.errors.map((e) => e.message).join(", ")}`);
    process.exit(1);
  }
  return json.data as T;
}

// ---------------------------------------------------------------------------
// Queries
// ---------------------------------------------------------------------------

const Q_TEAMS = `
  query { teams(first: 20) { nodes { id name key } } }
`;

const Q_TEMPLATES = `
  query { templates { id name description } }
`;

const Q_WORKFLOW_STATES = `
  query($teamKey: String!) {
    teams(filter: { key: { eq: $teamKey } }) {
      nodes { states { nodes { id name type } } }
    }
  }
`;

const Q_SEARCH_ISSUES = `
  query($teamKey: String!, $query: String!) {
    issues(
      filter: {
        team: { key: { eq: $teamKey } }
        title: { containsIgnoreCase: $query }
      }
      first: 20
      orderBy: updatedAt
    ) {
      nodes { id identifier title url priority state { name type } }
    }
  }
`;

const Q_LIST_ISSUES = `
  query($teamKey: String!, $states: [String!], $projectSlug: String) {
    issues(
      filter: {
        team: { key: { eq: $teamKey } }
        state: { name: { in: $states } }
        project: { slugId: { eq: $projectSlug } }
      }
      first: 50
      orderBy: updatedAt
    ) {
      nodes { id identifier title url priority state { name } }
    }
  }
`;

const Q_LIST_ISSUES_NO_PROJECT = `
  query($teamKey: String!, $states: [String!]) {
    issues(
      filter: {
        team: { key: { eq: $teamKey } }
        state: { name: { in: $states } }
      }
      first: 50
      orderBy: updatedAt
    ) {
      nodes { id identifier title url priority state { name } }
    }
  }
`;

const M_CREATE_ISSUE = `
  mutation($input: IssueCreateInput!) {
    issueCreate(input: $input) {
      success
      issue { id identifier title url }
    }
  }
`;

const M_UPDATE_ISSUE = `
  mutation($id: String!, $input: IssueUpdateInput!) {
    issueUpdate(id: $id, input: $input) {
      success
      issue { id identifier title state { name } }
    }
  }
`;

const M_ADD_COMMENT = `
  mutation($issueId: String!, $body: String!) {
    commentCreate(input: { issueId: $issueId, body: $body }) {
      success
      comment { id }
    }
  }
`;

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
  const teamsData = await gql<{ teams: { nodes: Array<{ id: string; name: string; key: string }> } }>(apiKey, Q_TEAMS);
  const teams = teamsData.teams.nodes;
  console.log("\nAvailable Teams:");
  teams.forEach((t, i) => console.log(`  ${i + 1}. ${t.name} (${t.key}) — ${t.id}`));

  const teamKey = teams.length === 1 ? teams[0].key : (() => {
    console.log("\nSelect team key (e.g. WOR), or press Enter for first:");
    // For non-interactive use, default to first team
    return teams[0].key;
  })();

  console.log(`\n✅ Using team: ${teamKey}`);

  console.log("\n🔍 Fetching templates...");
  const tplData = await gql<{ templates: Array<{ id: string; name: string; description: string }> }>(apiKey, Q_TEMPLATES);
  const templates = tplData.templates || [];
  console.log("\nAvailable Templates:");
  templates.forEach((t) => console.log(`  - ${t.name}: ${t.id}`));

  console.log("\n🔍 Fetching workflow states...");
  const statesData = await gql<{
    teams: { nodes: Array<{ states: { nodes: Array<{ id: string; name: string; type: string }> } }> };
  }>(apiKey, Q_WORKFLOW_STATES, { teamKey });
  const states = statesData.teams.nodes[0]?.states.nodes || [];
  console.log("\nAvailable States:");
  states.forEach((s) => console.log(`  - ${s.name} (${s.type}): ${s.id}`));

  const doneState = states.find((s) => s.type === "completed" || s.name === "Done");

  // Build config
  const config: Record<string, unknown> = {
    apiKey: "$LINEAR_API_KEY",
    teamKey,
    defaultProject: "",
    templateIds: {} as Record<string, string>,
    doneStateId: doneState?.id || "",
  };

  // Try to auto-map template names to types
  const templateIds: Record<string, string> = {};
  const typeKeywords: Record<string, string[]> = {
    design: ["design"],
    feat: ["feat", "feature"],
    fix: ["fix", "bug"],
    refactor: ["refactor"],
  };
  for (const tpl of templates) {
    const name = tpl.name.toLowerCase();
    for (const [type, keywords] of Object.entries(typeKeywords)) {
      if (keywords.some((kw) => name.includes(kw))) {
        templateIds[type] = tpl.id;
      }
    }
  }
  config.templateIds = templateIds;

  writeFileSync(CONFIG_PATH, JSON.stringify(config, null, 2) + "\n");
  console.log(`\n✅ config.json written: ${CONFIG_PATH}`);
  console.log("   Adjust defaultProject and templateIds as needed.");
}

async function cmdTeams() {
  const config = loadConfig();
  const data = await gql<{ teams: { nodes: Array<{ id: string; name: string; key: string }> } }>(config.apiKey, Q_TEAMS);
  for (const t of data.teams.nodes) {
    console.log(`${t.key}\t${t.name}\t${t.id}`);
  }
}

async function cmdTemplates() {
  const config = loadConfig();
  const data = await gql<{ templates: Array<{ id: string; name: string; description: string }> }>(config.apiKey, Q_TEMPLATES);
  for (const t of data.templates || []) {
    console.log(`${t.name}\t${t.id}`);
    if (t.description) console.log(`  ${t.description}`);
  }
}

async function cmdStates() {
  const config = loadConfig();
  const data = await gql<{
    teams: { nodes: Array<{ states: { nodes: Array<{ id: string; name: string; type: string }> } }> };
  }>(config.apiKey, Q_WORKFLOW_STATES, { teamKey: config.teamKey });
  for (const s of data.teams.nodes[0]?.states.nodes || []) {
    console.log(`${s.name}\t${s.type}\t${s.id}`);
  }
}

async function cmdSearch(query: string) {
  const config = loadConfig();
  const data = await gql<{
    issues: { nodes: Array<{ id: string; identifier: string; title: string; url: string; priority: number; state: { name: string; type: string } }> };
  }>(config.apiKey, Q_SEARCH_ISSUES, { teamKey: config.teamKey, query });

  if (data.issues.nodes.length === 0) {
    console.log("No matching issues found.");
    return;
  }
  for (const i of data.issues.nodes) {
    console.log(`${i.identifier}\t${i.state.name}\tP${i.priority}\t${i.title}`);
    console.log(`  ${i.url}`);
  }
}

async function cmdList(args: string[]) {
  const config = loadConfig();
  const stateFlag = getFlag(args, "--state");
  const projectFlag = getFlag(args, "--project");

  const states = stateFlag ? [stateFlag] : undefined;
  const project = projectFlag || config.defaultProject || undefined;

  let data: { issues: { nodes: Array<{ id: string; identifier: string; title: string; url: string; priority: number; state: { name: string } }> } };

  if (project) {
    data = await gql(config.apiKey, Q_LIST_ISSUES, {
      teamKey: config.teamKey,
      states: states || null,
      projectSlug: project,
    });
  } else {
    data = await gql(config.apiKey, Q_LIST_ISSUES_NO_PROJECT, {
      teamKey: config.teamKey,
      states: states || null,
    });
  }

  if (data.issues.nodes.length === 0) {
    console.log("No issues match the criteria.");
    return;
  }
  for (const i of data.issues.nodes) {
    console.log(`${i.identifier}\t${i.state.name}\tP${i.priority}\t${i.title}`);
    console.log(`  ${i.url}`);
  }
}

async function cmdCreate(args: string[]) {
  const config = loadConfig();
  const title = getFlag(args, "--title");
  if (!title) {
    console.error("❌ --title is required");
    process.exit(1);
  }

  let body = getFlag(args, "--body") || "";
  const bodyFile = getFlag(args, "--body-file");
  if (bodyFile) {
    body = readFileSync(bodyFile, "utf-8");
  }

  const templateType = getFlag(args, "--template");

  const input: Record<string, unknown> = {
    teamId: await resolveTeamId(config),
    title,
    description: body || undefined,
  };

  if (templateType && config.templateIds?.[templateType]) {
    input.templateId = config.templateIds[templateType];
  }

  const data = await gql<{
    issueCreate: { success: boolean; issue: { id: string; identifier: string; title: string; url: string } };
  }>(config.apiKey, M_CREATE_ISSUE, { input });

  if (data.issueCreate.success) {
    const i = data.issueCreate.issue;
    console.log(`✅ ${i.identifier}: ${i.title}`);
    console.log(`   ${i.url}`);
    console.log(`   id: ${i.id}`);
  } else {
    console.error("❌ Create failed");
    process.exit(1);
  }
}

async function cmdUpdate(args: string[]) {
  const config = loadConfig();
  const id = args[0];
  if (!id) {
    console.error("❌ Issue ID required (e.g. WOR-42 or Linear UUID)");
    process.exit(1);
  }

  // Resolve identifier to id if needed
  const issueId = await resolveIssueId(config, id);

  const input: Record<string, unknown> = {};
  const parentId = getFlag(args, "--parent");
  const stateName = getFlag(args, "--state");

  if (parentId) {
    input.parentId = await resolveIssueId(config, parentId);
  }
  if (stateName) {
    input.stateId = await resolveStateId(config, stateName);
  }

  if (Object.keys(input).length === 0) {
    console.error("❌ Specify at least one update (--parent, --state)");
    process.exit(1);
  }

  const data = await gql<{
    issueUpdate: { success: boolean; issue: { id: string; identifier: string; title: string; state: { name: string } } };
  }>(config.apiKey, M_UPDATE_ISSUE, { id: issueId, input });

  if (data.issueUpdate.success) {
    const i = data.issueUpdate.issue;
    console.log(`✅ ${i.identifier}: ${i.title} [${i.state.name}]`);
  } else {
    console.error("❌ Update failed");
    process.exit(1);
  }
}

async function cmdComment(args: string[]) {
  const config = loadConfig();
  const id = args[0];
  if (!id) {
    console.error("❌ Issue ID required");
    process.exit(1);
  }

  let body = getFlag(args, "--body") || "";
  const bodyFile = getFlag(args, "--body-file");
  if (bodyFile) {
    body = readFileSync(bodyFile, "utf-8");
  }

  if (!body) {
    console.error("❌ --body or --body-file is required");
    process.exit(1);
  }

  const issueId = await resolveIssueId(config, id);
  const data = await gql<{
    commentCreate: { success: boolean; comment: { id: string } };
  }>(config.apiKey, M_ADD_COMMENT, { issueId, body });

  if (data.commentCreate.success) {
    console.log(`✅ Comment added`);
  } else {
    console.error("❌ Comment failed");
    process.exit(1);
  }
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function getFlag(args: string[], flag: string): string | undefined {
  const idx = args.indexOf(flag);
  if (idx === -1 || idx + 1 >= args.length) return undefined;
  return args[idx + 1];
}

async function resolveTeamId(config: Config): Promise<string> {
  const data = await gql<{
    teams: { nodes: Array<{ id: string; key: string }> };
  }>(config.apiKey, `query($key: String!) { teams(filter: { key: { eq: $key } }) { nodes { id key } } }`, {
    key: config.teamKey,
  });
  const team = data.teams.nodes[0];
  if (!team) {
    console.error(`❌ Team "${config.teamKey}" not found`);
    process.exit(1);
  }
  return team.id;
}

const Q_RESOLVE_IDENTIFIER = `
  query($identifier: String!, $teamKey: String!) {
    issues(
      filter: {
        team: { key: { eq: $teamKey } }
        identifier: { eq: $identifier }
      }
      first: 1
    ) { nodes { id identifier } }
  }
`;

async function resolveIssueId(config: Config, idOrIdentifier: string): Promise<string> {
  // If it looks like a UUID, return as-is
  if (idOrIdentifier.includes("-") && idOrIdentifier.length > 20) return idOrIdentifier;

  // Otherwise resolve identifier (e.g. WOR-42) to id
  const data = await gql<{
    issues: { nodes: Array<{ id: string; identifier: string }> };
  }>(config.apiKey, Q_RESOLVE_IDENTIFIER, {
    identifier: idOrIdentifier,
    teamKey: config.teamKey,
  });

  const issue = data.issues.nodes[0];
  if (!issue) {
    console.error(`❌ Issue "${idOrIdentifier}" not found`);
    process.exit(1);
  }
  return issue.id;
}

async function resolveStateId(config: Config, stateName: string): Promise<string> {
  // Check if it's the "Done" state and we have it cached
  if (stateName.toLowerCase() === "done" && config.doneStateId) {
    return config.doneStateId;
  }

  const data = await gql<{
    teams: { nodes: Array<{ states: { nodes: Array<{ id: string; name: string }> } }> };
  }>(config.apiKey, Q_WORKFLOW_STATES, { teamKey: config.teamKey });

  const states = data.teams.nodes[0]?.states.nodes || [];
  const state = states.find((s) => s.name.toLowerCase() === stateName.toLowerCase());
  if (!state) {
    console.error(`❌ State "${stateName}" not found. Available: ${states.map((s) => s.name).join(", ")}`);
    process.exit(1);
  }
  return state.id;
}

// ---------------------------------------------------------------------------
// Generic API access
// ---------------------------------------------------------------------------

async function cmdApi(args: string[]) {
  const config = loadConfig();
  const queryStr = args[0];
  if (!queryStr) {
    console.error("❌ GraphQL query string required");
    console.error('   Example: api \'query { projects(first:10) { nodes { id name slugId } } }\'');
    process.exit(1);
  }

  // Parse optional variables from --vars flag
  const varsStr = getFlag(args, "--vars");
  const variables = varsStr ? JSON.parse(varsStr) : {};

  const data = await gql(config.apiKey, queryStr, variables);
  console.log(JSON.stringify(data, null, 2));
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

const [command, ...args] = process.argv.slice(2);

if (!command || command === "--help") {
  console.log(`Usage: bun ${process.argv[1]} <command> [options]

Commands:
  setup                              Initialize config.json interactively
  search <query>                     Search issues
  list [--state <name>] [--project <slug>]  List issues
  create --title "..." [--body "..."] [--template feat]  Create issue
  update <id> [--parent <id>] [--state <name>]  Update issue
  comment <id> --body "..."          Add comment
  teams                              List teams
  templates                          List templates
  states                             List workflow states
  api '<graphql query>' [--vars '<json>']  Execute arbitrary GraphQL query`);
  process.exit(0);
}

switch (command) {
  case "setup":     await cmdSetup(); break;
  case "teams":     await cmdTeams(); break;
  case "templates": await cmdTemplates(); break;
  case "states":    await cmdStates(); break;
  case "search":    await cmdSearch(args[0] || ""); break;
  case "list":      await cmdList(args); break;
  case "create":    await cmdCreate(args); break;
  case "update":    await cmdUpdate(args); break;
  case "comment":   await cmdComment(args); break;
  case "api":       await cmdApi(args); break;
  default:
    console.error(`❌ Unknown command: ${command}`);
    process.exit(1);
}
