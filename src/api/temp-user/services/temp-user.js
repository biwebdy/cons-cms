'use strict';

/**
 * temp-user service
 */

const { createCoreService } = require('@strapi/strapi').factories;

module.exports = createCoreService('api::temp-user.temp-user');
