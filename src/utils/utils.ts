type EventType = "face_verification" | "face_missing" | "tab_switch";

interface BaseEvent {
    type: EventType;
    timestamp: number; // use epoch for consistency
}

export interface FaceVerificationEvent extends BaseEvent {
    type: "face_verification";
    score: number;
    verified: boolean;
}

export interface FaceMissingEvent extends BaseEvent {
    type: "face_missing";
    startedAt?: number;
    endedAt?: number;
    durationMs: number;
}

export interface TabSwitchEvent extends BaseEvent {
    type: "tab_switch";
}

export type VerificationEvent =
    | FaceVerificationEvent
    | FaceMissingEvent
    | TabSwitchEvent;


export interface VerificationSummary {
    integrityScore: number;
    riskLevel: "low" | "medium" | "high" | "critical";

    avgConfidence: number;
    minConfidence: number;
    maxConfidence: number;

    verificationCount: number;
    failedVerifications: number;

    faceMissingEvents: number;
    totalFaceMissingDurationMs: number;
    longestFaceMissingDurationMs: number;

    tabSwitches: number;
    maxConsecutiveLowScores: number;

    suspiciousEvents: Array<{
        type: string;
        timestamp: number;
        meta?: any;
    }>;
}

export function generateVerificationSummary(
    events: VerificationEvent[]
): VerificationSummary {

    let verificationScores: number[] = [];

    let failedVerifications = 0;

    let faceMissingEvents = 0;
    let totalFaceMissingDurationMs = 0;
    let longestFaceMissingDurationMs = 0;

    let tabSwitches = 0;

    let suspiciousEvents: VerificationSummary["suspiciousEvents"] = [];

    let consecutiveLowScores = 0;
    let maxConsecutiveLowScores = 0;

    const LOW_CONFIDENCE_THRESHOLD = 70;
    const HIGH_RISK_MISSING_DURATION = 10000;

    for (const event of events) {

        switch (event.type) {

            case "face_verification": {
                const score = event.score ?? 0;

                verificationScores.push(score);

                if (!event.verified || score < LOW_CONFIDENCE_THRESHOLD) {
                    failedVerifications++;
                    consecutiveLowScores++;

                    suspiciousEvents.push({
                        type: "low_confidence",
                        timestamp: event.timestamp,
                        meta: { score }
                    });
                } else {
                    consecutiveLowScores = 0;
                }

                maxConsecutiveLowScores = Math.max(
                    maxConsecutiveLowScores,
                    consecutiveLowScores
                );

                break;
            }

            case "face_missing": {
                faceMissingEvents++;

                const duration = event.durationMs ?? 0;

                totalFaceMissingDurationMs += duration;

                longestFaceMissingDurationMs = Math.max(
                    longestFaceMissingDurationMs,
                    duration
                );

                if (duration >= HIGH_RISK_MISSING_DURATION) {
                    suspiciousEvents.push({
                        type: "long_face_missing",
                        timestamp: event.timestamp,
                        meta: { duration }
                    });
                }

                break;
            }

            case "tab_switch": {
                tabSwitches++;

                suspiciousEvents.push({
                    type: "tab_switch",
                    timestamp: event.timestamp
                });

                break;
            }

            default:
                // future-proofing
                break;
        }
    }

    const avgConfidence =
        verificationScores.length
            ? verificationScores.reduce((a, b) => a + b, 0) / verificationScores.length
            : 0;

    const minConfidence =
        verificationScores.length
            ? Math.min(...verificationScores)
            : 0;

    const maxConfidence =
        verificationScores.length
            ? Math.max(...verificationScores)
            : 0;

    // --- Integrity Score Model ---
    let integrityScore = 100;

    integrityScore -= failedVerifications * 8;
    integrityScore -= faceMissingEvents * 5;
    integrityScore -= Math.floor(totalFaceMissingDurationMs / 5000) * 4;
    integrityScore -= tabSwitches * 6;

    if (maxConsecutiveLowScores >= 2) integrityScore -= 15;

    integrityScore = Math.max(0, Math.min(100, integrityScore));

    // --- Risk Level ---
    let riskLevel: VerificationSummary["riskLevel"] = "low";

    if (integrityScore < 50) riskLevel = "critical";
    else if (integrityScore < 70) riskLevel = "high";
    else if (integrityScore < 90) riskLevel = "medium";

    return {
        integrityScore,
        riskLevel,

        avgConfidence: Number(avgConfidence.toFixed(2)),
        minConfidence: Number(minConfidence.toFixed(2)),
        maxConfidence: Number(maxConfidence.toFixed(2)),

        verificationCount: verificationScores.length,
        failedVerifications,

        faceMissingEvents,
        totalFaceMissingDurationMs,
        longestFaceMissingDurationMs,

        tabSwitches,
        maxConsecutiveLowScores,

        suspiciousEvents
    };
}