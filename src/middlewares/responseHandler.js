"use strict";


module.exports = (config, { strapi }) => {
    // Add your own logic here.
    return async (ctx, next) => {
        if (ctx.request.url.startsWith("/api")) {
            try {
                await next(); // Proceed to the next middleware or route handler

                // If there's no status set, assume it's a successful response
                if (!ctx.status) {
                    ctx.status = 200;
                }

                // Standardize the success response
                ctx.body = {
                    status: ctx.status,
                    message: ctx.message || "Request was successful",
                    ...(ctx.body && typeof ctx.body === 'object' && 'data' in ctx.body
                        ? ctx.body
                        : { data: ctx.body || null })
                };
            } catch (error) {
                console.error(error);
                console.error("Error in responseHandler middleware:", JSON.stringify(error));
                // Standardize the error response
                ctx.status = error.status || 500;
                ctx.body = {
                    status: ctx.status,
                    error: error.message || "An unexpected error occurred",
                    details: error.details || null,
                };
            }
        } else {
            await next();
            return;
        }
    };
};