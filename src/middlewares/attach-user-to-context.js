"use strict";
module.exports = (config, { strapi }) => {
    return async (ctx, next) => {
        if (ctx.request.url.startsWith("/api")) {
            // console.log('Middleware: attach-user-to-context');
            // console.log('ctx.request.header:', ctx.request.header);
            if (ctx.state.user) {
                ctx.user = ctx.state.user;
            } else if (ctx.request.header.authorization) {
                // Try to fetch user information if authorization header is present
                try {
                    const token = ctx.request.header.authorization.replace('Bearer ', '');
                    const user = await strapi.plugins['users-permissions'].services.jwt.verify(token);
                    ctx.state.user = user;
                    ctx.user = user;
                } catch (err) {
                    console.error('Error verifying JWT:', err);
                }
            }
            await next();
        } else {
            await next();
            return;
        }
    };
};