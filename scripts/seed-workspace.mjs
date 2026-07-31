#!/usr/bin/env node
// Seed script — creates (or reuses) a Supabase user + profile + workspace
// + owner membership, and prints a magic link so you can log in.
//
// Run with: node --env-file=.env.local scripts/seed-workspace.mjs <email> [workspace-name]

import { createClient } from "@supabase/supabase-js";
import { randomUUID } from "node:crypto";

const [, , emailArg, workspaceNameArg] = process.argv;

if (!emailArg) {
  console.error("Usage: node --env-file=.env.local scripts/seed-workspace.mjs <email> [workspace-name]");
  process.exit(1);
}

const email = emailArg.trim().toLowerCase();
const workspaceName = workspaceNameArg?.trim() || "Meu Brain";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !serviceKey) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY. Use --env-file=.env.local.");
  process.exit(1);
}

const admin = createClient(url, serviceKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

function slugify(input) {
  return input
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 40) || randomUUID().slice(0, 8);
}

async function findUserByEmail(email) {
  let page = 1;
  const perPage = 200;
  while (true) {
    const { data, error } = await admin.auth.admin.listUsers({ page, perPage });
    if (error) throw error;
    const match = data.users.find((u) => u.email?.toLowerCase() === email);
    if (match) return match;
    if (data.users.length < perPage) return null;
    page += 1;
  }
}

async function ensureUser(email) {
  const existing = await findUserByEmail(email);
  if (existing) {
    console.log(`✓ user exists  ${existing.id}  ${existing.email}`);
    return existing;
  }
  const { data, error } = await admin.auth.admin.createUser({
    email,
    email_confirm: true,
  });
  if (error) throw error;
  console.log(`✓ user created ${data.user.id}  ${data.user.email}`);
  return data.user;
}

async function ensureProfile(userId, email) {
  // The on_auth_user_created trigger normally handles this, but we
  // insert defensively in case the trigger is disabled or was skipped.
  const { error } = await admin
    .from("profiles")
    .upsert({ id: userId, full_name: email }, { onConflict: "id" });
  if (error) throw error;
  console.log(`✓ profile ready`);
}

async function ensureWorkspace(name, ownerId) {
  const slug = slugify(name);
  const { data: existing } = await admin
    .from("workspaces")
    .select("id, name, slug")
    .eq("owner_id", ownerId)
    .eq("slug", slug)
    .maybeSingle();

  if (existing) {
    console.log(`✓ workspace exists  ${existing.id}  ${existing.slug}`);
    return existing;
  }

  const { data, error } = await admin
    .from("workspaces")
    .insert({ name, slug, owner_id: ownerId })
    .select("id, name, slug")
    .single();
  if (error) throw error;
  console.log(`✓ workspace created ${data.id}  ${data.slug}`);
  return data;
}

async function ensureMembership(workspaceId, profileId) {
  const { error } = await admin
    .from("workspace_members")
    .upsert(
      { workspace_id: workspaceId, profile_id: profileId, role: "owner" },
      { onConflict: "workspace_id,profile_id" },
    );
  if (error) throw error;
  console.log(`✓ owner membership ready`);
}

async function generateMagicLink(email) {
  const { data, error } = await admin.auth.admin.generateLink({
    type: "magiclink",
    email,
    options: { redirectTo: "http://localhost:3000/auth/callback" },
  });
  if (error) throw error;
  return data.properties?.action_link;
}

try {
  const user = await ensureUser(email);
  await ensureProfile(user.id, email);
  const workspace = await ensureWorkspace(workspaceName, user.id);
  await ensureMembership(workspace.id, user.id);
  const link = await generateMagicLink(email);

  console.log("\n──────────────────────────────────────────────");
  console.log("  Seed OK. Open this link in your browser:");
  console.log("──────────────────────────────────────────────\n");
  console.log(link);
  console.log("\n(also sent by Supabase to your email inbox)\n");
} catch (err) {
  console.error("\n✗ seed failed", err);
  process.exit(1);
}
