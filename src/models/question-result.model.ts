import mongoose, { Document, Schema } from "mongoose";


export interface IQuestionResult extends Document {
    _id: string;                        // MongoDB/DB primary key
    interviewId: Schema.Types.ObjectId; // FK to the Interview document
    questionId: string;                 // question id from question bank
    questionText: string;               // Snapshot of question at the time of interview
    candidateAnswer?: string;           // If text input is allowed
    numberOfTabSwitch: number;
    transcriptText?: string;            // STT transcript of candidate's spoken answer
    videoUrl?: string;                  // URL to candidate's video for this question
    audioUrl?: string;                  // URL to extracted audio from video
    videoAnalysis?: any;
    scores?: {
        content?: number;               // score on the answer content
        communication?: number;         // score on speech clarity, confidence
        skill?: number;                 // skill-specific score (mapped to question.skill)
        overall?: number;               // aggregate score
    };
    lLMAnalysis?: {
        confidenceScore?: number;       // 0-1 confidence of understanding answer
        missingConcepts?: string[];     // extracted topics not covered
        summary?: string;               // summary of answer
        notes?: string;                 // additional evaluation notes
    };
    status: 'PROCESSING' | 'DONE' | 'FAILED';   // Main status of processing

    // Per-stage boolean flags
    stages: {
        uploaded: boolean;         // video uploaded
        audioExtracted: boolean;   // audio extracted
        sttDone: boolean;          // transcription complete
        videoAnalyzed: boolean;    // video analysis complete
        llmEvaluated: boolean;     // LLM evaluation complete
        done: boolean;             // all stages finished
        failed: boolean;           // any failure
    };
    createdAt: Date;
    updatedAt: Date;
}


const QuestionResultSchema = new Schema<IQuestionResult>({
    interviewId: {
        type: Schema.Types.ObjectId,
        ref: 'Interview',
        required: true
    },
    questionId: {
        type: String,
        required: true
    },
    questionText: {
        type: String,
        required: true
    },
    candidateAnswer: {
        type: String,
        default: null
    },
    numberOfTabSwitch: {
        type: Number,
        default: 0
    },
    transcriptText: {
        type: String,
        default: null
    },
    videoUrl: {
        type: String,
        default: null
    },
    audioUrl: {
        type: String,
        default: null
    },
    videoAnalysis: {
        type: Object,
        default: null
    },
    scores: {
        content: {
            type: Number,
            default: null
        },
        communication: {
            type: Number,
            default: null
        },
        skill: {
            type: Number,
            default: null
        },
        overall: {
            type: Number,
            default: null
        }
    },

    lLMAnalysis: {
        confidenceScore: {
            type: Number,
            default: null
        },
        missingConcepts: {
            type: [String],
            default: null
        },
        summary: {
            type: String,
            default: null
        },
        notes: {
            type: String,
            default: null
        }
    },
    status: {
        type: String,
        enum: ['PROCESSING', 'DONE', 'FAILED'],
        default: 'PROCESSING'
    },
    stages: {
        uploaded: {
            type: Boolean,
            default: false
        },
        audioExtracted: {
            type: Boolean,
            default: false
        },
        sttDone: {
            type: Boolean,
            default: false
        },
        videoAnalyzed: {
            type: Boolean,
            default: false
        },
        llmEvaluated: {
            type: Boolean,
            default: false
        },
        done: {
            type: Boolean,
            default: false
        },
        failed: {
            type: Boolean,
            default: false
        }
    }
}, {
    timestamps: true
});

QuestionResultSchema.index({ interviewId: 1, questionId: 1 }, { unique: true });

const QuestionResultModel = mongoose.model<IQuestionResult>("QuestionResult", QuestionResultSchema);
export default QuestionResultModel;