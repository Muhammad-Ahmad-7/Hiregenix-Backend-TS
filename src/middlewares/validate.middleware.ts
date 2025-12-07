import { ZodError, ZodTypeAny, z } from "zod";
import { Request, Response, NextFunction } from "express";

export const validateRequest = (schema: ZodTypeAny) => {
    return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            await schema.parseAsync(req.body);
            return next();
        } catch (error) {
            if (error instanceof ZodError) {
                // Fix typing properly
                const flattened = z.flattenError(error);
                const fieldErrors: Record<string, string[] | undefined> = flattened.fieldErrors;

                const cleanedErrors: Record<string, string[]> = {};

                for (const [field, messages] of Object.entries(fieldErrors)) {
                    const safeMessages = Array.isArray(messages) ? messages : [];

                    cleanedErrors[field] = safeMessages.map((msg: string) =>
                        msg.replace(/\\"/g, '"')
                    );
                }

                const formattedMessages = Object.entries(cleanedErrors).map(
                    ([field, messages]) => `ERROR in ${field}: ${messages.join(", ")}`
                );

                res.status(400).json({
                    status: "error",
                    message: formattedMessages.join(" | "),
                    errors: cleanedErrors
                });
                return;
            }

            console.error("Unexpected validation error:", error);

            res.status(500).json({
                status: "error",
                message: "Internal server error"
            });

            return;
        }
    };
};
