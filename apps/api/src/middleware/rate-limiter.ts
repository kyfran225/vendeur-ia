import { rateLimit } from 'express-rate-limit';

// Global API Limiter
export const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 1000, // Limit each IP to 1000 requests per `window`
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
  message: {
    error: 'Too many requests, please try again later.',
  },
});

// Stricter Limiter for AI Generation (Cost protection)
export const aiLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 50, // Limit each IP to 50 AI calls per hour
  message: {
    error: 'AI generation limit reached for this hour. Contact support if you need more.',
  },
  skip: (req) => {
    // Optional: Skip for specific plans/premium users in the future
    return false;
  }
});
