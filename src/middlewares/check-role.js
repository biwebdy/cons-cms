'use strict';

module.exports = (config, { strapi }) => {
  return async (ctx, next) => {
    const user = ctx.state.user;
    if (!user) {
      return ctx.unauthorized('You must be logged in');
    }

    const { role } = user;
    if (!role) {
      return ctx.forbidden('User has no role assigned');
    }

    // Add role to context for use in controllers
    ctx.state.userRole = role.name;

    // If specific roles are required for this route
    if (config.roles && !config.roles.includes(role.name)) {
      return ctx.forbidden('You do not have permission to access this resource');
    }

    await next();
  };
}; 