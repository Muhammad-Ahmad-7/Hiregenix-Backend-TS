import { Request, Response } from "express";
import { asyncHandler } from "../utils/asyncHandler.js";
import responseHelper from "../utils/responseHelper.js";
import { getChannel, sendToQueue } from "../config/rabbitmq.js";
import { CANDIDATE_PROFILE_EMBEDDINGS_QUEUE, RESUME_QUEUE } from "../utils/constant.js";
import cloudinary from "../config/cloudinary.js";

import fs from "fs";
import { TaskModel } from "../models/task.model.js";
import CandidateModel from "../models/candidate.model.js";
import { RecommendedJobModel } from "../models/recommended_jobs.model.js";
import { JobModel } from "../models/job.model.js";


const completeCandidateProfile = asyncHandler(async (req: Request, res: Response) => {
    const { fullName, dateOfBirth, gender, country, city, contactNumber, profilePictureUrl, githubUrl, linkedinUrl, portfolioUrl, skills, bio, tagline } = req.body;


    const existingCandidate = await CandidateModel.findOne({ userId: req.user._id });

    if (!existingCandidate) {
        return responseHelper(res, 400, "Failed", "First Signup then create profile.");
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
        },
        { new: true }
    ).populate("userId", "email role");


    if (!updatedCandidate) {
        return responseHelper(res, 500, "Failed", "Failed to update candidate profile.");
    }

    const candidate = await CandidateModel.findById(updatedCandidate._id).populate("userId", "email role");

    if (!candidate) {
        return responseHelper(res, 500, "Failed", "Failed to fetch candidate profile.");
    }


    const task = await TaskModel.create({

        userId: req.user._id,
        type: "candidate_profile_embeddings",
        payload: { candidateId: candidate._id.toString() },
        status: "pending",
    });

    if (!task) {
        console.log("ERROR :: Task not created")
        return;
    }

    try {
        // Use the safe getChannel function
        sendToQueue(CANDIDATE_PROFILE_EMBEDDINGS_QUEUE, (task._id as string).toString());
        console.log("Message sent to RabbitMQ queue successfully");
    } catch (error) {
        console.error("RabbitMQ error:", error);
    }

    return responseHelper(res, 200, "Success", "Candidate profile created successfully.", {
        data: {
            candidate
        }
    });
});

const updateCandidateProfile = asyncHandler(async (req: Request, res: Response) => {
    const { candidateId } = req.params;

    const existingCandidate = await CandidateModel.findById(candidateId);

    if (!existingCandidate) {
        return responseHelper(res, 404, "Failed", "Candidate not found.");
    }

    const { fullName, dateOfBirth, gender, country, city, contactNumber, profilePictureUrl, githubUrl, linkedinUrl, portfolioUrl, skills, bio, tagline } = req.body;

    const updatedCandidate = await CandidateModel.findByIdAndUpdate(
        candidateId,
        {
            fullName: fullName || existingCandidate.fullName,
            dateOfBirth: dateOfBirth || existingCandidate.dateOfBirth,
            gender: gender || existingCandidate.gender,
            country: country || existingCandidate.country,
            city: city || existingCandidate.city,
            contactNumber: contactNumber || existingCandidate.contactNumber,
            profilePictureUrl: profilePictureUrl || existingCandidate.profilePictureUrl,
            githubUrl: githubUrl || existingCandidate.githubUrl,
            linkedinUrl: linkedinUrl || existingCandidate.linkedinUrl,
            portfolioUrl: portfolioUrl || existingCandidate.portfolioUrl,
            skills: skills || existingCandidate.skills,
            bio: bio || existingCandidate.bio,
            tagline: tagline || existingCandidate.tagline,
            resumeId: null,
        },
        { new: true }
    ).populate("userId", "email role");


    if (!updatedCandidate) {
        return responseHelper(res, 500, "Failed", "Failed to update candidate profile.");
    }

    const task = await TaskModel.create({

        userId: req.user._id,
        type: "candidate_profile_embeddings",
        payload: { candidateId: updatedCandidate._id.toString() },
        status: "pending",
    });

    if (!task) {
        console.log("ERROR :: Task not created")
        return;
    }

    sendToQueue(CANDIDATE_PROFILE_EMBEDDINGS_QUEUE, (task._id as string).toString());

    return responseHelper(res, 200, "Success", "Candidate profile updated successfully.", {
        data: {
            candidate: updatedCandidate
        }
    });
});


const getCandidateProfile = asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user._id;

    const candidate = await CandidateModel.findOne({ userId }).populate("userId", "email role");
    if (!candidate) {
        return responseHelper(res, 404, "Failed", "Candidate not found.");
    }

    return responseHelper(res, 200, "Success", "Candidate profile fetched successfully.", {
        data: {
            candidate
        }
    });
});


const getCandidateById = asyncHandler(async (req: Request, res: Response) => {
    const { candidateId } = req.params;

    const candidate = await CandidateModel.findById(candidateId);

    if (!candidate) {
        return responseHelper(res, 404, "Failed", "Candidate not found.");
    }

    return responseHelper(res, 200, "Success", "Candidate fetched successfully.", {
        data: {
            candidate
        }
    });
});


const getRecommendedJobs = asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user._id;

    if (!userId) {
        return responseHelper(res, 400, "Failed", "User not found.");
    }

    const candidate = await CandidateModel.findOne({ userId });

    if (!candidate) {
        return responseHelper(res, 400, "Failed", "Candidate not found.");
    }

    console.log("found candidate", candidate)

    const candidateId = candidate._id.toString();

    console.log("candidateId", candidateId)


    const recommendedJobs = await RecommendedJobModel.findOne({ candidateId: candidateId });

    console.log("recommendedJobs", recommendedJobs)

    if (!recommendedJobs) {
        return responseHelper(res, 400, "Failed", "No recommended jobs found.");
    }


    return responseHelper(res, 200, "Success", "Recommended jobs fetched successfully.", {
        data: {
            recommendedJobs
        }
    });
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

    const task = await TaskModel.create({

        userId: req.user._id,
        type: "resume_parsing",
        payload: { resume: resumeUrl },
        status: "pending",
    });



    try {
        // Use the safe getChannel function
        sendToQueue(RESUME_QUEUE, (task._id as string).toString());
        console.log("Message sent to RabbitMQ queue successfully");
    } catch (error) {
        console.error("RabbitMQ error:", error);
        return responseHelper(res, 500, "Failed", "Failed to queue resume for processing.");
    }

    return responseHelper(res, 200, "Success", "Resume uploaded and queued for processing.", {
        data: {
            taskId: task._id
        }
    });
});

const scheduleInterview = asyncHandler(async (req: Request, res: Response) => {
    // Implementation for scheduling interview
});

export { resumeParser, completeCandidateProfile, getRecommendedJobs, updateCandidateProfile, getCandidateProfile, getCandidateById, scheduleInterview };