import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { normalizeCall, upsertCall, setSetting, vapiFetch } from "./vapi.server";
import { voices } from "./voices";

/* eslint-disable @typescript-eslint/no-explicit-any */

async function assertAdmin(context: { supabase: any; userId: string }) {
  const [{ data: isAdmin }, { data: isActive }] = await Promise.all([
    context.supabase.rpc("has_role", { _user_id: context.userId, _role: "admin" }),
    context.supabase.rpc("is_active_user", { _user_id: context.userId }),
  ]);
  if (!isAdmin || !isActive) throw new Error("Permission denied");
}

// Simple in-memory throttle per isolate for sensitive actions
const lastHit = new Map<string, number>();
function throttle(key: string, ms: number) {
  const now = Date.now();
  if ((lastHit.get(key) ?? 0) > now - ms)
    throw new Error("Please wait a moment before trying again");
  lastHit.set(key, now);
}

/* ---------- First-run setup (public, only works when no admin exists) ---------- */

export const getSetupStatus = createServerFn({ method: "GET" }).handler(async () => {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { count } = await supabaseAdmin
    .from("user_roles")
    .select("id", { count: "exact", head: true })
    .eq("role", "admin");
  return { needsSetup: (count ?? 0) === 0 };
});

export const createFirstAdmin = createServerFn({ method: "POST" })
  .inputValidator((d) =>
    z
      .object({
        email: z.string().trim().email().max(255),
        password: z.string().min(8).max(72),
        fullName: z.string().trim().min(1).max(100),
      })
      .parse(d),
  )
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { count } = await supabaseAdmin
      .from("user_roles")
      .select("id", { count: "exact", head: true })
      .eq("role", "admin");
    if ((count ?? 0) > 0) throw new Error("Setup has already been completed");
    const { error } = await supabaseAdmin.auth.admin.createUser({
      email: data.email,
      password: data.password,
      email_confirm: true,
      user_metadata: { full_name: data.fullName },
    });
    if (error) throw new Error(error.message);
    return { ok: true };
  });

/* ---------- Users ---------- */

const RoleEnum = z.enum(["admin", "viewer"]);

async function activeAdminCount(admin: any, excludeId?: string) {
  const { data: roles } = await admin.from("user_roles").select("user_id").eq("role", "admin");
  const ids = (roles ?? []).map((r: any) => r.user_id).filter((id: string) => id !== excludeId);
  if (!ids.length) return 0;
  const { count } = await admin
    .from("profiles")
    .select("id", { count: "exact", head: true })
    .in("id", ids)
    .eq("is_active", true);
  return count ?? 0;
}

export const createUser = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) =>
    z
      .object({
        email: z.string().trim().email().max(255),
        fullName: z.string().trim().min(1).max(100),
        role: RoleEnum,
        password: z.string().min(8).max(72),
      })
      .parse(d),
  )
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    throttle(`create:${context.userId}`, 2000);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin.auth.admin.createUser({
      email: data.email,
      password: data.password,
      email_confirm: true,
      user_metadata: { full_name: data.fullName, role: data.role },
    });
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const setUserRole = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({ userId: z.string().uuid(), role: RoleEnum }).parse(d))
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    if (data.role === "viewer" && (await activeAdminCount(supabaseAdmin, data.userId)) === 0) {
      throw new Error("You can't remove the last active admin");
    }
    await supabaseAdmin.from("user_roles").delete().eq("user_id", data.userId);
    const { error } = await supabaseAdmin
      .from("user_roles")
      .insert({ user_id: data.userId, role: data.role });
    if (error) throw new Error("Could not update role");
    return { ok: true };
  });

export const setUserActive = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({ userId: z.string().uuid(), active: z.boolean() }).parse(d))
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    if (!data.active) {
      const { data: isAdmin } = await supabaseAdmin
        .from("user_roles")
        .select("id")
        .eq("user_id", data.userId)
        .eq("role", "admin")
        .maybeSingle();
      if (isAdmin && (await activeAdminCount(supabaseAdmin, data.userId)) === 0) {
        throw new Error("You can't deactivate the last active admin");
      }
    }
    const { error } = await supabaseAdmin
      .from("profiles")
      .update({ is_active: data.active })
      .eq("id", data.userId);
    if (error) throw new Error("Could not update user");
    await supabaseAdmin.auth.admin.updateUserById(data.userId, {
      ban_duration: data.active ? "none" : "876000h",
    });
    return { ok: true };
  });

export const deleteUser = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({ userId: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    
    // Check if this is an admin and if it would be the last active admin
    const { data: isAdmin } = await supabaseAdmin
      .from("user_roles")
      .select("id")
      .eq("user_id", data.userId)
      .eq("role", "admin")
      .maybeSingle();
    
    if (isAdmin && (await activeAdminCount(supabaseAdmin, data.userId)) === 0) {
      throw new Error("You can't delete the last active admin");
    }
    
    // Don't allow deleting yourself
    if (data.userId === context.userId) {
      throw new Error("You can't delete your own account");
    }
    
    try {
      // Delete user roles first
      await supabaseAdmin.from("user_roles").delete().eq("user_id", data.userId);
      
      // Delete profile
      const { error: profileError } = await supabaseAdmin
        .from("profiles")
        .delete()
        .eq("id", data.userId);
      
      if (profileError) {
        console.error("Profile deletion error:", profileError);
        throw new Error("Could not delete user profile");
      }
      
      // Try to delete auth user, but don't fail the entire operation if this fails
      try {
        const { error: authError } = await supabaseAdmin.auth.admin.deleteUser(data.userId);
        if (authError) {
          console.error("Auth deletion error:", authError);
          // Don't throw here - the user data is already cleaned from our database
        }
      } catch (authDeleteError) {
        console.error("Auth deletion failed:", authDeleteError);
        // Continue - the important data is already deleted
      }
      
      return { ok: true };
    } catch (error) {
      console.error("Delete user error:", error);
      throw error instanceof Error ? error : new Error("Failed to delete user");
    }
  });

export const updateUserEmail = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({ 
    userId: z.string().uuid(), 
    email: z.string().email().max(255)
  }).parse(d))
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    throttle(`update-email:${context.userId}`, 3000);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    
    // Check if the new email is already in use
    const { data: existingUser } = await supabaseAdmin.auth.admin.listUsers();
    const emailExists = existingUser.users?.some(u => u.email === data.email && u.id !== data.userId);
    
    if (emailExists) {
      throw new Error("This email is already in use by another user");
    }
    
    try {
      // Update auth email
      const { error: authError } = await supabaseAdmin.auth.admin.updateUserById(data.userId, {
        email: data.email,
        email_confirm: true
      });
      
      if (authError) {
        throw new Error(`Failed to update email: ${authError.message}`);
      }
      
      // Update profile email
      const { error: profileError } = await supabaseAdmin
        .from("profiles")
        .update({ email: data.email })
        .eq("id", data.userId);
      
      if (profileError) {
        console.error("Profile email update error:", profileError);
        // Auth email was updated, so don't fail completely
      }
      
      return { ok: true };
    } catch (error) {
      console.error("Update email error:", error);
      throw error instanceof Error ? error : new Error("Failed to update email");
    }
  });

export const updateUserPassword = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({ 
    userId: z.string().uuid(), 
    password: z.string().min(8).max(72)
  }).parse(d))
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    throttle(`update-password:${context.userId}`, 3000);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    
    try {
      // Update auth password
      const { error: authError } = await supabaseAdmin.auth.admin.updateUserById(data.userId, {
        password: data.password
      });
      
      if (authError) {
        throw new Error(`Failed to update password: ${authError.message}`);
      }
      
      return { ok: true };
    } catch (error) {
      console.error("Update password error:", error);
      throw error instanceof Error ? error : new Error("Failed to update password");
    }
  });

/* ---------- Vapi ---------- */

export const getVapiSettings = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: rows } = await supabaseAdmin
      .from("app_settings")
      .select("key, value")
      .in("key", ["last_sync_at", "last_webhook_at"]);
    const get = (k: string) => (rows ?? []).find((r) => r.key === k)?.value as string | null;
    return {
      hasPrivateKey: !!process.env["VAPI_PRIVATE_KEY"],
      hasServerSecret: !!process.env["VAPI_SERVER_SECRET"],
      assistantId: process.env["VAPI_ASSISTANT_ID"] ?? null,
      lastSyncAt: get("last_sync_at") ?? null,
      lastWebhookAt: get("last_webhook_at") ?? null,
    };
  });

export const checkWebhookHealth = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    
    try {
      // Check recent webhook events
      const { data: recentWebhooks, count } = await supabaseAdmin
        .from("webhook_events")
        .select("*", { count: "exact" })
        .order("created_at", { ascending: false })
        .limit(10);
      
      // Check webhook configuration
      const hasSecret = !!process.env["VAPI_SERVER_SECRET"];
      const webhook_url = typeof window !== "undefined" 
        ? `${window.location.origin}/api/public/vapi-webhook`
        : "Not available on server";
      
      return {
        webhookConfigured: hasSecret,
        webhookUrl: webhook_url,
        totalWebhookEvents: count || 0,
        recentWebhooks: recentWebhooks?.map(w => ({
          eventType: w.event_type,
          vapiCallId: w.vapi_call_id,
          createdAt: w.created_at,
          processedAt: w.processed_at,
        })) || []
      };
    } catch (error) {
      console.error("Webhook health check failed:", error);
      throw error instanceof Error ? error : new Error("Failed to check webhook health");
    }
  });

export const fetchRawVapiCalls = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAdmin(context);
    const key = process.env["VAPI_PRIVATE_KEY"];
    if (!key) throw new Error("Vapi private key is not configured");
    
    const assistantId = process.env["VAPI_ASSISTANT_ID"];
    
    try {
      // Fetch just the first few calls for inspection
      const qs = new URLSearchParams({ limit: "5" });
      if (assistantId) qs.set("assistantId", assistantId);
      
      const res = await vapiFetch(`/call?${qs}`, key);
      if (!res.ok) {
        const errorText = await res.text().catch(() => 'Unknown error');
        throw new Error(`Vapi API error (${res.status}): ${errorText}`);
      }
      
      const calls = await res.json();
      
      console.log("Raw Vapi calls response:", calls);
      
      return {
        success: true,
        totalCalls: Array.isArray(calls) ? calls.length : 0,
        calls: Array.isArray(calls) ? calls.slice(0, 3) : [], // Return first 3 for inspection
        assistantId: assistantId || null,
        endpoint: `/call?${qs}`
      };
    } catch (error) {
      console.error("Failed to fetch raw Vapi calls:", error);
      throw error instanceof Error ? error : new Error("Unknown error");
    }
  });

export const debugCallsDatabase = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    
    try {
      // Get total call count
      const { count: totalCalls } = await supabaseAdmin
        .from("calls")
        .select("*", { count: "exact", head: true });
      
      // Get recent calls
      const { data: recentCalls } = await supabaseAdmin
        .from("calls")
        .select("vapi_call_id, status, started_at, customer_number, created_at")
        .order("created_at", { ascending: false })
        .limit(10);
      
      // Get calls by status
      const { data: statusCounts } = await supabaseAdmin
        .from("calls")
        .select("status")
        .not("status", "is", null);
      
      const statusSummary = statusCounts?.reduce((acc, call) => {
        acc[call.status] = (acc[call.status] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);
      
      // Get webhook events
      const { count: webhookEvents } = await supabaseAdmin
        .from("webhook_events")
        .select("*", { count: "exact", head: true });
      
      // Get app settings
      const { data: settings } = await supabaseAdmin
        .from("app_settings")
        .select("key, value")
        .in("key", ["last_sync_at", "last_webhook_at"]);
      
      const settingsMap = settings?.reduce((acc, setting) => {
        acc[setting.key] = setting.value;
        return acc;
      }, {} as Record<string, any>);
      
      return {
        database: {
          totalCalls: totalCalls || 0,
          statusSummary: statusSummary || {},
          webhookEvents: webhookEvents || 0,
          lastSyncAt: settingsMap?.last_sync_at || null,
          lastWebhookAt: settingsMap?.last_webhook_at || null,
          recentCalls: recentCalls?.map(call => ({
            vapiId: call.vapi_call_id,
            status: call.status,
            startedAt: call.started_at,
            customerNumber: call.customer_number,
            createdAt: call.created_at
          })) || []
        }
      };
    } catch (error) {
      console.error("Database debug failed:", error);
      throw error instanceof Error ? error : new Error("Failed to query database");
    }
  });

export const testVapiConnection = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAdmin(context);
    throttle(`test:${context.userId}`, 3000);
    const key = process.env["VAPI_PRIVATE_KEY"];
    if (!key) return { status: "not_configured" as const, message: "Vapi private key is not set" };
    
    try {
      const assistantId = process.env["VAPI_ASSISTANT_ID"];
      
      // Test basic API connectivity
      const res = await vapiFetch(
        assistantId ? `/assistant/${encodeURIComponent(assistantId)}` : "/assistant?limit=1",
        key,
      );
      
      if (res.ok) {
        const body: any = await res.json().catch(() => null);
        
        // Also test call endpoint to see if we can fetch calls
        const callsRes = await vapiFetch("/call?limit=1", key);
        const callsData = callsRes.ok ? await callsRes.json().catch(() => []) : [];
        
        return {
          status: "connected" as const,
          message:
            assistantId && body?.name
              ? `Connected — assistant "${body.name}"`
              : "Connected to Vapi",
          details: {
            assistantConfigured: !!assistantId,
            callsAvailable: Array.isArray(callsData) ? callsData.length : 0,
            assistantId: assistantId ? `${assistantId.slice(0, 8)}...` : 'not configured'
          }
        };
      }
      if (res.status === 401 || res.status === 403)
        return { status: "error" as const, message: "Vapi rejected the API key" };
      if (res.status === 404)
        return { status: "error" as const, message: "Assistant ID not found in Vapi" };
      return { status: "error" as const, message: `Vapi responded with status ${res.status}` };
    } catch (error) {
      console.error("Vapi connection test failed:", error);
      return { status: "error" as const, message: `Could not reach Vapi: ${error instanceof Error ? error.message : 'Unknown error'}` };
    }
  });

export const syncVapiCalls = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAdmin(context);
    throttle(`sync:${context.userId}`, 10000);
    const key = process.env["VAPI_PRIVATE_KEY"];
    if (!key) throw new Error("Vapi is not configured. Add your Vapi private key first.");
    const assistantId = process.env["VAPI_ASSISTANT_ID"];
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    console.log("Starting Vapi call sync...", {
      hasKey: !!key,
      hasAssistantId: !!assistantId,
      assistantId: assistantId ? `${assistantId.slice(0, 8)}...` : 'not set'
    });

    let synced = 0;
    let errors: string[] = [];
    let before: string | undefined;
    let totalFetched = 0;
    
    try {
      for (let page = 0; page < 20; page++) { // Increased page limit
        console.log(`Fetching page ${page + 1}...`);
        
        const qs = new URLSearchParams({ limit: "100" });
        if (assistantId) qs.set("assistantId", assistantId);
        if (before) qs.set("createdAtLt", before);
        
        const url = `/call?${qs}`;
        console.log(`Vapi API URL: ${url}`);
        
        const res = await vapiFetch(url, key);
        console.log(`Vapi API response status: ${res.status}`);
        
        if (res.status === 429) {
          console.log("Rate limited by Vapi, stopping sync");
          errors.push("Rate limited by Vapi API");
          break;
        }
        
        if (!res.ok) {
          const errorText = await res.text().catch(() => 'Unknown error');
          console.error(`Vapi API error: ${res.status} - ${errorText}`);
          throw new Error(`Vapi request failed (status ${res.status}): ${errorText}`);
        }
        
        const calls: any[] = await res.json();
        console.log(`Received ${calls.length} calls from Vapi`);
        totalFetched += calls.length;
        
        if (!Array.isArray(calls)) {
          console.error("Vapi returned non-array response:", calls);
          throw new Error("Invalid response format from Vapi API");
        }
        
        if (calls.length === 0) {
          console.log("No more calls to fetch");
          break;
        }
        
        // Process each call
        for (const c of calls) {
          try {
            console.log(`Processing call ${c.id} - status: ${c.status}, type: ${c.type}`);
            const row = normalizeCall(c);
            if (!row) {
              console.log(`Skipping call ${c.id} - could not normalize`);
              continue;
            }
            
            await upsertCall(supabaseAdmin, row, c.status === "ended");
            synced++;
            console.log(`Successfully synced call ${c.id}`);
          } catch (callError) {
            console.error(`Error processing call ${c.id}:`, callError);
            errors.push(`Call ${c.id}: ${callError instanceof Error ? callError.message : 'Unknown error'}`);
          }
        }
        
        // Check if we have more pages
        if (calls.length < 100) {
          console.log("Reached last page (fewer than 100 calls)");
          break;
        }
        
        // Set up for next page
        before = calls[calls.length - 1]?.createdAt;
        if (!before) {
          console.log("No createdAt found for pagination, stopping");
          break;
        }
        
        console.log(`Next page will start before: ${before}`);
        
        // Rate limiting delay
        await new Promise((r) => setTimeout(r, 500)); // Increased delay
      }
      
      await setSetting(supabaseAdmin, "last_sync_at", new Date().toISOString());
      
      console.log("Sync completed:", {
        totalFetched,
        synced,
        errors: errors.length
      });
      
      return { 
        synced, 
        totalFetched, 
        errors: errors.length > 0 ? errors.slice(0, 5) : [] // Return first 5 errors
      };
    } catch (error) {
      console.error("Sync failed:", error);
      throw error instanceof Error ? error : new Error("Unknown sync error");
    }
  });

export const getVapiAssistant = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAdmin(context);
    const key = process.env["VAPI_PRIVATE_KEY"];
    const assistantId = process.env["VAPI_ASSISTANT_ID"];
    
    if (!key || !assistantId) {
      return null;
    }

    try {
      const res = await vapiFetch(`/assistant/${encodeURIComponent(assistantId)}`, key);
      if (!res.ok) throw new Error(`Vapi request failed (status ${res.status})`);
      
      const assistant: any = await res.json();
      
      console.log("Raw assistant data from Vapi:", JSON.stringify(assistant, null, 2));
      
      // Safely extract and truncate system prompt if needed
      let systemPrompt = assistant.model?.messages?.[0]?.content || assistant.systemPrompt || "";
      if (systemPrompt.length > 4000) {
        systemPrompt = systemPrompt.substring(0, 3997) + "...";
      }
      
      // Extract voice ID - handle different possible formats
      let voiceId = "";
      if (assistant.voice?.voiceId) {
        voiceId = assistant.voice.voiceId;
      } else if (assistant.voice?.voice) {
        voiceId = assistant.voice.voice;
      } else if (typeof assistant.voice === "string") {
        voiceId = assistant.voice;
      }
      
      console.log("Extracted voice ID:", voiceId);
      
      return {
        id: assistant.id,
        name: assistant.name || "",
        firstMessage: assistant.firstMessage || "",
        systemPrompt: systemPrompt,
        voice: voiceId,
        model: assistant.model?.model || "",
        temperature: assistant.model?.temperature || 0.7,
        maxDurationSeconds: assistant.maxDurationSeconds || 600,
      };
    } catch (error) {
      console.error("Failed to get assistant:", error);
      return null;
    }
  });

export const updateVapiAssistant = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) =>
    z.object({
      name: z.string().min(1).max(100),
      firstMessage: z.string().min(1).max(500),
      systemPrompt: z.string().min(1).max(4000), // Increased limit
      voice: z.string().min(1),
      model: z.string().min(1),
      temperature: z.number().min(0).max(2),
      maxDurationSeconds: z.number().min(30).max(3600),
    }).parse(d),
  )
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const key = process.env["VAPI_PRIVATE_KEY"];
    const assistantId = process.env["VAPI_ASSISTANT_ID"];
    
    if (!key || !assistantId) {
      throw new Error("Vapi is not configured. Add your Vapi private key and assistant ID first.");
    }

    try {
      // Prepare voice configuration based on selection
      let voiceConfig;
      const voiceInfo = voices.find(v => v.id === data.voice);
      
      if (voiceInfo?.provider === "OpenAI" || ["alloy", "echo", "fable", "nova", "shimmer"].includes(data.voice)) {
        voiceConfig = {
          provider: "openai",
          voiceId: data.voice
        };
      } else {
        // Default to OpenAI alloy if voice not found
        voiceConfig = {
          provider: "openai",
          voiceId: "alloy"
        };
      }

      // Prepare model configuration
      let modelConfig;
      if (data.model.includes("claude")) {
        modelConfig = {
          provider: "anthropic",
          model: data.model,
          temperature: data.temperature,
          messages: [
            {
              role: "system",
              content: data.systemPrompt
            }
          ]
        };
      } else {
        modelConfig = {
          provider: "openai",
          model: data.model,
          temperature: data.temperature,
          messages: [
            {
              role: "system", 
              content: data.systemPrompt
            }
          ]
        };
      }

      const updatePayload = {
        name: data.name,
        firstMessage: data.firstMessage,
        model: modelConfig,
        voice: voiceConfig,
        maxDurationSeconds: data.maxDurationSeconds,
      };

      console.log("Updating assistant with payload:", JSON.stringify(updatePayload, null, 2));
      console.log("Voice config being sent:", JSON.stringify(voiceConfig, null, 2));
      
      // Use vapiFetch with PATCH method
      const updateRes = await fetch(`https://api.vapi.ai/assistant/${encodeURIComponent(assistantId)}`, {
        method: "PATCH",
        headers: {
          "Authorization": `Bearer ${key}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(updatePayload),
      });

      if (!updateRes.ok) {
        const errorText = await updateRes.text().catch(() => 'Unknown error');
        console.error("Vapi update error:", errorText);
        
        if (updateRes.status === 404) {
          throw new Error("Assistant not found. Please check your Assistant ID in environment variables.");
        } else if (updateRes.status === 401 || updateRes.status === 403) {
          throw new Error("Authentication failed. Please check your Vapi private key.");
        } else {
          throw new Error(`Failed to update assistant: ${errorText} (status ${updateRes.status})`);
        }
      }

      const result = await updateRes.json().catch(() => ({ success: true }));
      console.log("Assistant updated successfully:", result);
      
      return { success: true };
    } catch (error) {
      console.error("Failed to update assistant:", error);
      throw error instanceof Error ? error : new Error("Unknown error occurred");
    }
  });

/* ---------- Types ---------- */

export type UserRow = {
  id: string;
  email: string;
  full_name: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  user_roles: {
    role: "admin" | "viewer";
  };
};
