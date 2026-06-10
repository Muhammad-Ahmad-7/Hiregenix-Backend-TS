import { Request, response, Response } from "express";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ICompanyProfile } from "../types/company.types.js";
import CompanyModel from "../models/company.model.js";
import responseHelper from "../utils/responseHelper.js";
import { JobModel } from "../models/job.model.js";
import { TaskModel } from "../models/task.model.js";
import { sendToQueue } from "../config/rabbitmq.js";
import {
  COMPANY_KB_EMBEDDINGS_QUEUE,
  JOB_DESCRIPTION_EMBEDDINGS_QUEUE,
} from "../utils/constant.js";
import { qdrantClient } from "../server.js";
import { InterviewModel } from "../models/interview.model.js";
import cloudinary from "../config/cloudinary.js";
import fs from "fs";

const completeCompanyProfile = asyncHandler(
  async (req: Request, res: Response) => {
    // take out all the input data from the req.body
    // find the matching document in the CompanyModel using the user._id
    // then update this document with the user provided information

    const companyId = req.user._id;

    const existingCompany = await CompanyModel.findOne({ userId: companyId });

    if (!existingCompany) {
      return responseHelper(
        res,
        400,
        "Failed",
        "First Signup then create profile.",
      );
    }

    const {
      companyName,
      city,
      country,
      description,
      foundedYear,
      linkedInUrl,
      logoUrl,
      ntnNumber,
      techStack,
      website,
    }: ICompanyProfile = req.body;

    const updatedCompany = await CompanyModel.findByIdAndUpdate(
      existingCompany._id,
      {
        companyName,
        city,
        contactEmail: req.user.email, // TODO: we need to see this.
        country,
        description,
        foundedYear,
        linkedInUrl,
        logoUrl,
        ntnNumber,
        techStack,
        website,
        isProfileCompleted: true,
      },
      { new: true },
    );

    if (!updatedCompany) {
      return responseHelper(
        res,
        500,
        "Failed",
        "Failed to update company profile. Please try again later.",
      );
    }

    const company = await CompanyModel.findById(updatedCompany._id).populate(
      "userId",
      "email role",
    );

    return responseHelper(
      res,
      200,
      "Success",
      "Company profile created successfully.",
      {
        data: {
          company,
        },
      },
    );
  },
);

const getDashboardStats = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user._id;
  if (!userId) {
    return responseHelper(res, 400, "Failed", "User not found.");
  }

  const findCompany = await CompanyModel.findOne({ userId });

  if (!findCompany) {
    return responseHelper(res, 404, "Failed", "Company not found.");
  }

  const companyId = findCompany._id;

  const postedJobsCount = await JobModel.countDocuments({
    companyId,
    isDeleted: false,
  });
  const activeJobsCount = await JobModel.countDocuments({
    companyId,
    status: "open",
    isDeleted: false,
  });
  const closedJobsCount = await JobModel.countDocuments({
    companyId,
    status: "closed",
    isDeleted: false,
  });
  const appliedJobsCount = await InterviewModel.countDocuments({ companyId });

  const activeJobs = await JobModel.find({
    companyId,
    status: "open",
    isDeleted: false,
  })
    .limit(5)
    .sort({ createdAt: -1 });
  const recentApplications = await InterviewModel.find({ companyId })
    .sort({ createdAt: -1 })
    .limit(5)
    .populate("candidateId")
    .populate("jobId");

  return responseHelper(
    res,
    200,
    "Success",
    "Company stats fetched successfully.",
    {
      data: {
        postedJobsCount,
        activeJobsCount,
        appliedJobsCount,
        closedJobsCount,
        activeJobs,
        recentApplications: recentApplications || [],
      },
    },
  );
});

const getCompanyProfile = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.userId;

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
});

const getAllCompanies = asyncHandler(async (req: Request, res: Response) => {
  const companies = await CompanyModel.find({
    isDeleted: false,
    isProfileCompleted: true,
  })
    .select("companyName logoUrl contactEmail userId")
    .lean();

  return responseHelper(
    res,
    200,
    "Success",
    "Companies fetched successfully.",
    {
      data: {
        companies,
      },
    },
  );
});

const updatedCompanyProfile = asyncHandler(
  async (req: Request, res: Response) => {
    const userId = req.userId;

    const existingCompany = await CompanyModel.findById({ _id: userId });

    if (!existingCompany) {
      return responseHelper(
        res,
        400,
        "Failed",
        "Company profile does not exist.",
      );
    }

    const {
      companyName,
      city,
      contactEmail,
      country,
      description,
      foundedYear,
      linkedInUrl,
      logoUrl,
      ntnNumber,
      techStack,
      website,
    } = req.body;

    // if (companyName) {
    //   const findCompanyByName = await CompanyModel.findOne({ companyName });
    //   if (findCompanyByName) {
    //     return responseHelper(
    //       res,
    //       400,
    //       "Failed",
    //       "Company with the same already exist.",
    //     );
    //   }
    // }

    const updatedCompany = await CompanyModel.findByIdAndUpdate(
      existingCompany._id,
      {
        companyName: companyName || existingCompany.companyName,
        city: city || existingCompany.city,
        contactEmail: req.user.email,
        country: country || existingCompany.country,
        description: description || existingCompany.description,
        foundedYear: foundedYear || existingCompany.foundedYear,
        linkedInUrl: linkedInUrl || existingCompany.linkedInUrl,
        logoUrl: logoUrl || existingCompany.logoUrl,
        ntnNumber: ntnNumber || existingCompany.ntnNumber,
        techStack: techStack || existingCompany.techStack,
        website: website || existingCompany.website,
        isProfileCompleted: true,
      },
      { new: true },
    );

    if (!updatedCompany) {
      return responseHelper(
        res,
        500,
        "Failed",
        "Failed to update company profile. Please try again later.",
      );
    }

    const company = await CompanyModel.findById(updatedCompany._id).populate(
      "userId",
      "email role",
    );

    return responseHelper(
      res,
      200,
      "Success",
      "Company profile updated successfully.",
      {
        data: {
          company,
        },
      },
    );
  },
);

const uploadCompanyKnowledgeBasePdf = asyncHandler(
  async (req: Request, res: Response) => {
    const companyProfileId = req.userId; // company profile _id (from token)
    if (!companyProfileId) {
      return responseHelper(res, 401, "Failed", "Unauthorized.");
    }

    const file = (req as any).file as Express.Multer.File | undefined;
    if (!file) {
      return responseHelper(res, 400, "Failed", "No file uploaded.");
    }

    const result = await cloudinary.uploader.upload(file.path, {
      resource_type: "auto",
    });
    fs.unlinkSync(file.path);

    const pdfUrl = result.secure_url;
    const collectionName = `company_kb_${companyProfileId}`;

    const updatedCompany = await CompanyModel.findByIdAndUpdate(
      companyProfileId,
      {
        knowledgeBasePdfUrl: pdfUrl,
        knowledgeBaseQdrantCollection: collectionName,
        knowledgeBaseUpdatedAt: new Date(),
      },
      { new: true },
    );

    if (!updatedCompany) {
      return responseHelper(res, 404, "Failed", "Company not found.");
    }

    const task = await TaskModel.create({
      userId: req.user._id,
      type: "company_kb_embeddings",
      payload: {
        companyId: companyProfileId,
        pdfUrl,
        collectionName,
      },
      status: "pending",
    });

    sendToQueue(COMPANY_KB_EMBEDDINGS_QUEUE, task._id.toString());

    return responseHelper(res, 200, "Success", "Knowledge base uploaded.", {
      data: {
        pdfUrl,
        collectionName,
        taskId: task._id,
      },
    });
  },
);

export {
  completeCompanyProfile,
  getDashboardStats,
  getCompanyProfile,
  getAllCompanies,
  updatedCompanyProfile,
  uploadCompanyKnowledgeBasePdf,
};
