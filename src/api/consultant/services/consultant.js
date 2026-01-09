'use strict';

/**
 * consultant service
 */

const { createCoreService } = require('@strapi/strapi').factories;
const docusignService = require("../../../utils/docusign");
module.exports = createCoreService('api::consultant.consultant', ({ strapi }) => ({
    async handleStartSigning(consultant, userId) {
        try {
            const { id } = consultant;
            const employeeFullName = consultant.firstName + " " + consultant.lastName;
            const employeeAddress = `${consultant.street} ${consultant.number}, ${consultant.areaPostalCodes} ${consultant?.commune}, ${consultant?.canton?.name}, ${consultant.country}`;
            const employeeDeduction = this.calculateDeduction(consultant);
            const email = consultant.email;
            // const employerPlaceAndDate = "Employer Place, " + new Date().toDateString();
            // const employeePlaceAndDate = `${consultant.street} ${consultant.number}, ${consultant.areaPostalCodes}` + new Date().toDateString();
            const employeeSignName = consultant.firstName + " " + consultant.lastName;
            const signingData = await docusignService.sendFramworkContractForSignature({ email, name: employeeFullName, employeeFullName, employeeAddress, employeeDeduction }, id);
            await strapi.entityService.create("api::esignature.esignature", {
                data: {
                    user: userId,
                    object: {
                        envelopeId: signingData.envelopeId,

                    },
                },
            });
            return { doccuSign: signingData };
        } catch (error) {
            console.error("Error in finsih handle signing framework contract: ", error);
            return null;
        }
    },
    async handleFinishSigning(userId, consID) {
        try {
            const esignature = await strapi.entityService.findMany("api::esignature.esignature", {
                filters: { user: userId },
                sort: "createdAt:desc",
                limit: 1,
            });
            await strapi.entityService.delete("api::esignature.esignature", esignature[0].id);
            const envelopeId = esignature[0].object.envelopeId;
            const uploadedFileId = await docusignService.retrieveSignedDocumentAndUpload(envelopeId);
            const updatedConsultant = await strapi.entityService.update('api::consultant.consultant', consID, {
                populate: ["frameworkContract"],
                data: {
                    frameworkContract: uploadedFileId,
                    frameworkContractEnvelopID: envelopeId,
                    frameworkContractSigningDate: new Date(),
                    isActive: true
                }
            });
            return { updatedConsultant };
        } catch (error) {
            console.error("Error in finsih handle signing framework contract: ", error);
            return null;
        }
    },
    calculateDeduction(consultant) {
        let dob = consultant.dob;
        //3.5% if between 25 and 34; 5% if betwen 35 and 44; 7,5% if between 45 and 54; and 9% if 55 and more
        let deduction = 'NULL';
        if (dob) {
            let age = new Date().getFullYear() - new Date(dob).getFullYear();
            if (age >= 25 && age <= 34) {
                deduction = '3.5000';
            } else if (age >= 35 && age <= 44) {
                deduction = '5.0000';
            } else if (age >= 45 && age <= 54) {
                deduction = '7.5000';
            } else if (age >= 55) {
                deduction = '9.0000';
            }
        }
        return deduction;
    },
}));

