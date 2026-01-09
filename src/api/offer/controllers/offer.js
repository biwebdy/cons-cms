// @ts-nocheck
"use strict";

const { createCoreController } = require("@strapi/strapi").factories;
const docusignService = require("../../../utils/docusign");
const fs = require('fs');
const path = require('path');
const config = require('../../../../config/docusign');
const util = require("../../../utils/util");
const clientService = require("../../client/services/clientService");
module.exports = createCoreController("api::offer.offer", ({ strapi }) => ({
  async signByClient(ctx) {
    const stateUserId = ctx.state?.user?.id;
    const contextUserId = ctx.user?.id;
    const userId = stateUserId || contextUserId;
    const { id } = ctx.params;
    console.log("Update offer signByClient");
    let { status, envelopeId } = ctx.request.body;
    if (status !== "SigningStartedByClient" && status !== "SigningCompletedByClient") {
      ctx.badRequest(null, [{ messages: [{ id: "offer.update.error", message: "Updated denied! Wrong Status." }] }]);
      return;
    }

    try {
      if (status === "SigningCompletedByClient") { // save the pdf file
        const esignature = await strapi.entityService.findMany("api::esignature.esignature", {
          filters: { user: userId },
          sort: "createdAt:desc",
          limit: 1,
        });
        await strapi.entityService.delete("api::esignature.esignature", esignature[0].id);
        envelopeId = esignature[0].object.envelopeId;
        const offerId = esignature[0].object.offerId;
        if (!envelopeId) {
          ctx.badRequest(null, [{ messages: [{ id: "offer.update.error", message: "Envelope ID is missing." }] }]);
          return;
        }
        const uploadedFileId = await docusignService.retrieveSignedDocumentAndUpload(envelopeId);
        const updatedOffer = await strapi.entityService.update('api::offer.offer', offerId, {
          populate: ["offerContract", "proposal", "proposal.client", "proposal.consultant", "proposal.consultant.user"],
          data: {
            status: "SigningCompletedByClient",
            offerContract: uploadedFileId,
            offerEnvelopID: envelopeId,
            signingCompletedAt: new Date()
          }
        });

        ctx.send({ updatedOffer });
      } else {
        const updatedOffer = await strapi.entityService.update("api::offer.offer", id, {
          populate: ["offerContract", "proposal", "proposal.client", "proposal.client.parentClient", "proposal.client.parentClient.canton", "proposal.client.canton", "proposal.consultant", "proposal.consultant.education", "proposal.consultant.experience"],
          data: {
            status: "SigningStartedByClient",
          },
        });
        const signingData = await this.handleSigning(ctx, updatedOffer);
        const stateUserId = ctx.state?.user?.id;
        const contextUserId = ctx.user?.id;
        const userId = stateUserId || contextUserId;
        await strapi.entityService.create("api::esignature.esignature", {
          data: {
            user: userId,
            object: {
              offerId: id,
              envelopeId: signingData.envelopeId,
            },
          },
        });
        ctx.send({ doccuSign: signingData });
      }
    } catch (error) {
      console.error("Error in update offer:", error);
      ctx.badRequest(null, [{ messages: [{ id: "offer.update.error", message: error.message }] }]);
    }
  },

  async updateByClient(ctx) {

    const { offerID } = ctx.params;

    const { status, title } = ctx.request.body;

    const { files } = ctx.request;
    if (status !== "AcceptedByClient" && status !== "RejectedByClient" && status !== "POSubmitted") {
      ctx.badRequest(null, [{ messages: [{ id: "offer.update.error", message: "Updated denied! Wrong Status." }] }]);
      return;
    }

    try {
      if (files && files.purchaseOrder && status === "POSubmitted") {
        const uploadedFiles = await strapi.plugins[
          "upload"
        ].services.upload.upload({
          data: {
            refId: offerID,
            ref: "api::consultant.consultant",
            field: "purchaseOrder",
          },
          files: files.purchaseOrder,
        });
        const updatedOffer = await strapi.service("api::offer.offer").update(offerID, {
          populate: ["proposal", "proposal.consultant", "proposal.client", "proposal.client.canton"],
          data: {
            status: status,
            title: title,
            purchaseOrder: uploadedFiles[0].id,
          },
        });

        await strapi.entityService.update("api::proposal.proposal", updatedOffer.proposal.id, {
          data: {
            status: "PendingL1Approval",
          },
        });

        ctx.send(updatedOffer);
      } else if (status === "RejectedByClient") {
        const updatedOffer = await strapi.service("api::offer.offer").update(offerID, {
          populate: ["proposal", "proposal.consultant", "proposal.client"],
          data: {
            status: status,
            title: title,
          },
        });
        const proposal = await strapi.entityService.update('api::proposal.proposal', updatedOffer.proposal.id, {
          data: {
            status: "RejectedByClient",
          },
        });

        await util.sendOfferStatusChangeEmailByClient(updatedOffer, status);
        ctx.send(updatedOffer);
      } else {
        const updatedOffer = await strapi.service("api::offer.offer").update(offerID, {
          populate: ["proposal", "proposal.consultant", "proposal.client"],
          data: {
            status: status,
            title: title,
          },
        });
        await util.sendOfferStatusChangeEmailByClient(updatedOffer, status);
        ctx.send(updatedOffer);
      }
    } catch (error) {
      console.error("Error in update offer:", error);
      ctx.badRequest(null, [{ messages: [{ id: "offer.update.error", message: error.message }] }]);
    }
  },

  async updateByAdmin(ctx) {
    const { id } = ctx.params;
    const { status } = ctx.request.body;
    if (status !== "AcceptedByAdmin" && status !== "RejectedByAdmin" && status !== "POApprovedByAdmin") {
      ctx.badRequest(null, [{ messages: [{ id: "offer.update.error", message: "Updated denied! Wrong Status." }] }]);
      return;
    }
    try {
      let updatedOffer;

      if (status === "ApprovedByAdmin") {

        updatedOffer = await strapi.entityService.update("api::offer.offer", id, {
          populate: ["offerContract", "proposal", "proposal.client", "proposal.client.canton", "proposal.consultant"],
          data: {
            status: "PendingConsultantSigning",
          },
        });
        await strapi.entityService.update("api::proposal.proposal", updatedOffer.proposal.id, {
          data: {
            status: "PendingConsultantSigning",
          },
        });
      } else if (status === "POApprovedByAdmin") {
        try {
          updatedOffer = await strapi.entityService.update("api::offer.offer", id, {
            populate: ["offerContract", "proposal", "proposal.client", "proposal.client.canton", "proposal.consultant", "proposal.consultant.user"],
            data: {
              status: "POApprovedByAdmin",
            },
          });

          // make sure to update the proposal status for the consultant to sign
          await strapi.entityService.update("api::proposal.proposal", updatedOffer.proposal.id, {
            data: {
              status: "PendingConsultantSigning",
            },
          });

          await util.sendMissionContractSigningEmail(updatedOffer.proposal);
        } catch (emailError) {
          console.error('Error sending mission contract signing email:', emailError);
        }

        ctx.send(updatedOffer);

      } else {
        updatedOffer = await strapi.entityService.update("api::offer.offer", id, {
          populate: ["offerContract", "proposal", "proposal.client", "proposal.client.canton", "proposal.consultant"],
          data: {
            status
          },
        });
        ctx.send(updatedOffer);
      }
    } catch (error) {
      console.error("Error in update offer:", error);
      ctx.badRequest(null, [{ messages: [{ id: "offer.update.error", message: error.message }] }]);
    }
  },

  async handleSigning(ctx, offer) {
    try {
      const clientObj = offer.proposal.client.parentClient
        ? offer.proposal.client.parentClient
        : offer.proposal.client;
      console.log("signing offer contract: client: ", clientObj);
      // Extract data from the appropriate client object
      const { email, id } = clientObj;
      const { accountOwnerFirstName, accountOwnerLastName, name } = clientObj;
      const clientFullDetails = `${name}, ${clientObj.street} ${clientObj.number}, ${clientObj.areaPostalCodes} ${clientObj?.commune}, ${clientObj?.canton?.name}, ${clientObj.country}`;

      const consultantName = offer.proposal.consultant.firstName + " " + offer.proposal.consultant.lastName;
      const lastEducation = (() => {
        if (!offer?.proposal?.consultant?.education || !Array.isArray(offer.proposal.consultant.education)) {
          return "N/A";
        }

        const educationArray = offer.proposal.consultant.education;
        if (educationArray.length === 0) {
          return "N/A";
        }

        const lastEducationEntry = educationArray[educationArray.length - 1];
        return lastEducationEntry?.title || "N/A";
      })();
      const lastExperience = offer.proposal.typeOfWork;
      const missionLocation = offer.proposal.missionLocation;
      const startDate = this.formatDate(offer.proposal.startDate);
      const endDate = this.formatDate(offer.proposal.endDate);
      const fees = offer.proposal.fees;
      const paymentDeadline = "TBD LATER"
      const signingData = await docusignService.sendOfferForSignature(
        {
          name: accountOwnerFirstName + ' ' + accountOwnerLastName,
          email,
          clientFullDetails,
          consultantName,
          lastEducation,
          lastExperience,
          missionLocation,
          startDate,
          endDate,
          fees,
          paymentDeadline
        }
        , id);

      return signingData;
    } catch (error) {
      console.error("Error in update offer:", error);
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
  async getOffersForClientAndSubClient(ctx) {

    const { id } = ctx.params;

    const subClientIds = await clientService.getSubClientsIds(id);


    // Ensure we get proposal with client and consultant in the response
    if (!ctx.query.populate) ctx.query.populate = {};
    ctx.query.populate.proposal = {
      populate: ['client', 'consultant']
    };

    // Add filter to get only offers where proposal.client is in the array of subClientIds
    if (!ctx.query.filters) ctx.query.filters = {};
    ctx.query.filters.proposal = {
      client: { id: { $in: [...subClientIds, id] } }
    };

    // Fetch all offers with the updated filter
    const { data, meta } = await super.find(ctx);

    console.log("Total offers found:", data.length);
    return data;
  },
}));
