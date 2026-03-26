import { logger } from "@/lib/logger";
import { NextRequest, NextResponse } from "next/server";
import { AccessToken } from "livekit-server-sdk";
import { createClient } from "@/utils/supabase/server";

/**
 * V4.0: Co-pilot Mode - LiveKit Authentication
 * Generates access tokens for LiveKit rooms (audio/video calls)
 */

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();

    // Authenticate user
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      logger.error("COPILOT API: Unauthorized - no user", {});
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Get request body
    const body = await req.json();
    const { room, projectId } = body;

    if (!room || !projectId) {
      logger.error("COPILOT API: Missing required fields", {});
      return NextResponse.json(
        { error: "Missing room or projectId" },
        { status: 400 }
      );
    }

    // Verify user has access to this project
    const { data: hasAccess, error: rpcError } = await supabase
      .rpc('has_project_access', { 
        p_project_id: projectId, 
        p_user_id: user.id 
      });

    if (!hasAccess) {
      logger.error("COPILOT API: User has no access to project", {});
      return NextResponse.json(
        { error: "No access to this project" },
        { status: 403 }
      );
    }

    // Get user profile for display name
    const { data: profile } = await supabase
      .from("profiles")
      .select("company_name, email")
      .eq("id", user.id)
      .single();

    const username = profile?.company_name || profile?.email || "Anonymous";

    // Get LiveKit credentials from environment
    const apiKey = process.env.LIVEKIT_API_KEY;
    const apiSecret = process.env.LIVEKIT_API_SECRET;
    const livekitUrl = process.env.NEXT_PUBLIC_LIVEKIT_URL;

    if (!apiKey || !apiSecret) {
      logger.error("COPILOT API: LiveKit credentials missing in env vars!", {});
      logger.error("Required env vars: LIVEKIT_API_KEY, LIVEKIT_API_SECRET, NEXT_PUBLIC_LIVEKIT_URL", {});
      return NextResponse.json(
        { error: "LiveKit not configured - check server logs" },
        { status: 500 }
      );
    }

    if (!livekitUrl) {
      logger.error("COPILOT API: NEXT_PUBLIC_LIVEKIT_URL missing!", {});
      return NextResponse.json(
        { error: "LiveKit URL not configured" },
        { status: 500 }
      );
    }

    // Create access token
    const at = new AccessToken(apiKey, apiSecret, {
      identity: user.id,
      name: username,
      metadata: JSON.stringify({
        email: profile?.email,
        userId: user.id,
      }),
    });

    // Grant permissions
    at.addGrant({
      room: room,
      roomJoin: true,
      canPublish: true,
      canSubscribe: true,
      canPublishData: true,
    });

    // Generate token
    const token = await at.toJwt();

    return NextResponse.json({
      token,
      url: livekitUrl,
    });
  } catch (error: unknown) {
    logger.error("COPILOT API ERROR:", {}, error);
    const errObj = error instanceof Error ? error : null;
    logger.error("Error details:", {}, {
      message: errObj?.message,
      stack: errObj?.stack,
      name: errObj?.name,
    });
    return NextResponse.json(
      { error: `Failed to generate token: ${errObj?.message || "Unknown error"}` },
      { status: 500 }
    );
  }
}
