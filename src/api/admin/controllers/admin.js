"use strict";

/**
 * admin controller
 */

module.exports = {
    async getNotifications(ctx) {
        try {
            // Initialize admin notification object
            const notifications = {
                proposalsNotification: false,
                offersNotification: false,
                consultantsNotification: false,
                clientsNotification: false,
                projectsNotification: false,
            };

            // Check for proposals pending admin approval
            const pendingProposals = await strapi.entityService.findMany('api::proposal.proposal', {
                filters: {
                    status: {
                        $in: ['PendingL1Approval']
                    }
                }
            });
            notifications.proposalsNotification = pendingProposals && pendingProposals.length > 0;

            // Check for offers pending admin approval
            const pendingOffers = await strapi.entityService.findMany('api::offer.offer', {
                filters: {
                    status: {
                        $in: ['POSubmitted']
                    }
                }
            });
            notifications.offersNotification = pendingOffers && pendingOffers.length > 0;

            // Check for consultants pending admin approval
            const pendingConsultants = await strapi.entityService.findMany('api::consultant.consultant', {
                filters: {
                    approval: {
                        $in: ['TOAPPROVE']
                    }
                }
            });
            notifications.consultantsNotification = pendingConsultants && pendingConsultants.length > 0;

            // // Check for clients pending admin approval
            // const pendingClients = await strapi.entityService.findMany('api::client.client', {
            //     filters: {
            //         status: {
            //             $in: ['PendingAdminApproval', 'AwaitingApproval']
            //         }
            //     }
            // });
            // notifications.clientsNotification = pendingClients && pendingClients.length > 0;

            // Check for projects requiring admin attention
            // const pendingProjects = await strapi.entityService.findMany('api::project.project', {
            //     filters: {
            //         status: {
            //             $in: ['PendingAdminApproval', 'RequiresAdminAction', 'EscalatedToAdmin']
            //         }
            //     }
            // });
            // notifications.projectsNotification = pendingProjects && pendingProjects.length > 0;

            return notifications;
        } catch (error) {
            console.error('Error in admin getNotifications controller:', error);
            ctx.throw(500, error);
        }
    }
}; 