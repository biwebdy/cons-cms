module.exports = [
  'strapi::errors',
  'strapi::security',
  'strapi::cors',
  'strapi::poweredBy',
  'strapi::logger',
  'strapi::query',
  'strapi::body',
  'strapi::session',
  'strapi::favicon',
  'strapi::public',
  {
    name: 'strapi::security',
    config: {
      contentSecurityPolicy: {
        useDefaults: true,
        directives: {
          'connect-src': ["'self'", 'https:'],
          'img-src': ["'self'", 'data:', 'blob:', 'res.cloudinary.com'],
          'media-src': ["'self'", 'data:', 'blob:', 'res.cloudinary.com'],
          upgradeInsecureRequests: null,
        },
      },
    },
  },
  {
    name: 'global::attach-user-to-context',
    config: {},
  },
  {
    resolve: './src/middlewares/responseHandler.js'
  },
  {
    resolve: './src/middlewares/is-owner.js'
  },
  {
    resolve: './src/middlewares/request-logger.js'
  },
  {
    resolve: './src/middlewares/user-can-update.js'
  },
  {
    resolve: './src/middlewares/user-find-many.js'
  },

];
