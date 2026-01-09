"use strict";

/**
 * admin router
 */

module.exports = {
    routes: [
        {
            method: 'GET',
            path: '/admin/notifications',
            handler: 'admin.getNotifications',
            config: {
                policies: [],
                middlewares: [],
            },
        }
    ]
}; 