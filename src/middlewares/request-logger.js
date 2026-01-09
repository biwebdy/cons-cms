'use strict';

/**
 * `request-logger` middleware
 */

module.exports = (config, { strapi }) => {
  // Add your own logic here.
  return async (ctx, next) => {
    // const start = Date.now();
    await next();
    // const ms = Date.now() - start;
    // strapi.log.info(`${ctx.method} ${ctx.url} - ${ms}ms`);
    if (ctx.status >= 400) {
      strapi.log.error(`Response status: ${ctx.status}`);
      if (ctx.body && ctx.body.message) {
        strapi.log.error(`Error message: ${ctx.body.message}`);
      }
    }
  }
};
