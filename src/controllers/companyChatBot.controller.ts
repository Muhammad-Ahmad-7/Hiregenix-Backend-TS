import { Request, Response } from "express";
import responseHelper from "../utils/responseHelper.js";
import CompanyModel from "../models/company.model.js";
import { getCompanyRagAnswer } from "../services/companyRag.service.js";

// ─────────────────────────────────────────────
// POST /api/company-chat
// Body: { query: string, company: CompanyContext }
// ─────────────────────────────────────────────
export interface ChatRequestBody {
  query: string;
  companyId: string | number;
}
//this is the controller 
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
    const kbUrl = (company as any).knowledgeBasePdfUrl as
      | string
      | null
      | undefined;
    const kbCollection = (company as any).knowledgeBaseQdrantCollection as
      | string
      | null
      | undefined;

    // If KB is not uploaded yet, fallback to basic company-info assistant.
    // (This keeps the UX working while companies haven't uploaded PDFs.)
    const answer =
      kbUrl && kbCollection
        ? (
            await getCompanyRagAnswer({
              companyId: company._id.toString(),
              query: query.trim(),
            })
          )?.answer
        : `This company hasn't uploaded a knowledge-base PDF yet. I can still answer basic questions about ${company.companyName} (tech stack, location, contact info, hiring status).`;

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
