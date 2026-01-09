// @ts-nocheck
"use strict";

/**
 * consultant controller
 */
const fs = require('fs');
const path = require('path');
const config = require('../../../../config/docusign');

const userService = require("../services/userService");
const { createCoreController } = require("@strapi/strapi").factories;
const docusignService = require("../../../utils/docusign");
const { calculatePercentageCompletion } = require('../services/percentage-completion');
module.exports = createCoreController(
  "api::consultant.consultant",
  ({ strapi }) => ({
    async consultantUserIdsToExclude(ctx) {
      const stateUserId = ctx.state?.user?.id;
      const contextUserId = ctx.user?.id;
      const clientId = stateUserId || contextUserId;
      // Get consultants with ongoing or paused projects
      const projectsQuery = await strapi.db.query('api::project.project').findMany({
        where: {
          client: {
            user: {
              id: clientId
            }
          },
          status: {
            $in: ['Ongoing']
          }
        },
        populate: ['consultant.user'],
      });

      // Get consultants with pending proposals or accepted proposals without projects
      const proposalsQuery = await strapi.db.query('api::proposal.proposal').findMany({
        where: {
          client: {
            user: {
              id: clientId
            }
          },
          status: {
            $in: [
              'Pending',
              'PendingConsultantSigning',
              'AcceptedByConsultant',
              'ApprovedByAdmin',
              'SigningStartedByConsultant',
              'SigningCompletedByConsultant',
              "PendingL3Approval",
              "PendingL1Approval",
            ]
          }
        },
        populate: ['consultant.user', 'offer'],
      });
      console.log("proposalsQuery", proposalsQuery, clientId);
      // Get consultants with accepted offers but no projects
      const offersQuery = await strapi.db.query('api::offer.offer').findMany({
        where: {
          proposal: {
            client: {
              user: {
                id: clientId
              }
            }
          },
          status: {
            $in: [
              'Pending',
              'AcceptedByClient',
              'AcceptedByAdmin',
              'PendingConsultantSigning',
              'SigningStartedByClient',
              'SigningCompletedByClient'
            ]
          }
        },
        populate: ['proposal.consultant.user'],
      });


      // Collect all consultant user IDs to exclude
      const userIdsToExclude = new Set([
        ...projectsQuery.map(project => project.consultant?.id).filter(Boolean),
        ...proposalsQuery.map(proposal => proposal.consultant?.id).filter(Boolean),
        ...offersQuery.map(offer => offer.proposal?.consultant?.id).filter(Boolean)
      ]);
      console.log("consultantUserIdsToExclude", userIdsToExclude);
      return userIdsToExclude;
    },
    async find(ctx) {
      const stateUserId = ctx.state?.user?.id;
      const contextUserId = ctx.user?.id;
      const clientId = stateUserId || contextUserId;

      const { query } = ctx;
      const isSearchConsultant = query?.filters?.profileCompleted === 'true';

      if (!isSearchConsultant) {
        console.log('Not tempering consultants response, returning normal results');
        let customQuery = {
          ...query,
          filters: {
            ...query.filters,
            isDeleted: false,
          },
          populate: {
            bankingInfo: {
              populate: {
                canton: true,
              }
            },
            experience: true,
            languages: true,
            education: true,
            canton: true,
            profilePicture: true,
            resume: true,
            frameworkContract: true,
            preferences: {
              populate: {
                industries: true,
                preferredLocationOfWork: true,
                skills: true,
                locations: true,
              }
            },
          }
        };
        console.dir(customQuery, { depth: 10 });
        const { data, meta } = await super.find({ ...ctx, query: customQuery });
        return { data, meta };
      } else {
        console.log('Tempering consultants response, returning filtered consultants');
      }

      if (!clientId) {
        console.log('No client ID found in request, returning normal results');
        return super.find(ctx);
      }

      try {
        const consultantUserIdsToExclude = await this.consultantUserIdsToExclude(ctx);
        console.log("consultantUserIdsToExclude", consultantUserIdsToExclude);

        // Construct the filters properly
        let customQuery = {
          ...query,
          filters: {
            ...query.filters,
            isDeleted: false,
          },
          populate: {
            canton: true,
            profilePicture: true,
            resume: true,
            preferences: {
              populate: {
                industries: true,
                preferredLocationOfWork: true,
                skills: true,
                locations: true,
              }
            },
          }
        };
        if (customQuery.filters.consultant_id === '') {
          delete customQuery.filters.consultant_id;
        }
        // Add the exclusion filter if there are IDs to exclude
        if (consultantUserIdsToExclude.size > 0) {
          customQuery.filters.$and = customQuery.filters.$and || [];
          customQuery.filters.$and.push({
            id: {
              $notIn: Array.from(consultantUserIdsToExclude)
            }
          });
        }

        // Preserve existing $and conditions if any
        if (query.filters?.$and) {
          customQuery.filters.$and = [
            ...customQuery.filters.$and,
            ...query.filters.$and
          ];
        }

        console.dir(customQuery, { depth: 10 });
        const { data, meta } = await super.find({ ...ctx, query: customQuery });
        return { data, meta };

      } catch (error) {
        console.error('Error in consultant find controller:', error);
        return super.find(ctx);
      }
    },
    async findOne(ctx) {
      const stateUserId = ctx.state?.user?.id;
      const contextUserId = ctx.user?.id;
      const clientId = stateUserId || contextUserId;
      const users = await this.consultantUserIdsToExclude(ctx);
      const { id } = ctx.params;
      const consultant = await strapi.service("api::consultant.consultant").findOne(id, {
        populate: {
          bankingInfo: {
            populate: {
              canton: true,
            }
          },
          experience: true,
          languages: true,
          education: true,
          canton: true,
          profilePicture: true,
          resume: true,
          frameworkContract: true,
          preferences: {
            populate: {
              industries: true,
              preferredLocationOfWork: true,
              skills: true,
              locations: true,
            }
          },
        }
      });

      if (!consultant || consultant.isDeleted) {
        return ctx.notFound('Consultant not found');
      }

      const calculation = calculatePercentageCompletion(consultant);
      return { ...consultant, ...calculation, isWorkingWithCurrentClient: users.has(consultant.id) };
    },
    async updateConsultantStatus(ctx) {
      const { id } = ctx.params;
      const { approved } = ctx.request.body;
      if (!id) {
        return ctx.badRequest("Please provide an ID.");
      }
      if (!approved) {
        return ctx.badRequest("Please provide status.");
      }
      try {
        console.log("Updating consultant status...", id);
        const existingConsultant = await strapi.entityService.findOne(
          "api::consultant.consultant",
          ctx.params.id,
        );
        if (!existingConsultant) {
          console.log("Consultant not found.");
          return ctx.notFound("Consultant not found.");
        }
        const updatedConsultant = await strapi.entityService.update(
          "api::consultant.consultant",
          id,
          {
            data: {
              approved,
            },
          }
        );
        ctx.send(updatedConsultant);
      } catch (error) {
        console.log(error);
        ctx.internalServerError(error.message);
      }
    },
    async fillExtraInfo(ctx) {
      try {
        const stateUserId = ctx.state?.user?.id;
        const contextUserId = ctx.user?.id;
        const userId = stateUserId || contextUserId;
        const consultant = await strapi.entityService.findMany("api::consultant.consultant", {
          filters: { user: userId },
          limit: 1,
        });
        const { id } = consultant[0];
        const consultantData = ctx.request.body.consultantData;
        const updatedConsultant = await userService.updateConsultant(
          id,
          { consultantData },
        );
        console.dir(updatedConsultant, { depth: 10 });
        const signingData = await strapi.service("api::consultant.consultant").handleStartSigning(updatedConsultant?.consultant, userId);
        ctx.send(signingData);
      } catch (error) {
        console.log(error);
        ctx.internalServerError(error.message);
      }

    },
    async update(ctx) {
      const { id } = ctx.params; // Get the ID of the consultant to be updated
      let consultantData;
      try {
        const rawData = ctx.request.body.consultantData || {};
        consultantData = JSON.parse(rawData);
      } catch (error) {
        console.error("Failed to parse consultant data:", error, ctx.request.body.consultantData);
        return ctx.badRequest("Invalid JSON format in consultant data.");
      }
      if (!consultantData || typeof consultantData !== 'object' || !consultantData.email) {
        return ctx.badRequest("Consultant data is missing required fields.");
      }
      const { email } = consultantData;
      const { files } = ctx.request;
      // console.log("123", consultantData, "consultantData", id, "id", email, "email, files", files, "files");
      if (!id) {
        console.log("Please provide an ID.");
        return ctx.badRequest("Please provide an ID.");
      }

      if (!email) {
        console.log("Please provide email.");
        return ctx.badRequest("Please provide email.");
      }

      try {
        console.log("Updating consultant...", id);
        const existingConsultant = await strapi.entityService.findOne(
          "api::consultant.consultant",
          ctx.params.id,
          {
            populate: "*",
          }
        );
        if (!existingConsultant) {
          console.log("Consultant not found.");
          return ctx.notFound("Consultant not found.");
        }
        // console.log("456", consultantData, "consultantData", id, "id", email, "email, files", files, "files");
        // Update the user and consultant data
        const updatedConsultant = await userService.updateConsultant(
          id,
          { email, consultantData },
          files
        );

        ctx.send(updatedConsultant);
      } catch (error) {
        console.log(error);
        ctx.internalServerError(error.message);
      }
    },
    async create(ctx) {
      const requiredFields = [
        'firstName',
        'lastName',
        'email',
        'dob',
        'resume'
      ];

      const consultantData = JSON.parse(ctx.request.body.consultantData || '{}');
      let { email } = consultantData;
      const { files } = ctx.request;

      if (!email) {
        return ctx.badRequest("Please provide email.");
      }

      const missingFields = requiredFields.filter(field => {
        if (field === 'resume') {
          return !files?.resume;
        }
        return !consultantData[field];
      });

      if (missingFields.length > 0) {
        return ctx.badRequest(
          `Missing required fields: ${missingFields.join(', ')}`
        );
      }

      const username = email.split("@")[0];
      const result = await userService.createUserAndConsultant(
        { username, email, consultantData },
        files
      );
      ctx.send(result);
    },
    async delete(ctx) {
      const { id } = ctx.params;

      try {
        const consultant = await strapi.entityService.findOne(
          'api::consultant.consultant',
          id,
          {
            populate: ['user', 'profilePicture', 'resume', 'attachment', 'frameworkContract']
          }
        );

        if (!consultant) {
          return ctx.notFound('Consultant not found');
        }

        const userId = consultant.user?.id;

        await strapi.entityService.update('api::consultant.consultant', id, {
          data: {
            deletedUserData: consultant.user,
            isDeleted: true,
          },
        });

        const filesToDelete = [
          consultant.profilePicture,
          consultant.resume,
          consultant.frameworkContract,
          ...(consultant.attachment || [])
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
          message: 'Consultant and associated user deleted successfully'
        });

      } catch (error) {
        console.error('Error deleting consultant:', error);
        return ctx.throw(500, error);
      }
    },
    async findConsultantByUser(ctx) {
      const { userId } = ctx.params;
      const { populate } = ctx.query;

      if (!userId) {
        return ctx.badRequest("Please provide a user ID.");
      }

      let populateObj = {};
      try {
        if (populate) {
          populateObj = JSON.parse(populate);
        }
      } catch (error) {
        return ctx.badRequest("Invalid populate parameter format.");
      }

      try {
        const consultant = await strapi.db.query("api::consultant.consultant").findOne({
          where: { user: userId },
          populate: [
            "profilePicture",
            "attachment",
            "bankingInfo",
            "experience",
            "languages",
            "education",
            "preferences",
            "preferences.locations",
            "preferences.industries",
            "preferences.skills",
            "preferences.preferredLocationOfWork",
            "canton",
          ],
        });

        if (!consultant) {
          return ctx.notFound("Consultant not found.");
        }
        delete consultant.user;
        delete consultant.createdBy;
        delete consultant.updatedBy;
        ctx.send(consultant);
      } catch (error) {
        console.log(error);
        ctx.internalServerError(error.message);
      }
    },
    async signByConsultant(ctx) {
      console.log("Enter signByConsultant");
      let { envelopeId } = ctx.request.body;
      const stateUserId = ctx.state?.user?.id;
      const contextUserId = ctx.user?.id;
      const userId = stateUserId || contextUserId;
      const consultant = await strapi.entityService.findMany("api::consultant.consultant", {
        filters: { user: userId },
        limit: 1,
      });
      const { id } = consultant[0];
      try {
        if (envelopeId === "ENVELOPE_ID") {
          const signResponse = await strapi.service("api::consultant.consultant").handleFinishSigning(userId, id);
          ctx.send(signResponse);
        } else {
          const existingConsultant = await strapi.entityService.findOne(
            "api::consultant.consultant",
            id,
            {
              populate: ["preferences", "frameworkContract", "canton"],
            }
          );
          console.log()
          const signingData = await strapi.service("api::consultant.consultant").handleStartSigning(existingConsultant, userId);
          ctx.send(signingData);
        }
      } catch (error) {
        console.error("Error in update offer:", error);
        ctx.badRequest(null, [{ messages: [{ id: "offer.update.error", message: error.message }] }]);
      }
    },
  })
);
