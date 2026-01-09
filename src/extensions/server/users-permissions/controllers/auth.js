'use strict';
const { sanitize } = require('@strapi/utils').sanitize;

module.exports = {
    async login(ctx) {
        try {
            const { identifier, password } = ctx.request.body;
            const user = await strapi.plugins['users-permissions'].services.user.fetch({ identifier });

            if (!user) {
                return ctx.badRequest('Invalid identifier or password1');
            }

            const validPassword = await strapi.plugins['users-permissions'].services.user.validatePassword(password, user.password);

            if (!validPassword) {
                return ctx.badRequest('Invalid identifier or password2');
            }

            ctx.send({
                jwt: strapi.plugins['users-permissions'].services.jwt.issue({ id: user.id }),
                user,
            });
        } catch (err) {
            strapi.log.error(err);
            return ctx.internalServerError('An error occurred during login3');
        }
    },
    async callback(ctx) {
        console.log('ctx', ctx);
        const { identifier, password } = ctx.request.body;

        if (!identifier || !password) {
            return ctx.badRequest('Missing identifier or password4');
        }
        console.log('identifier', identifier);
        const user = await strapi.plugin('users-permissions').service('user').fetch({ identifier });
        console.log('user', user);
        if (!user) {
            return ctx.badRequest('User not found');
        }

        const validPassword = await strapi.plugin('users-permissions').service('user').validatePassword(password, user.password);
        console.log('validPawword', validPassword);
        if (!validPassword) {
            return ctx.badRequest('Invalid password5');
        }

        if (!user.passwordChanged) {
            return ctx.send({
                status: 'password_change_required',
                message: 'Please change your password.',
                user: sanitize.contentAPI.output(user),
            });
        }

        ctx.send({
            jwt: strapi.plugin('users-permissions').service('jwt').issue({ id: user.id }),
            user: sanitize.contentAPI.output(user),
        });
    },
    async changePassword(ctx) {
        const { userId, newPassword } = ctx.request.body;

        if (!userId || !newPassword) {
            return ctx.badRequest('Please provide user ID and new password.');
        }

        const user = await strapi.query('plugin::users-permissions.user').findOne({ where: { id: userId } });

        if (!user) {
            return ctx.badRequest('User not found.');
        }

        const hashedPassword = await strapi.plugin('users-permissions').service('user').hashPassword({ password: newPassword });

        await strapi.query('plugin::users-permissions.user').update({
            where: { id: userId },
            data: { password: hashedPassword, passwordChanged: true },
        });

        // Issue a new JWT token
        const jwt = await strapi.plugin('users-permissions').service('jwt').issue({ id: user.id });

        ctx.send({
            message: 'Password changed successfully.',
            jwt,
            user: sanitize.contentAPI.output(user),
        });
    },
};

