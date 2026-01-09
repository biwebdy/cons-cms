// @ts-nocheck
'use strict';

const clientService = require('../../client/services/clientService');
const util = require("../../../utils/util");
/**
 * project controller
 */

const { createCoreController } = require('@strapi/strapi').factories;

module.exports = createCoreController('api::project.project', ({ strapi }) => ({
    async find(ctx) {
        return super.find(ctx);
    },
    async getSubClientProjects(ctx) {
        const { id } = ctx.params;
        const subClientIds = await clientService.getSubClientsIds(id);
        console.log("subClientsIds", subClientIds);
        if (!ctx.query.populate) ctx.query.populate = {};
        ctx.query.populate.client = true;

        const originalQuery = { ...ctx.query };
        delete ctx.query.filters?.client;

        const { data, meta } = await super.find(ctx);
        console.log("Total projects found:", data.length);
        return data;
    },
    async update(ctx) {
        const { id } = ctx.params;
        const body = ctx.request.body;

        console.log(`Updating project with ID: ${id}`);
        console.log("Request body:", body);

        if (!ctx.query.populate) ctx.query.populate = {};

        ctx.query.populate.consultant = {
            populate: {
                user: {
                    populate: ['email']
                }
            }
        };

        ctx.query.populate.client = {
            populate: {
                company: true
            }
        };
        ctx.query.populate.offer = {
            populate: {
                proposal: true
            }
        };

        const response = await super.update(ctx);

        console.log("Updated proposal:", response?.data?.attributes?.offer?.data?.attributes?.proposal);

        if (body?.data?.status === "Finished") {
            console.log(`Project with ID: ${id} has been marked as "Finished".`);
            try {
                await util.sendProjectFinishEmail(response.data, 'consultant');
                await util.sendProjectFinishEmail(response.data, 'client');
            } catch (emailError) {
                console.error('Error sending project finish emails:', emailError);
            }
        }

        return response;
    },
}));
