import { Request, Response } from "express";
import { asyncHandler } from "../utils/asyncHandler.js";
import responseHelper from "../utils/responseHelper.js";
import { getChannel, sendToQueue } from "../config/rabbitmq.js";
import {
  CANDIDATE_PROFILE_EMBEDDINGS_QUEUE,
  RESUME_QUEUE,
  TIMEZONE,
} from "../utils/constant.js";
import cloudinary from "../config/cloudinary.js";

import fs from "fs";
import { TaskModel } from "../models/task.model.js";
import CandidateModel from "../models/candidate.model.js";
import { RecommendedJobModel } from "../models/recommended_jobs.model.js";
import { JobModel } from "../models/job.model.js";
import ResumeModel from "../models/resume.model.js";
import { InterviewModel } from "../models/interview.model.js";
import { DateTime } from "luxon";

const completeCandidateProfile = asyncHandler(
  async (req: Request, res: Response) => {
    const {
      fullName,
      dateOfBirth,
      gender,
      country,
      city,
      contactNumber,
      profilePictureUrl,
      githubUrl,
      linkedinUrl,
      portfolioUrl,
      skills,
      bio,
      tagline,
    } = req.body;

    const existingCandidate = await CandidateModel.findOne({
      userId: req.user._id,
    });

    if (!existingCandidate) {
      return responseHelper(
        res,
        400,
        "Failed",
        "First Signup then create profile.",
      );
    }

    if (existingCandidate.isProfileCompleted) {
      return responseHelper(res, 400, "Failed", "Profile already completed.");
    }

    const existingCandidateWithPhone = await CandidateModel.findOne({ contactNumber });
    if (existingCandidateWithPhone) {
      return responseHelper(res, 400, "Failed", "Candidate with this phone number already exists.");
    }

    const updatedCandidate = await CandidateModel.findByIdAndUpdate(
      existingCandidate._id,
      {
        fullName,
        dateOfBirth,
        gender,
        country,
        city,
        contactNumber,
        profilePictureUrl,
        githubUrl,
        linkedinUrl,
        portfolioUrl,
        skills,
        bio,
        tagline,
        resumeId: null,
        isProfileCompleted: true,
      },
      { new: true },
    ).populate("userId", "email role");

    if (!updatedCandidate) {
      return responseHelper(
        res,
        500,
        "Failed",
        "Failed to update candidate profile.",
      );
    }

    const candidate = await CandidateModel.findById(
      updatedCandidate._id,
    ).populate("userId", "email role");

    if (!candidate) {
      return responseHelper(
        res,
        500,
        "Failed",
        "Failed to fetch candidate profile.",
      );
    }

    // const task = await TaskModel.create({
    //   userId: req.user._id,
    //   type: "candidate_profile_embeddings",
    //   payload: { candidateId: candidate._id.toString() },
    //   status: "pending",
    // });

    // if (!task) {
    //   console.log("ERROR :: Task not created");
    //   return;
    // }

    // try {
    //   sendToQueue(
    //     CANDIDATE_PROFILE_EMBEDDINGS_QUEUE,
    //     task._id.toString(),
    //   );
    //   console.log("Message sent to RabbitMQ queue successfully");
    // } catch (error) {
    //   console.error("RabbitMQ error:", error);
    // }

    return responseHelper(
      res,
      200,
      "Success",
      "Candidate profile created successfully.",
      {
        data: {
          candidate,
        },
      },
    );
  },
);

const updateCandidateProfile = asyncHandler(
  async (req: Request, res: Response) => {
    const candidateId = req.userId;

    const existingCandidate = await CandidateModel.findById({
      _id: candidateId,
    });

    if (!existingCandidate) {
      return responseHelper(res, 404, "Failed", "Candidate not found.");
    }

    const {
      fullName,
      dateOfBirth,
      gender,
      country,
      city,
      contactNumber,
      profilePictureUrl,
      githubUrl,
      linkedinUrl,
      portfolioUrl,
      bio,
      tagline,
    } = req.body;

    console.log("REQ BODY", req.body)

    const updateData = {
      fullName: fullName ?? existingCandidate.fullName ?? "Placeholder Name",
      dateOfBirth: dateOfBirth ?? existingCandidate.dateOfBirth ?? null,
      gender: gender ?? existingCandidate.gender ?? null,
      country: country ?? existingCandidate.country ?? "Pakistan",
      city: city ?? existingCandidate.city ?? null,
      contactNumber: contactNumber ?? existingCandidate.contactNumber ?? null,
      profilePictureUrl: profilePictureUrl ?? existingCandidate.profilePictureUrl ?? null,
      githubUrl: githubUrl ?? existingCandidate.githubUrl ?? null,
      linkedinUrl: linkedinUrl ?? existingCandidate.linkedinUrl ?? null,
      portfolioUrl: portfolioUrl ?? existingCandidate.portfolioUrl ?? null,
      bio: bio ?? existingCandidate.bio ?? null,
      tagline: tagline ?? existingCandidate.tagline ?? null,
      resumeId: existingCandidate.resumeId,
      isProfileCompleted: true,
    };

    const updatedCandidate = await CandidateModel.findByIdAndUpdate(
      existingCandidate._id,
      { $set: updateData },
      { new: true }
    ).populate("userId", "email role");

    if (!updatedCandidate) {
      return responseHelper(
        res,
        500,
        "Failed",
        "Failed to update candidate profile.",
      );
    }

    // const task = await TaskModel.create({
    //   userId: req.user._id,
    //   type: "candidate_profile_embeddings",
    //   payload: { candidateId: updatedCandidate._id.toString() },
    //   status: "pending",
    // });

    // if (!task) {
    //   console.log("ERROR :: Task not created");
    //   return;
    // }

    // sendToQueue(
    //   CANDIDATE_PROFILE_EMBEDDINGS_QUEUE,
    //   task._id.toString(),
    // );

    return responseHelper(
      res,
      200,
      "Success",
      "Candidate profile updated successfully.",
      {
        data: {
          candidate: updatedCandidate,
        },
      },
    );
  },
);

const getCandidateProfile = asyncHandler(
  async (req: Request, res: Response) => {
    const userId = req.userId;
    console.log("userID---", userId);
    if (!userId) {
      return responseHelper(res, 400, "Failed", "User ID is required.");
    }

    const candidate = await CandidateModel.findById({ _id: userId }).populate(
      "userId",
      "email role",
    );
    if (!candidate) {
      return responseHelper(res, 404, "Failed", "Candidate not found.");
    }

    return responseHelper(
      res,
      200,
      "Success",
      "Candidate profile fetched successfully.",
      {
        data: {
          candidate,
        },
      },
    );
  },
);

const getCandidateProfileById = asyncHandler(
  async (req: Request, res: Response) => {
    const { userId } = req.params;

    if (!userId) {
      return responseHelper(res, 400, "Failed", "User ID is required.");
    }

    const candidate = await CandidateModel.findById(userId).populate(
      "userId",
      "email role",
    );
    if (!candidate) {
      return responseHelper(res, 404, "Failed", "Candidate not found.");
    }

    return responseHelper(
      res,
      200,
      "Success",
      "Candidate profile fetched successfully.",
      {
        data: {
          candidate,
        },
      },
    );
  },
);

const getCandidateById = asyncHandler(async (req: Request, res: Response) => {
  const { userId } = req.params;

  if (!userId) {
    return responseHelper(res, 400, "Failed", "User ID is required.");
  }

  const candidate = await CandidateModel.findOne({ userId }).populate(
    "userId",
    "email role",
  );
  if (!candidate) {
    return responseHelper(res, 404, "Failed", "Candidate not found.");
  }
  return responseHelper(
    res,
    200,
    "Success",
    "Candidate fetched successfully.",
    {
      data: {
        candidate,
      },
    },
  );
});

const resumeParser = asyncHandler(async (req: Request, res: Response) => {
  console.log("Received resume parse request:", req.body);
  const file = req.file;
  if (!file) {
    return responseHelper(res, 400, "Failed", "No file uploaded.");
  }
  // upload to cloudinary
  const result = await cloudinary.uploader.upload(file.path, {
    resource_type: "auto", // handles images, pdfs, docx, audio, video
  });

  // delete local file
  fs.unlinkSync(file.path);

  console.log("File uploaded to Cloudinary:", result);

  const resumeUrl = result.secure_url;

  const candidate = await CandidateModel.findOne({ userId: req.user._id });
  if (!candidate) {
    return responseHelper(res, 404, "Failed", "Candidate not found.");
  }

  const task = await TaskModel.create({
    userId: candidate._id,
    type: "resume_parsing",
    payload: { resume: resumeUrl },
    status: "pending",
  });

  try {
    sendToQueue(RESUME_QUEUE, task._id.toString());
    console.log("Message sent to RabbitMQ queue successfully");
  } catch (error) {
    console.error("RabbitMQ error:", error);
    return responseHelper(
      res,
      500,
      "Failed",
      "Failed to queue resume for processing.",
    );
  }

  return responseHelper(
    res,
    200,
    "Success",
    "Resume uploaded and queued for processing.",
    {
      data: {
        taskId: task._id,
      },
    },
  );
});

const getResumeParsedData = asyncHandler(
  async (req: Request, res: Response) => {
    let candidate: any = ""
    if (req.params.id) {
      candidate = await CandidateModel.findById(req.params.id)
    }
    else {
      candidate = await CandidateModel.findById(req.userId);

    }
    if (!candidate) {
      return responseHelper(res, 404, "Failed", "Candidate not found.");
    }
    const resume = await ResumeModel.findById(candidate.resumeId?.toString());
    if (!resume) {
      return responseHelper(res, 404, "Failed", "Resume not found. Please upload resume to access full features.");
    }

    return responseHelper(
      res,
      200,
      "Success",
      "Parsed resume data fetched successfully.",
      {
        data: {
          resume,
        },
      },
    );
  },
);

const addResumeData = asyncHandler(async (req: Request, res: Response) => {
  const candidate = await CandidateModel.findById(req.userId);
  if (!candidate) {
    return responseHelper(res, 404, "Failed", "Candidate not found.");
  }
  const resume = await ResumeModel.findById(candidate.resumeId?.toString());
  if (!resume) {
    return responseHelper(res, 404, "Failed", "Resume not found.");
  }
  const { type } = req.body;
  if (type === "experience") {
    const newExp = req.body.data;

    if (Array.isArray(newExp)) {
      resume.parsedData?.experience?.unshift(...newExp);
    } else {
      resume.parsedData?.experience?.unshift(newExp);
    }
    await resume.save();
    return responseHelper(
      res,
      200,
      "Success",
      "Experience data added to resume successfully.",
      {
        data: {
          resume,
        },
      },
    );
  }

  if (type === "education") {
    const newEdu = req.body.data;

    if (Array.isArray(newEdu)) {
      resume.parsedData?.education?.unshift(...newEdu);
    } else {
      resume.parsedData?.education?.unshift(newEdu);
    }
    await resume.save();
    return responseHelper(
      res,
      200,
      "Success",
      "Education data added to resume successfully.",
      {
        data: {
          resume,
        },
      },
    );
  }

  if (type === "project") {
    const newProj = req.body.data;

    if (Array.isArray(newProj)) {
      resume.parsedData?.projects?.unshift(...newProj);
    } else {
      resume.parsedData?.projects?.unshift(newProj);
    }
    await resume.save();
    return responseHelper(
      res,
      200,
      "Success",
      "Projects data added to resume successfully.",
      {
        data: {
          resume,
        },
      },
    );
  }

  if (type === "certification") {
    const newCert = req.body.data;
    if (Array.isArray(newCert)) {
      resume.parsedData?.certifications?.unshift(...newCert);
    } else {
      resume.parsedData?.certifications?.unshift(newCert);
    }
    await resume.save();
    return responseHelper(
      res,
      200,
      "Success",
      "Certifications data added to resume successfully.",
      {
        data: {
          resume,
        },
      },
    );
  }

  if (type === "skill") {
    const newSkill = req.body.data;
    if (Array.isArray(newSkill)) {
      resume.parsedData?.skills?.unshift(...newSkill);
    } else {
      resume.parsedData?.skills?.unshift(newSkill);
    }
    await resume.save();
    return responseHelper(
      res,
      200,
      "Success",
      "Skills data added to resume successfully.",
      {
        data: {
          resume,
        },
      },
    );
  }
  return responseHelper(res, 400, "Failed", "Invalid type specified.");
});

const editResumeData = asyncHandler(async (req: Request, res: Response) => {
  const candidate = await CandidateModel.findById(req.userId);
  if (!candidate) {
    return responseHelper(res, 404, "Failed", "Candidate not found.");
  }
  const resume = await ResumeModel.findById(candidate.resumeId?.toString());
  if (!resume) {
    return responseHelper(res, 404, "Failed", "Resume not found.");
  }
  const { type, _id } = req.body;

  if (type === "experience") {
    const { company, position, startDate, endDate, description } = req.body.data;

    const updatedExperience = {
      ...(company !== undefined ? { company } : {}),
      ...(position !== undefined ? { position } : {}),
      ...(startDate !== undefined ? { startDate } : {}),
      ...(endDate !== undefined ? { endDate } : {}),
      ...(description !== undefined ? { description } : {}),
    };

    if (resume.parsedData) {
      resume.parsedData.experience = (resume.parsedData.experience ?? []).map((exp: any) => {
        if ((exp as any)._id?.toString() === _id) {
          return { ...exp, ...updatedExperience };
        }
        return exp;
      });
    }
    await resume.save();
    return responseHelper(
      res,
      200,
      "Success",
      "Experience data edited to resume successfully.",
      {
        data: {
          resume,
        },
      },
    );
  }

  if (type === "education") {
    const { institution, degree, startYear, endYear } = req.body.data;
    const updatedEducation = {
      ...(institution !== undefined ? { institution } : {}),
      ...(degree !== undefined ? { degree } : {}),
      ...(startYear !== undefined ? { startYear } : {}),
      ...(endYear !== undefined ? { endYear } : {}),
    };
    if (resume.parsedData) {
      resume.parsedData.education = (resume.parsedData.education ?? []).map((edu: any) => {
        if ((edu as any)._id?.toString() === _id) {
          return { ...edu, ...updatedEducation };
        }
        return edu;
      });
    }
    await resume.save();
    return responseHelper(
      res,
      200,
      "Success",
      "Education data edited to resume successfully.",
      {
        data: {
          resume,
        },
      },
    );
  }

  if (type === "project") {
    const { name, description, link, technologies } = req.body.data;
    const updatedProject = {
      ...(name !== undefined ? { name } : {}),
      ...(description !== undefined ? {
        description,
      } : {}),
      ...(link !== undefined ? { link } : {}),
      ...(technologies !== undefined ? { technologies } : {}),
    };
    if (resume.parsedData) {
      resume.parsedData.projects = (resume.parsedData.projects ?? []).map((proj: any) => {
        if ((proj as any)._id?.toString() === _id) {
          return { ...proj, ...updatedProject };
        }
        return proj;
      });
    }
    await resume.save();
    return responseHelper(
      res,
      200,
      "Success",
      "Project data edited to resume successfully.",
      {
        data: {
          resume,
        },
      },
    );
  }
  if (type === "certification") {
    const { name, issuer, year } = req.body.data;
    const updatedCertification = {
      ...(name !== undefined ? { name } : {}),
      ...(issuer !== undefined ? { issuer } : {}),
      ...(year !== undefined ? { year } : {}),
    };
    if (resume.parsedData) {
      resume.parsedData.certifications = (resume.parsedData.certifications ?? []).map((cert: any) => {
        if ((cert as any)._id?.toString() === _id) {
          return { ...cert, ...updatedCertification };
        }
        return cert;
      });
    }
    await resume.save();
    return responseHelper(
      res,
      200,
      "Success",
      "Certification data edited to resume successfully.",
      {
        data: {
          resume,
        },
      },
    );
  }
  if (type === "skill") {
    const newSkill = req.body.data;
    if (newSkill === undefined || newSkill === null) {
      return responseHelper(res, 400, "Failed", "New skill value is required.");
    }
    if (resume.parsedData) {
      const skills = resume.parsedData.skills ?? [];
      // support _id as index or as existing skill value
      let updatedSkills = [...skills];
      const idx = Number(_id);
      if (!Number.isNaN(idx)) {
        if (idx >= 0 && idx < updatedSkills.length) {
          updatedSkills[idx] = newSkill;
        }
      } else {
        const found = updatedSkills.findIndex((s: any) => s === _id);
        if (found !== -1) {
          updatedSkills[found] = newSkill;
        }
      }
      resume.parsedData.skills = updatedSkills;
    }
    await resume.save();
    return responseHelper(
      res,
      200,
      "Success",
      "Skill edited to resume successfully.",
      {
        data: {
          resume,
        },
      },
    );
  }
  return responseHelper(res, 400, "Failed", "Invalid type specified.");
});

const deleteResumeData = asyncHandler(async (req: Request, res: Response) => {
  // Similar to editResumeData but filter out the item with the given _id instead of updating it
  const candidate = await CandidateModel.findById(req.userId);
  if (!candidate) {
    return responseHelper(res, 404, "Failed", "Candidate not found.");
  }

  const resume = await ResumeModel.findById(candidate.resumeId?.toString());
  if (!resume) {
    return responseHelper(res, 404, "Failed", "Resume not found.");
  }
  const { type, _id } = req.body;
  if (type === "experience") {
    if (resume.parsedData) {
      resume.parsedData.experience = (resume.parsedData.experience ?? []).filter((exp: any) => (exp as any)._id?.toString() !== _id);
    }
    await resume.save();
    return responseHelper(
      res,
      200,
      "Success",
      "Experience data deleted from resume successfully.",
      {
        data: {
          resume,
        },
      },
    );
  }

  if (type === "education") {
    if (resume.parsedData) {
      resume.parsedData.education = (resume.parsedData.education ?? []).filter((edu: any) => (edu as any)._id?.toString() !== _id);
    }
    await resume.save();
    return responseHelper(
      res,
      200,
      "Success",
      "Education data deleted from resume successfully.",
      {
        data: {
          resume,
        },
      },
    );
  }

  if (type === "project") {
    if (resume.parsedData) {
      resume.parsedData.projects = (resume.parsedData.projects ?? []).filter((proj: any) => (proj as any)._id?.toString() !== _id);
    }
    await resume.save();
    return responseHelper(
      res,
      200,
      "Success",
      "Project data deleted from resume successfully.",
      {
        data: {
          resume,
        },
      },
    );
  }

  if (type === "certification") {
    if (resume.parsedData) {
      resume.parsedData.certifications = (resume.parsedData.certifications ?? []).filter((cert: any) => (cert as any)._id?.toString() !== _id);
    }
    await resume.save();
    return responseHelper(
      res,
      200,

      "Success",
      "Certification data deleted from resume successfully.",
      {

        data: {
          resume,
        },
      },
    );
  }
  if (type === "skill") {
    if (resume.parsedData) {
      const skills = resume.parsedData.skills ?? [];
      const idx = Number(_id);
      if (!Number.isNaN(idx)) {
        // remove by index
        if (idx >= 0 && idx < skills.length) {
          resume.parsedData.skills = skills.filter((_: any, i: number) => i !== idx);
        }
      } else {
        // remove by exact value match
        resume.parsedData.skills = skills.filter((s: any) => s !== _id);
      }
    }
    await resume.save();
    return responseHelper(
      res,
      200,
      "Success",
      "Skill deleted from resume successfully.",
      {
        data: {
          resume,
        },
      },
    );
  }
  return responseHelper(res, 400, "Failed", "Invalid type specified.");
});

const getCandidateDashboardStats = asyncHandler(
  async (req: Request, res: Response) => {
    const userId = req.userId;

    const userAppliedJobsCount = await InterviewModel.countDocuments({
      candidateId: userId,
    });
    const userActiveJobsCount = await InterviewModel.countDocuments({
      candidateId: userId,
      status: "scheduled",
    });
    const resumeData = await ResumeModel.findOne({ candidateId: userId });

    const recentAppliedJobs = await InterviewModel.find({ candidateId: userId })
      .sort({ createdAt: -1 })
      .limit(5)
      .populate("jobId");

    const startZone = DateTime.now()
      .setZone(TIMEZONE) // right now its set for pakistan only, we can make it dynamic based on user preference in future
      .startOf("day")
      .toUTC()
      .toJSDate();

    const endZone = DateTime.now()
      .setZone(TIMEZONE)
      .endOf("day")
      .toUTC()
      .toJSDate();

    const interviews = await InterviewModel.find({
      candidateId: userId,
      scheduledDate: { $gte: startZone, $lte: endZone },
    })
      .populate("jobId")
      .populate("companyId")
      .sort({ scheduledDate: -1 });

    const recommendedJobs = await RecommendedJobModel.findOne({ candidateId: userId })
    const matchedJobs = recommendedJobs?.recommendedJobs.length || 0;

    return responseHelper(
      res,
      200,
      "Success",
      "Dashboard stats fetched successfully.",
      {
        data: {
          userAppliedJobsCount: userAppliedJobsCount || 0,
          resumeScore: resumeData?.aiScore || 0,
          userActiveJobsCount: userActiveJobsCount || 0,
          matchedJobsCounts: matchedJobs,
          recentAppliedJobs: recentAppliedJobs || [],
          getTodaysInterview: interviews || [],
        },
      },
    );
  },
);

const getAllCandidates = asyncHandler(async (req: Request, res: Response) => {
  const candidates = await CandidateModel.find({
    isProfileCompleted: true,
  })
    .select("fullName profilePictureUrl userId")
    .lean();

  return responseHelper(
    res,
    200,
    "Success",
    "Candidates fetched successfully.",
    {
      data: {
        candidates,
      },
    },
  );
});

export {
  resumeParser,
  completeCandidateProfile,
  updateCandidateProfile,
  getCandidateProfile,
  getCandidateById,
  getResumeParsedData,
  getCandidateProfileById,
  getCandidateDashboardStats,
  addResumeData,
  editResumeData,
  deleteResumeData,
  getAllCandidates,
};
