// @ts-nocheck
"use strict";

const clientService = require("../services/clientService");
/**
 * client controller
 */
const userService = require("../services/clientService");
const { createCoreController } = require("@strapi/strapi").factories;

module.exports = createCoreController(
    "api::client.client",
    ({ strapi }) => ({
        async find(ctx) {
            const { query } = ctx;
            try {
                const customQuery = {
                    ...query,
                    filters: {
                        ...query.filters,
                        isDeleted: false,
                    }
                };
                console.log("customQuery", customQuery);
                const { data, meta } = await super.find({ ...ctx, query: customQuery });
                return { data, meta };

            } catch (error) {
                console.error('Error in client find controller:', error);
                return super.find(ctx);
            }
        },
        async findOne(ctx) {
            const { id } = ctx.params;

            try {
                const client = await strapi.entityService.findOne('api::client.client', id, {
                    populate: '*',
                });

                if (!client || client.isDeleted) {
                    return ctx.notFound('Client not found');
                }

                return client;

            } catch (error) {
                console.error('Error in client findOne controller:', error);
                return ctx.throw(500, error);
            }
        },
        async update(ctx) {
            const { id } = ctx.params; // Get the ID of the client to be updated
            const clientData = JSON.parse(ctx.request.body.clientData || {});
            const { email } = clientData;
            const { files } = ctx.request;
            console.log("123", clientData, "clientData", id, "id", email, "email, files", files, "files");
            if (!id) {
                console.log("Please provide an ID.");
                return ctx.badRequest("Please provide an ID.");
            }

            if (!email) {
                console.log("Please provide email.");
                return ctx.badRequest("Please provide email.");
            }
            console.log("Updating client...", id);
            const existingclient = await strapi.entityService.findOne(
                "api::client.client",
                ctx.params.id,
                {
                    populate: "*",
                }
            );
            if (!existingclient) {
                console.log("client not found.");
                return ctx.notFound("client not found.");
            }
            console.log("456", clientData, "clientData", id, "id", email, "email, files", files, "files");
            // Update the user and client data
            const updatedclient = await userService.updateClient(
                id,
                { email, clientData },
                files
            );

            ctx.send(updatedclient);
        },
        async create(ctx) {
            console.log("create client", ctx.request.body.clientData);
            const clientData = typeof ctx.request.body.clientData === 'string'
                ? JSON.parse(ctx.request.body.clientData || {})
                : ctx.request.body.clientData || {};
            let { email } = clientData;
            const { files } = ctx.request;
            console.log("create client", clientData, "clientData", email, "email", files, "files");
            if (!email) {
                return ctx.badRequest("Please provide email.");
            }
            const username = email.split("@")[0];
            console.log("Creating client...", email, clientData, files);
            const result = await userService.createUserClientOrSubClient(
                { username, email, clientData },
                files
            );
            ctx.send(result);
        },
        async delete(ctx) {
            const { id } = ctx.params;

            try {
                const client = await strapi.entityService.findOne(
                    'api::client.client',
                    id,
                    {
                        populate: ['user', 'logo', 'attachment']
                    }
                );

                if (!client) {
                    return ctx.notFound('Client not found');
                }

                const userId = client.user?.id;

                await strapi.entityService.update('api::client.client', id, {
                    data: {
                        deletedUserData: client.user,
                        isDeleted: true,
                    },
                });

                const filesToDelete = [
                    client.logo,
                    ...(client.attachment || [])
                ].filter(Boolean);

                for (const file of filesToDelete) {
                    try {
                        await strapi.plugins.upload.services.upload.remove(file);
                    } catch (error) {
                        console.error(`Error deleting file ${file.id}:`, error);
                    }
                }

                if (userId) {
                    await strapi.query('plugin::users-permissions.user').delete({
                        where: { id: userId }
                    });
                }

                return ctx.send({
                    id,
                    message: 'Client and associated user deleted successfully'
                });

            } catch (error) {
                console.error('Error deleting client:', error);
                return ctx.throw(500, error);
            }
        },
        async getSubClients(ctx) {
            const { id } = ctx.params;
            const subClientIds = await clientService.getSubClientsIds(id);
            console.log("subClientsIds", subClientIds);
            // find all clients with id is in the array of subClientIds
            const subClients = await strapi.entityService.findMany('api::client.client', {
                filters: { id: subClientIds },
                populate: '*',
            });

            // console.log("ctx.query", ctx.query);
            return subClients;
        },

        async getNotifications(ctx) {
            const { id } = ctx.params;
            try {
                // Initialize notification object
                const notifications = {
                    offersNotification: false,
                    proposalsNotification: false,
                    projectsNotification: false,
                    subClientOfferNotification: false,
                };

                // Get all proposals for this client
                const clientProposals = await strapi.entityService.findMany('api::proposal.proposal', {
                    filters: {
                        client: id
                    },
                    populate: ['offer']
                });

                // Extract proposal IDs to get related offers
                const proposalIds = clientProposals.map(proposal => proposal.id);

                // Check for pending offers (offersNotification)
                const pendingOffers = await strapi.entityService.findMany('api::offer.offer', {
                    filters: {
                        proposal: {
                            id: {
                                $in: proposalIds
                            }
                        },
                        status: {
                            $in: ['Pending', 'SigningStartedByClient']
                        }
                    }
                });

                // Check for completed signings (purchaseOrdersNotification)
                const signedOffers = await strapi.entityService.findMany('api::offer.offer', {
                    filters: {
                        proposal: {
                            id: {
                                $in: proposalIds
                            }
                        },
                        status: 'SigningCompletedByClient'
                    }
                });

                notifications.offersNotification = (signedOffers && signedOffers.length > 0) || (pendingOffers && pendingOffers.length > 0);
                notifications.subClientOfferNotification = (signedOffers && signedOffers.length > 0);

                console.log('signedOffers:', signedOffers);
                console.log('pendingOffers:', pendingOffers);
                console.log('notifications.offersNotification:', notifications.offersNotification);
                console.log('notifications.subClientOfferNotification:', notifications.subClientOfferNotification);

                const subClientIds = await clientService.getSubClientsIds(id);

                if (subClientIds && subClientIds.length > 0) {
                    // Get proposals for sub-clients
                    const subClientProposals = await strapi.entityService.findMany('api::proposal.proposal', {
                        filters: {
                            client: {
                                id: {
                                    $in: subClientIds
                                }
                            },
                            status: {
                                $in: ['PendingL3Approval']
                            }
                        }
                    });

                    notifications.proposalsNotification = subClientProposals && subClientProposals.length > 0;
                }

                const ownProposals = await strapi.entityService.findMany('api::proposal.proposal', {
                    filters: {
                        client: id,
                        status: {
                            $in: ['PendingL3Approval', 'AcceptedByConsultant', 'Pending']
                        }
                    }
                });

                notifications.proposalsNotification = ownProposals && ownProposals.length > 0 || notifications.proposalsNotification;

                const pendingProjects = await strapi.entityService.findMany('api::project.project', {
                    filters: {
                        client: id,
                        status: {
                            $in: ['Ongoing']
                        }
                    }
                });

                notifications.projectsNotification = pendingProjects && pendingProjects.length > 0;

                return notifications;
            } catch (error) {
                console.error('Error in getNotifications controller:', error);
                ctx.throw(500, error);
            }
        },

        async getSubClientById(ctx) {
            const { id } = ctx.params; // This is the sub-client ID
            const { user } = ctx.state; // Get the logged-in user

            try {
                // Get the parent client ID from the logged-in user
                const parentClient = await strapi.entityService.findMany('api::client.client', {
                    filters: {
                        user: user.id
                    }
                });

                if (!parentClient || parentClient.length === 0) {
                    return ctx.notFound('Parent client not found');
                }

                const parentClientId = parentClient[0].id;

                // Get all sub-client IDs for the parent client
                const subClientIds = await clientService.getSubClientsIds(parentClientId);

                // Check if the requested sub-client ID is in the list of sub-clients
                if (!subClientIds.includes(parseInt(id))) {
                    return ctx.forbidden('You do not have access to this sub-client');
                }

                // Get the sub-client data
                const subClient = await strapi.entityService.findOne('api::client.client', id, {
                    populate: '*'
                });

                if (!subClient || subClient.isDeleted) {
                    return ctx.notFound('Sub-client not found');
                }

                return subClient;

            } catch (error) {
                console.error('Error in getSubClientById controller:', error);
                return ctx.throw(500, error);
            }
        },

        async updateSubClient(ctx) {
            const { id } = ctx.params; // This is the sub-client ID
            const { user } = ctx.state; // Get the logged-in user
            const clientData = typeof ctx.request.body.clientData === 'string'
                ? JSON.parse(ctx.request.body.clientData || {})
                : ctx.request.body.clientData || {};


            try {
                // Get the parent client ID from the logged-in user
                const parentClient = await strapi.entityService.findMany('api::client.client', {
                    filters: {
                        user: user.id
                    }
                });

                if (!parentClient || parentClient.length === 0) {
                    return ctx.notFound('Parent client not found');
                }

                const parentClientId = parentClient[0].id;

                // Get all sub-client IDs for the parent client
                const subClientIds = await clientService.getSubClientsIds(parentClientId);

                // Check if the requested sub-client ID is in the list of sub-clients
                if (!subClientIds.includes(parseInt(id))) {
                    return ctx.forbidden('You do not have access to update this sub-client');
                }

                // Get the sub-client data
                const subClient = await strapi.entityService.findOne('api::client.client', id, {
                    populate: '*'
                });

                if (!subClient || subClient.isDeleted) {
                    return ctx.notFound('Sub-client not found');
                }

                // Update the sub-client using the existing updateClient service
                const updatedSubClient = await userService.updateClient(
                    id,
                    { email: subClient.email, clientData },

                );

                return updatedSubClient;

            } catch (error) {
                console.error('Error in updateSubClient controller:', error);
                return ctx.throw(500, error);
            }
        }
    })
);
