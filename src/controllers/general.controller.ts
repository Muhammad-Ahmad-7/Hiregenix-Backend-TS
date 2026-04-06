import { Request, Response } from "express";
import CompanyModel from "../models/company.model.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import responseHelper from "../utils/responseHelper.js";

export const getCompanyProfileWithId = asyncHandler(
  async (req: Request, res: Response) => {
    const userId = req.body.companyId;

    const company = await CompanyModel.findById({ _id: userId }).populate(
      "userId",
      "email role",
    );
    if (!company) {
      return responseHelper(res, 404, "Failed", "Company not found.");
    }

    return responseHelper(
      res,
      200,
      "Success",
      "Company profile fetched successfully.",
      {
        data: {
          company,
        },
      },
    );
  },
);
