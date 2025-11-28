import { ZodError, ZodType, z } from "zod"
import { Request, Response, NextFunction } from "express"

export const validateRequest = (schema: ZodType) => {
    return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            await schema.parseAsync(req.body);
            next();
        } catch (error) {
            // if (error instanceof Error) {
            //     res.status(400).json({
            //         status: 'error',
            //         message: 'Validation failed',
            //         errors: 'errors' in error ? (error as any).errors : [error.message],
            //     });
            //     return;
            // }
            // next(error);

            if (error instanceof ZodError) {
                const result = z.flattenError(error);
                res.status(400).json({
                    status: 'error',
                    message: 'Validation failed',
                    errors: result.fieldErrors,
                });

                return;
            }
        }
    };
};