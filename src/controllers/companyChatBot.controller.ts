import { Request, Response } from "express";
import responseHelper from "../utils/responseHelper.js";
import CompanyModel from "../models/company.model.js";
import { getCompanyChatAnswer } from "../services/chatBot.service.js";

// ─────────────────────────────────────────────
// POST /api/company-chat
// Body: { query: string, company: CompanyContext }
// ─────────────────────────────────────────────
export interface ChatRequestBody {
  query: string;
  companyId: string | number;
}
export async function companyChatBot(
  req: Request<{}, {}, ChatRequestBody>,
  res: Response,
): Promise<void> {
  const { query, companyId } = req.body;

  // ── Validate query ───────────────────────────
  if (!query || typeof query !== "string" || query.trim() === "") {
    responseHelper(
      res,
      400,
      "Failed",
      "'query' is required and must be a non-empty string.",
    );
    return;
  }
  if (!companyId) {
    responseHelper(res, 400, "Failed", "'company' context object is required.");
    return;
  }

  const company = await CompanyModel.findById(companyId);
  if (!company) {
    responseHelper(res, 400, "Failed", "this is no such company exist.");
    return;
  }
  //   if (company) {
  //     responseHelper(res, 200, "Success", "Received", {
  //       data: company,
  //     });
  //     return;
  //   }
  // ── Call Gemini service ──────────────────────
  try {
    const answer = await getCompanyChatAnswer(query.trim(), company);

    responseHelper(res, 200, "Success", "Response generated successfully.", {
      data: { answer },
    });
  } catch (err: unknown) {
    console.error("[ChatController] Gemini error:", err);

    const message =
      err instanceof Error ? err.message : "An unexpected error occurred.";

    responseHelper(res, 500, "Failed", message);
  }
}
