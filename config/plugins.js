module.exports = ({ env }) => ({
    email: {
        config: {
            provider: 'strapi-provider-email-smtp',
            providerOptions: {
                host: env('SMTP_HOST', 'mail.expertree.com'),
                port: env.int('SMTP_PORT', 465),
                secure: true, // true for 465, false for other ports
                auth: {
                    user: env('SMTP_USERNAME', 'np-reply@expertree.com'),
                    pass: env('SMTP_PASSWORD'),
                },
            },
            settings: {
                defaultFrom: env('SMTP_FROM', 'np-reply@swiss-check.com'),
                defaultReplyTo: env('SMTP_FROM', 'np-reply@swiss-check.com'),
            },
        },
    },
    'users-permissions': {
        config: {
            jwt: {
                expiresIn: '259200S', // 3DAYS
            },
        },
    },
    // 'rest-cache': {
    //     config: {
    //         provider: {
    //             name: 'memory',
    //             options: {
    //                 max: 32767,
    //                 maxAge: 3600000,
    //                 updateAgeOnGet: false
    //             }
    //         },
    //         strategy: {
    //             contentTypes: [
    //                 "api::canton.canton",
    //                 // "api::client.client",
    //                 // "api::consultant.consultant",
    //                 "api::industry.industry",
    //                 // "api::proposal.proposal",
    //                 // "api::offer.offer",
    //                 // "api::project.project",
    //                 // "api::proposal.proposal",
    //                 "api::global.global",
    //                 "api::skill.skill",
    //                 // "api::timesheet.timesheet"
    //             ],
    //             debug: false,
    //             maxAge: 600000,//10 minutes
    //             hitpass: false,
    //             clearRelatedCache: true,
    //             pagination: {
    //                 enabled: true,
    //                 maxLimit: 100,
    //                 withCount: true,
    //             },
    //             routes: [
    //                 {
    //                     path: '/api/users/me',
    //                     method: 'GET',
    //                     enabled: false, // Disable caching for this specific route
    //                 },
    //                 {
    //                     path: '/(.*)', // This will match all other paths
    //                     method: 'GET',
    //                     enabled: true,
    //                 }
    //             ],
    //             queryParams: {
    //                 '*': true,
    //             },
    //         }
    //     }
    // },
    documentation: {
        enabled: true,
        config: {
        },
    },
});
