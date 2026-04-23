import axios from "axios";
import { config } from "../config/config.js";

export async function getCompanyRagAnswer(params: {
  companyId: string;
  query: string;
}) {
  const res = await axios.post(
    `http://localhost:8000/rag/company-chat`,
    {
      companyId: params.companyId,
      query: params.query,
    },
    { timeout: 60_000 },
  );

  return res.data as { answer: string; sources?: any[] };
}

