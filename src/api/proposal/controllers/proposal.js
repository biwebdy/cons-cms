// @ts-nocheck
"use strict";

const { createCoreController } = require("@strapi/strapi").factories;
const docusignService = require("../../../utils/docusign");
const fs = require('fs');
const path = require('path');
const config = require('../../../../config/docusign');
const util = require("../../../utils/util");
const consultant = require("../../consultant/controllers/consultant");
const userService = require("../../consultant/services/userService");
const clientService = require("../../client/services/clientService");
module.exports = createCoreController("api::proposal.proposal", ({ strapi }) => ({
  async find(ctx) {
    console.log("------- find proposal");
    return super.find(ctx);
  },

  async getSubClientProposals(ctx) {
    const { id } = ctx.params;
    const subClientIds = await clientService.getSubClientsIds(id);
    console.log("subClientsIds", subClientIds);

    // Ensure we get client in the response
    if (!ctx.query.populate) ctx.query.populate = {};
    ctx.query.populate.client = true;
    ctx.query.populate.consultant = true;

    // Fetch all proposals without client filter
    const originalQuery = { ...ctx.query };
    delete ctx.query.filters?.client; // Remove client filter if present

    // Get all proposals
    const { data, meta } = await super.find(ctx);

    // Filter proposals based on subClientIds
    const filteredProposals = data.filter(proposal => {
      const clientId = proposal.attributes.client?.data?.id;
      return subClientIds.includes(clientId);
    });

    console.log("Total proposals found:", filteredProposals.length);
    return filteredProposals;
  },
  async create(ctx) {
    ctx.query = {
      ...ctx.query,
      populate: {
        consultant: {
          populate: ['user', 'preferences']
        },
        client: {
          populate: ['company']
        }
      }
    };

    const { data, meta } = await super.create(ctx);
    try {

      // Now data should already have consultant and client populated
      const consultant = data.attributes.consultant.data.attributes;
      const client = data.attributes.client.data.attributes;

      await util.sendProposalNotificationEmail(
        consultant,
        client,
        data.attributes
      );

      return { data, meta };

    } catch (error) {
      console.error('Error in proposal creation or email sending:', error);
    }
    return { data, meta };
  },
  async signByConsultant(ctx) {
    console.log("signByConsultant");
    const { id } = ctx.params;
    const stateUserId = ctx.state?.user?.id;
    const contextUserId = ctx.user?.id;
    const userId = stateUserId || contextUserId;
    let { status, envelopeId } = ctx.request.body;
    console.log("Update proposal signByConsultant", id, status);
    if (status !== "SigningStartedByConsultant" && status !== "SigningCompletedByConsultant") {
      ctx.badRequest(null, [{ messages: [{ id: "Proposal.update.error", message: "Updated denied! Wrong Status." }] }]);
      return;
    }
    const consultant = await strapi.entityService.findMany("api::consultant.consultant", {
      filters: { user: userId },
      limit: 1,
    });
    const { id: consId, frameworkContractEnvelopID } = consultant[0];
    if (frameworkContractEnvelopID === null) {
      return ctx.send({
        redirect: "PROJECT_INITIATION"
      });
    }

    try {
      let updatedProposal;
      if (id !== '0') {
        updatedProposal = await strapi.entityService.update("api::proposal.proposal", id, {
          populate: ["missionContract", "consultant", "consultant.canton", "client"],
          data: {
            status,
          },
        });
        if (updatedProposal === null) {
          ctx.badRequest(null, [{ messages: [{ id: "Proposal.update.error", message: "Updated denied! Wrong proposal ID." }] }]);
          return;
        }
      }
      // console.log("updatedProposal", updatedProposal);
      if (status === "SigningCompletedByConsultant") { // save the pdf file
        const esignature = await strapi.entityService.findMany("api::esignature.esignature", {
          filters: { user: userId },
          sort: "createdAt:desc",
          limit: 1,
        });
        await strapi.entityService.delete("api::esignature.esignature", esignature[0].id);
        envelopeId = esignature[0].object.envelopeId;
        const proposalId = esignature[0].object.proposalId;
        if (!envelopeId) {
          console.log("Envelope ID is missing.");
          ctx.badRequest(null, [{ messages: [{ id: "Proposal.update.error", message: "Envelope ID is missing." }] }]);
          return;
        }
        const uploadedFileId = await docusignService.retrieveSignedDocumentAndUpload(envelopeId);
        const updatedProposal = await strapi.entityService.update('api::proposal.proposal', proposalId, {
          populate: ["missionContract", "consultant.id", "consultant.user", "client", "offer.id"],
          data: {
            status: "ProposalCompleted",
            missionContract: uploadedFileId,
          }
        });
        try {
          await util.sendProjectLaunchEmail(updatedProposal, 'consultant');
          await util.sendProjectLaunchEmail(updatedProposal, 'client');
        } catch (emailError) {
          console.error('Error sending project launch emails:', emailError);
        }
        const existingProject = await strapi.entityService.findMany("api::project.project", {
          filters: { offer: updatedProposal.offer.id },
          limit: 1,
        });
        let project = null;
        if (existingProject.length === 0) {
          project = await strapi.entityService.create("api::project.project", {
            data: {
              consultant: updatedProposal.consultant.id,
              client: updatedProposal.client.id,
              offer: updatedProposal.offer.id,
            },
          });
        } else {
          project = await strapi.entityService.update("api::project.project", existingProject[0].id, {
            data: {
              consultant: updatedProposal.consultant.id,
              client: updatedProposal.client.id,
            },
          });
        }
        await strapi.entityService.update(
          "api::offer.offer",
          updatedProposal.offer.id,
          {
            data: {
              status: "ProjectStarted",
            },
          }
        );
        ctx.send({ updatedProposal });
      } else {
        const signingData = await this.handleSigning(ctx, updatedProposal);
        await strapi.entityService.create("api::esignature.esignature", {
          data: {
            user: userId,
            object: {
              envelopeId: signingData.envelopeId,
              proposalId: id,
            },
          },
        });
        ctx.send({ doccuSign: signingData, redirect: null });
      }
    } catch (error) {
      console.error("Error in update proposal:", error);
      ctx.badRequest(null, [{ messages: [{ id: "Proposal.update.error", message: error.message }] }]);
    }
  },

  async updateByConsultant(ctx) {
    const { id } = ctx.params;
    const {
      status, rejectionDetails, baseSalary,
      vacationAndPulicHolidayAllowance,
      totalHourlyWage,
      fees
    } = ctx.request.body;
    console.log("Update proposal updateByConsultant", id, status);
    if (status !== "AcceptedByConsultant" && status !== "RejectedByConsultant") {
      ctx.badRequest(null, [{ messages: [{ id: "Proposal.update.error", message: "Updated denied! Wrong Status." }] }]);
    }

    try {
      // Fetch the current proposal
      const currentProposal = await strapi.entityService.findOne("api::proposal.proposal", id, {
        populate: ["missionContract", "consultant", "client"],
      });

      if (!currentProposal) {
        ctx.badRequest(null, [{ messages: [{ id: "Proposal.update.error", message: "Proposal not found." }] }]);
      }

      // // Check if the current status is the same as the new status
      // if (currentProposal.status === status) {
      //   ctx.badRequest(null, [{ messages: [{ id: "Proposal.update.error", message: "The status is already set to the desired value." }] }]);
      // }

      let updatedProposal;
      if (status === "AcceptedByConsultant") {
        updatedProposal = await strapi.entityService.update("api::proposal.proposal", id, {
          populate: ["missionContract", "consultant", "consultant.preferences", "client"],
          data: {
            status,
            baseSalary,
            vacationAndPulicHolidayAllowance,
            totalHourlyWage,
            fees
          },
        });
        // Create a new offer based on the accepted proposal
        await strapi.entityService.create("api::offer.offer", {
          data: {
            proposal: updatedProposal.id,
            status: "Pending",
          },
        });
      } else {
        updatedProposal = await strapi.entityService.update("api::proposal.proposal", id, {
          populate: ["missionContract", "consultant", "consultant.preferences", "client"],
          data: {
            status,
            rejectionDetails
          },
        });
      }
      try {
        await util.sendProposalStatusChangeEmail(updatedProposal, status);
      } catch (error) {
        console.error("Error in update proposal:", error);
      }
      ctx.send(updatedProposal);
    } catch (error) {
      console.error("Error in update proposal:", error);
      ctx.badRequest(null, [{ messages: [{ id: "Proposal.update.error", message: error.message }] }]);
    }
  },

  async updateByAdmin(ctx) {
    const { id } = ctx.params;
    const { status } = ctx.request.body;
    console.log("Update proposal updateByAdmin", id, status);
    if (status !== "ApprovedByAdmin" && status !== "RejectedByAdmin") {
      ctx.badRequest(null, [{ messages: [{ id: "Proposal.update.error", message: "Updated denied! Wrong Status." }] }]);
      return;
    }
    try {
      // Fetch the current proposal
      const currentProposal = await strapi.entityService.findOne("api::proposal.proposal", id, {
        populate: ["missionContract", "consultant", "client"],
      });

      if (!currentProposal) {
        ctx.badRequest(null, [{ messages: [{ id: "Proposal.update.error", message: "Proposal not found." }] }]);
        return;
      }

      // Check if the current status is the same as the new status
      if (currentProposal.status === status) {
        ctx.badRequest(null, [{ messages: [{ id: "Proposal.update.error", message: "The status is already set to the desired value." }] }]);
        return;
      }

      let updatedProposal;
      console.log("updatedProposal", updatedProposal);
      if (status === "ApprovedByAdmin") {
        updatedProposal = await strapi.entityService.update("api::proposal.proposal", id, {
          populate: ["missionContract", "consultant", "client"],
          data: {
            status: "OfferCreated",
          },
        });
        // Create a new offer based on the accepted proposal
        const offer = await strapi.entityService.create("api::offer.offer", {
          data: {
            proposal: updatedProposal.id,
            status: "Pending",
          },
        });
        ctx.send({ updatedProposal, offer });
      } else {
        updatedProposal = await strapi.entityService.update("api::proposal.proposal", id, {
          populate: ["missionContract", "consultant", "client"],
          data: {
            status,
          },
        });
        ctx.send(updatedProposal);
      }
    } catch (error) {
      console.error("Error in update proposal:", error);
      ctx.badRequest(null, [{ messages: [{ id: "Proposal.update.error", message: error.message }] }]);
    }
  },

  async handleSigning(ctx, proposal) {
    console.log("signing mission contract", proposal);
    try {
      const { id } = proposal.consultant;
      const { name: companyName, accountOwnerFirstName, accountOwnerLastName, country, commune, areaPostalCodes, street } = proposal.client;
      const fullName = proposal.consultant.firstName + ' ' + proposal.consultant.lastName;
      const fullAddress = `${proposal.consultant.street} ${proposal.consultant.number}, ${proposal.consultant.areaPostalCodes} ${proposal.consultant?.commune}, ${proposal.consultant?.canton?.name}, ${proposal.consultant.country}`;
      const missionCompany = companyName;
      const missionLocation = proposal.missionLocation;
      const typeOfWork = proposal.typeOfWork;
      const formattedStartDate = this.formatDate(proposal.startDate);
      const formattedEndDate = this.formatDate(proposal.endDate);
      const missionStartDate = formattedStartDate;
      const missionDuration = `${formattedStartDate} to ${formattedEndDate}`;
      const missionBaseSalary = proposal.baseSalary;
      const missionVacationAndPubicHolidays = proposal.vacationAndPulicHolidayAllowance;
      const missionTotalHourlyWage = proposal.totalHourlyWage;
      const missionSigningDate = this.formatDate(proposal.consultant.frameworkContractSigningDate);
      const email = proposal.consultant.email;
      const name = proposal.consultant.firstName + ' ' + proposal.consultant.lastName;
      const employeeSignName = proposal.consultant.firstName + " " + proposal.consultant.lastName;
      const signingData = await docusignService.sendMissionContractForSignature({
        email,
        name,
        fullName,
        fullAddress,
        missionCompany,
        missionLocation,
        typeOfWork,
        missionStartDate,
        missionDuration,
        missionBaseSalary,
        missionVacationAndPubicHolidays,
        missionTotalHourlyWage,
        missionSigningDate,
        employeeSignName
      },
        id);

      return signingData;
    } catch (error) {
      console.error("Error in update proposal:", error);
      return null;
    }
  },
  formatDate(date) {
    let dateObject;
    if (typeof date === 'string') {
      const [year, month, day] = date.split('-').map(Number);
      dateObject = new Date(year, month - 1, day);
    } else if (date instanceof Date) {
      dateObject = date;
    } else {
      return 'N/A';
    }
    if (isNaN(dateObject.getTime())) {
      return 'N/A';
    }
    const options = { day: '2-digit', month: 'long', year: 'numeric' };
    return dateObject.toLocaleDateString('en-GB', options);
  },
  // Create proposal by L4
  async createBySubClient(ctx) {
    ctx.query = {
      ...ctx.query,
      populate: {
        consultant: {
          populate: ['user', 'preferences']
        },
        client: {
          populate: ['company']
        }
      }
    };
    const user = ctx.state.user;
    const { role } = user;
    if (role.name !== 'L4') {
      return ctx.forbidden('Only L4 users can create proposals through this endpoint');
    }

    console.log("ctx.request.body", ctx.request.body)

    const subClientId = ctx.request.body.data.client.id;

    console.log("subClientId", subClientId)
    // Fetch the subClient and its parent client
    const subClient = await strapi.entityService.findOne('api::client.client', subClientId, {
      populate: ['parentClient']
    });
    console.log("subClient", subClient)

    if (!subClient || !subClient.parentClient) {
      return ctx.badRequest('Invalid subClient or parent client not found');
    }

    const client = subClient.parentClient;
    console.log("client", client)

    const proposalData = {
      ...ctx.request.body.data,
      isL4Proposal: true,
      status: 'PendingL3Approval',
    };
    console.log("proposalData", proposalData)

    const proposal = await strapi.entityService.create('api::proposal.proposal', {
      data: proposalData,
      // populate: ['approvalHistory']
    });
    console.log("proposal", proposal)

    // // Add to approval history
    // await strapi.entityService.create('api::proposal.approval-history', {
    //   data: {
    //     action: 'Submitted',
    //     status: 'PendingL3Approval',
    //     actedBy: user.id,
    //     actedAt: new Date(),
    //     proposal: proposal.id
    //   }
    // });

    await util.sendProposalApprovalRequestEmail(client, subClient, proposal);

    return { data: proposal };
  },

  // L3 approval/rejection of L4 proposal
  async handleL3Approval(ctx) {
    console.log("Starting handleL3Approval function");
    const user = ctx.state.user;
    const { role } = user;

    console.log("user", user)
    console.log("role", role)
    if (role.name !== 'L3') {
      return ctx.forbidden('Only L3 users can approve/reject proposals');
    }

    const { id } = ctx.params;
    const { action, comment } = ctx.request.body;
    console.log("Proposal ID:", id);
    console.log("Action:", action);
    console.log("Comment:", comment);

    try {
      const proposal = await strapi.entityService.findOne('api::proposal.proposal', id, {
        populate: ['createdBy', 'approvalHistory', 'client', 'client.parentClient', 'consultant', 'consultant.preferences']
      });

      console.log("Fetched proposal:", JSON.stringify(proposal, null, 2));

      if (!proposal || !proposal.isL4Proposal) {
        console.log("L4 proposal not found, proposal:", proposal);
        return ctx.notFound('L4 proposal not found');
      }

      const newStatus = action === 'approve' ? 'Pending' : 'RejectedByL3';
      console.log("Setting new status:", newStatus);

      try {
        const updatedProposal = await strapi.entityService.update('api::proposal.proposal', id, {
          data: {
            status: newStatus,
            lastModifiedBy: user.id
          },

        });

        // Add to approval history
        // const approvalHistory = await strapi.entityService.create('api::proposal.approval-history', {
        //   data: {
        //     action: action === 'approve' ? 'Approved' : 'Rejected',
        //     status: newStatus,
        //     comment,
        //     actedBy: user.id,
        //     actedAt: new Date(),
        //     proposal: id
        //   }
        // });
        // console.log("Approval history created:", approvalHistory);

        const subClient = proposal.client;

        const consultant = proposal.consultant;


        // Debug the client lookup
        const client = subClient.parentClient || subClient.parent;


        if (action === 'approve') {
          console.log("Sending notification email to consultant...");
          await util.sendProposalNotificationEmail(
            consultant,
            client,
            proposal
          );
        }

        await util.sendProposalDecisionNotificationToSubClient(subClient, client, proposal, action === 'approve' ? 'approved' : 'rejected');

        return { data: updatedProposal };
      } catch (updateError) {
        console.error("Error during proposal update or history creation:", updateError);
        throw updateError;
      }
    } catch (error) {
      console.error("Error in handleL3Approval:", error);
      return ctx.throw(500, error);
    }
  },

  // Add feedback to proposal
  async addFeedback(ctx) {
    const user = ctx.state.user;
    const { id } = ctx.params;
    const { comment } = ctx.request.body;

    const proposal = await strapi.entityService.findOne('api::proposal.proposal', id, {
      populate: ['createdBy', 'approvalHistory']
    });

    if (!proposal) {
      return ctx.notFound('Proposal not found');
    }

    const feedback = await strapi.entityService.create('api::proposal.feedback', {
      data: {
        comment,
        providedBy: user.id,
        providedAt: new Date(),
        proposal: id
      }
    });

    // Add to approval history
    await strapi.entityService.create('api::proposal.approval-history', {
      data: {
        action: 'FeedbackProvided',
        status: proposal.status,
        comment,
        actedBy: user.id,
        actedAt: new Date(),
        proposal: id
      }
    });

    // TODO: Notify relevant users about the feedback

    return { data: feedback };
  },

  // Get proposal history
  async getProposalHistory(ctx) {
    const { id } = ctx.params;

    const proposal = await strapi.entityService.findOne('api::proposal.proposal', id, {
      populate: {
        approvalHistory: {
          populate: ['actedBy']
        },
        feedback: {
          populate: ['providedBy']
        }
      }
    });

    if (!proposal) {
      return ctx.notFound('Proposal not found');
    }

    return { data: proposal };
  }
}));
