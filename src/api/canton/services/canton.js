'use strict';

/**
 * canton service
 */

const { createCoreService } = require('@strapi/strapi').factories;

module.exports = createCoreService('api::canton.canton');
