
// @ts-nocheck
'use strict';

const { pop } = require('../../../../config/middlewares');
const util = require("../../../utils/util");
/**
 * timesheet controller
 */

const { createCoreController } = require('@strapi/strapi').factories;

module.exports = createCoreController('api::timesheet.timesheet', ({ strapi }) => ({
    async create(ctx) {
        const { files, body } = ctx.request; // Extract files and body
        console.log('body', body);
        const data = JSON.parse(body.data) // Parse JSON data from the body field
        console.log('data', data);


        console.log(data);
        const timesheetID = data.timesheetID;
        const project = await strapi.entityService.findOne('api::project.project', data?.project?.id, {
            populate: ['client', 'consultant', 'offer'],
        });

        if (timesheetID) {
            const existingTimesheet = await strapi.entityService.findOne('api::timesheet.timesheet', timesheetID, {
                populate: ['timesheetFile']
            });

            if (existingTimesheet) {
                if (files && files.timesheetFile) {
                    console.log('files', files.timesheetFile);
                    const uploadedFiles = await strapi.plugins[
                        "upload"
                    ].services.upload.upload({
                        data: {
                            refId: timesheetID,
                            ref: "api::timesheet.timesheet",
                            field: "timesheetFile",
                        },
                        files: files.timesheetFile,
                    });
                } else {

                    if (data?.deletedTimesheet) {

                        if (existingTimesheet.timesheetFile) {

                            await strapi.plugins['upload'].services.upload.remove(existingTimesheet.timesheetFile);
                            data.timesheetFile = null;

                        }
                    }
                }

                const updatedTimesheet = await strapi.entityService.update('api::timesheet.timesheet', timesheetID, {
                    data: data,
                });



                if (data?.isSubmitted) {
                    try {

                        await util.sendTimesheetSubmittedEmail(project, updatedTimesheet, 'consultant');
                        await util.sendTimesheetSubmittedEmail(project, updatedTimesheet, 'client');

                    } catch (error) {
                        console.error(error);
                        return util.handleErrorResponse(error);
                    }
                }

                return this.transformResponse(updatedTimesheet);
            } else {
                return ctx.badRequest(null, [{ messages: [{ id: 'timesheet.update.error', message: 'Updated denied! timesheet ID dont exist.' }] }]);
            }
        } else {
            const newTimesheet = await strapi.entityService.create('api::timesheet.timesheet', {
                data: data,
            });

            if (files && files.timesheetFile) {
                console.log('files', files.timesheetFile);
                const uploadedFiles = await strapi.plugins[
                    "upload"
                ].services.upload.upload({
                    data: {
                        refId: newTimesheet?.id,
                        ref: "api::timesheet.timesheet",
                        field: "timesheetFile",
                    },
                    files: files.timesheetFile,
                });
            }


            if (data?.isSubmitted) {
                try {

                    await util.sendTimesheetSubmittedEmail(project, newTimesheet, 'consultant');
                    await util.sendTimesheetSubmittedEmail(project, newTimesheet, 'client');

                } catch (error) {
                    console.error(error);
                    return util.handleErrorResponse(error);
                }
            }
            return this.transformResponse(newTimesheet);
        }
    },

    async update(ctx) {
        const { ...data } = ctx.request.body;
        console.log(data);
        const timesheetID = data?.body?.timesheetID;
        const project = await strapi.entityService.findOne('api::project.project', data?.body?.project?.id, {
            populate: ['client', 'consultant', 'offer'],
        });


        if (timesheetID) {
            const existingTimesheet = await strapi.entityService.findOne('api::timesheet.timesheet', timesheetID);

            if (existingTimesheet) {
                const updatedTimesheet = await strapi.entityService.update('api::timesheet.timesheet', timesheetID, {
                    data: data?.body,
                });

                if (data?.body?.approvalStatus === 'Approved') {
                    try {
                        console.log('approved');
                        await util.sendTimesheetApprovedEmail(project, updatedTimesheet, 'consultant');
                        await util.sendTimesheetApprovedEmail(project, updatedTimesheet, 'client');

                    } catch (error) {
                        console.error(error);
                        return util.handleErrorResponse(error);
                    }
                } else if (data?.body?.approvalStatus === 'Rejected') {
                    try {

                        await util.sendTimesheetRejectedEmail(project, updatedTimesheet, 'consultant');
                        await util.sendTimesheetRejectedEmail(project, updatedTimesheet, 'client');
                    } catch (error) {
                        console.error(error);
                        return util.handleErrorResponse(error);
                    }
                }

                return this.transformResponse(updatedTimesheet);
            } else {
                return ctx.badRequest(null, [{ messages: [{ id: 'timesheet.update.error', message: 'Updated denied! timesheet ID dont exist.' }] }]);
            }
        }
    }
}));

