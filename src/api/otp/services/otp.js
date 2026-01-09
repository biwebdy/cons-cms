'use strict';

const { createCoreService } = require('@strapi/strapi').factories;

module.exports = createCoreService('api::otp.otp', ({ strapi }) => ({
    async generateOTP(ctx, user) {
        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        const requestTime = ctx.request.timestamp || Date.now();
        const expiresAt = new Date(requestTime + 15 * 60 * 1000);
        const oneHourAgo = new Date(requestTime - 60 * 60 * 1000);
        const recentOTPCount = await strapi.db.query('api::otp.otp').count({
            where: {
                user: user.id,
                createdAt: { $gt: oneHourAgo }
            }
        });

        if (recentOTPCount >= 3) {
            throw new Error('You have reached the maximum password reset requests for this hour. Please try again later.');
        }

        const otpRecord = await strapi.db.query('api::otp.otp').create({
            data: {
                code: otp,
                expiresAt,
                user: user.id
            },
        });

        return otpRecord;
    },

    async verifyOTP(ctx, userId, code) {
        const otpRecord = await strapi.db.query('api::otp.otp').findOne({
            where: {
                user: userId,
                code,
                isUsed: false,
            },
            orderBy: { createdAt: 'DESC' },
        });

        if (!otpRecord) {
            throw new Error('Invalid OTP');
        }
        const requestTime = ctx.request.timestamp || Date.now();
        const now = new Date(requestTime);
        const expiresAt = new Date(otpRecord.expiresAt);

        if (now > expiresAt) {
            throw new Error('OTP has expired');
        }

        await strapi.db.query('api::otp.otp').update({
            where: { id: otpRecord.id },
            data: { isUsed: true },
        });

        return true;
    },

    async getActiveOTP(ctx, userId) {
        const requestTime = ctx.request.timestamp || Date.now();
        const now = new Date(requestTime);

        const activeOTP = await strapi.db.query('api::otp.otp').findOne({
            where: {
                user: userId,
                isUsed: false,
                expiresAt: { $gt: now }
            },
            orderBy: { createdAt: 'DESC' },
        });

        return activeOTP;
    }
}));