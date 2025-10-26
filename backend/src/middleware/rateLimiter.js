import rateLimit from 'express-rate-limit';

// Basic limiter for most API routes
export const apiLimiter = rateLimit({
	windowMs: 1 * 60 * 1000, // 1 minutes
	max: 100, // Limit each IP to 100 requests per windowMs
	standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
	legacyHeaders: false, // Disable the `X-RateLimit-*` headers
    message: { message: 'Too many requests from this IP, please try again after 15 minutes' },
});

// Stricter limiter for authentication routes
export const authLimiter = rateLimit({
	windowMs: 1 * 60 * 1000, // 1 minute
	max: 10, // Limit each IP to 10 login/register attempts per windowMs
	standardHeaders: true,
	legacyHeaders: false,
	message: { message: 'Too many authentication attempts from this IP, please try again after 15 minutes' },
});