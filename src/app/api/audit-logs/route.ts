import { NextRequest, NextResponse } from "next/server";
import { requireUser } from "@/lib/session";
import { handleApiError } from "@/lib/api";
import { listAuditLogs } from "@/lib/repositories/auditLogs";

export async function GET(req: NextRequest) {
  try {
    const user = await requireUser();
    const sp = req.nextUrl.searchParams;
    const result = listAuditLogs(user.businessId, {
      userId: sp.get("userId") || undefined,
      action: sp.get("action") || undefined,
      dateFrom: sp.get("dateFrom") || undefined,
      dateTo: sp.get("dateTo") || undefined,
      page: sp.get("page") ? Number(sp.get("page")) : undefined,
    });
    return NextResponse.json(result);
  } catch (err) {
    return handleApiError(err);
  }
}
