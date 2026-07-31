import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";

import "@/lib/ai"; // registers providers as side-effect
import { orchestrate } from "@/lib/ai/orchestrator";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { createSupabaseServerClient } from "@/lib/supabase/server";

const BodySchema = z.object({
  query: z.string().min(1).max(4000),
  workspaceId: z.string().uuid().optional(),
  focusNodeId: z.string().uuid().optional(),
  history: z
    .array(
      z.object({
        role: z.enum(["system", "user", "assistant", "tool"]),
        content: z.string(),
      }),
    )
    .optional(),
  bypassCache: z.boolean().optional(),
  forceTaskClass: z
    .enum([
      "sql", "vector", "memory", "planner", "generation", "summarization",
      "translation", "extraction", "coding", "conversation",
    ])
    .optional(),
});

export async function POST(request: NextRequest) {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: z.infer<typeof BodySchema>;
  try {
    body = BodySchema.parse(await request.json());
  } catch (err) {
    return NextResponse.json(
      { error: "Invalid body", details: err instanceof z.ZodError ? err.issues : undefined },
      { status: 400 },
    );
  }

  let workspaceId = body.workspaceId;
  if (!workspaceId) {
    const { data: membership } = await supabase
      .from("workspace_members")
      .select("workspace_id")
      .eq("profile_id", user.id)
      .order("created_at", { ascending: true })
      .limit(1)
      .maybeSingle();
    workspaceId = membership?.workspace_id;
  }

  if (!workspaceId) {
    return NextResponse.json(
      { error: "No workspace. Run scripts/seed-workspace.mjs first." },
      { status: 400 },
    );
  }

  let admin: ReturnType<typeof getSupabaseAdmin> | null = null;
  try {
    admin = getSupabaseAdmin();
  } catch {
    // admin optional — cost tracking will be skipped
  }

  try {
    const response = await orchestrate(
      {
        workspaceId,
        actorId: user.id,
        query: body.query,
        focusNodeId: body.focusNodeId,
        history: body.history,
        bypassCache: body.bypassCache,
        forceTaskClass: body.forceTaskClass,
      },
      { supabase, admin },
    );
    return NextResponse.json(response);
  } catch (err) {
    console.error("[api/chat] error", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Chat failed" },
      { status: 500 },
    );
  }
}
