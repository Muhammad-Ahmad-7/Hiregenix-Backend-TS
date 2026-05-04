import { rateLimit } from 'express-rate-limit'

const limiter = rateLimit({
    windowMs: 1 * 60 * 1000, // 1 minutes
    limit: 100, // Limit each IP to 100 requests per `window`
    standardHeaders: 'draft-8', // Returns RateLimit-* headers
    legacyHeaders: false, // Disable X-RateLimit-* headers
    message: "Too many requests, please try again later.",
})


export default limiter;