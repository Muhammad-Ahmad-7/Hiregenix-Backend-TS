import { ZodError, ZodType, z } from "zod";
import { Request, Response, NextFunction } from "express";

export const validateRequest = (schema: ZodType) => {
    return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            await schema.parseAsync(req.body);
            next();
        } catch (error) {
            if (error instanceof ZodError) {
                const result = z.flattenError(error);
                const fieldErrors = result.fieldErrors;

                // flatten all errors into a single string
                const allMessages =
                    Object.values(fieldErrors)
                        .flat()
                        .join(", ") || "Validation failed";

                res.status(400).json({
                    status: "error",
                    message: allMessages,   // <-- all errors combined here
                    errors: fieldErrors,     // detailed field-level errors
                });

                return;
            }

            console.error("Unexpected validation error:", error);

            res.status(500).json({
                status: "error",
                message: "Internal server error",
            });

            return;
        }
    };
};
