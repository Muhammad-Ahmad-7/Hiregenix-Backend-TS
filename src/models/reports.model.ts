import mongoose, { Schema, Document, Types } from "mongoose";


// {
//     "overallScores": {
//         "contentScore": 15,
//         "communicationScore": 30,
//         "fluencyScore": 60,
//         "confidenceScore": 50,
//         "overallScore": 33,
//     },
//     "overallAnswerQuality": "Poor",
//     "overallInterviewScore": 33,
//     "topStrengths": [
//         "Attempted to provide a direct comparison between REST API and GraphQL.",
//         "No filler words detected, indicating a relatively clean delivery.",
//         "Maintained a moderate and effective speaking pace.",
//     ],
//     "topWeaknesses": [
//         "Demonstrated a fundamental misunderstanding of GraphQL's core principle regarding data fetching (incorrectly stated the server decides, when the client specifies).",
//         "Lacked depth and detail in explaining the differences between the two technologies.",
//         "Included grammatically incorrect sentences (subject-verb agreement).",
//         "Used awkward and confusing phrasing which hindered clarity and professional articulation.",
//         "Exhibited significant gaze distraction (6.7 seconds) during the response, suggesting a lack of continuous focus.",
//     ],
//     "commonMissingConcepts": [
//         "Client-driven data fetching in GraphQL vs. fixed endpoints in REST",
//         "Over-fetching and under-fetching issues in REST and how GraphQL addresses them",
//         "Single endpoint vs. multiple endpoints",
//         "Use of a schema definition language (SDL) in GraphQL",
//         "Strong typing in GraphQL",
//         "Versioning strategies",
//         "Caching mechanisms",
//         "Real-time capabilities (subscriptions) in GraphQL",
//     ],
//     "overallImprovementSuggestions": [
//         "Thoroughly review the core principles and advantages of GraphQL, especially the client's role in specifying data requirements.",
//         "Practice articulating technical concepts clearly and precisely, avoiding confusing or repetitive phrases.",
//         "Focus on improving grammatical accuracy, particularly subject-verb agreement.",
//         "Work on maintaining consistent focus and eye contact during discussions to convey attentiveness and confidence.",
//         "Prepare to discuss multiple key differentiating factors when comparing technologies to provide a comprehensive answer.",
//     ],
//     "integrity": {"integrityConcern": False, "integrityNotes": None},
//     "interviewSummary": "The candidate attempted to differentiate REST API and GraphQL but displayed a fundamental misunderstanding of GraphQL's client-driven data fetching. While maintaining a good speaking pace and avoiding filler words, the explanation suffered from grammatical errors, awkward phrasing, and a lack of depth. Behavioral signals indicated average confidence and some gaze distraction. The candidate needs significant improvement in technical understanding and communication clarity for this topic.",
// }



export interface IReport extends Document {
    _id: Types.ObjectId;
    interviewId: Types.ObjectId;
    overallScore?: {
        contentScore?: number;
        communicationScore?: number;
        fluencyScore?: number;
        confidenceScore?: number;
        overallScore?: number;
    };
    overallAnswerQuality?: string;
    overallInterviewScore?: number;
    topStrengths?: string[];
    topWeaknesses?: string[];
    commonMissingConcepts?: string[];
    overallImprovementSuggestions?: string[];
    integrity?: {
        integrityConcern?: boolean;
        integrityNotes?: string;
    };
    interviewSummary?: string;
    createdAt?: Date;
    updatedAt?: Date;
    pdfUrl?: string;
}

const ReportSchema = new Schema<IReport>({
    interviewId: {
        type: Schema.Types.ObjectId,
        ref: "Interview"
    },
    overallScore: {
        contentScore: {
            type: Number,
            default: null
        },
        communicationScore: {
            type: Number,
            default: null
        },
        fluencyScore: {
            type: Number,
            default: null
        },
        confidenceScore: {
            type: Number,
            default: null
        },
        overallScore: {
            type: Number,
            default: null
        }
    },
    overallAnswerQuality: {
        type: String,
        default: null
    },
    overallInterviewScore: {
        type: Number,
        default: null
    },
    topStrengths: {
        type: [String],
        default: []
    },
    topWeaknesses: {
        type: [String],
        default: []
    },
    commonMissingConcepts: {
        type: [String],
        default: []
    },
    overallImprovementSuggestions: {
        type: [String],
        default: []
    },
    integrity: {
        integrityConcern: {
            type: Boolean,
            default: false
        },
        integrityNotes: {
            type: String,
            default: null
        }
    },
    interviewSummary: {
        type: String,
        default: null
    },
    pdfUrl: {
        type: String,
        default: null
    }
}, { timestamps: true });

export const ReportModel = mongoose.model<IReport>("Report", ReportSchema);
