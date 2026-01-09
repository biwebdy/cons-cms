"use strict";

const util = require("../../../utils/util");
const { calculatePercentageCompletion } = require("./percentage-completion");

module.exports = {
  async updateConsultant(id, { email, consultantData }, files) {
    try {
      console.log(
        "updateConsultant",
        id,
        "id",
        email,
        "email",
        consultantData,
        "consultantData",
        files,
        "files"
      );
      if (consultantData.approval) {
        const updatedConsultant = await strapi.service("api::consultant.consultant").update(id, {
          data: {
            approval: consultantData.approval
          },
        });
        try {
          if (consultantData.approval === "APPROVED") {
            await util.sendEmailForActivatedUser(email, updatedConsultant.firstName + ' ' + updatedConsultant.lastName);
          } else if (consultantData.approval === "REJECTED") {
            await util.sendConsultantRejectionEmail(email, updatedConsultant.firstName + ' ' + updatedConsultant.lastName);
          }
        } catch (error) {
          console.error(error);
        }
        return { consultant: updatedConsultant };
      }
      let consultant;
      delete consultantData.email;
      // Handle profile picture and resume upload
      let uploadedProfilePicture, uploadedResume;
      const updateData = { ...consultantData };

      if (files) {
        if (files.profilePicture) {
          uploadedProfilePicture = await strapi.plugins[
            "upload"
          ].services.upload.upload({
            data: {
              refId: id,
              ref: "api::consultant.consultant",
              field: "profilePicture",
            },
            files: files.profilePicture,
          });
          updateData.profilePicture = uploadedProfilePicture[0].id;
        }

        if (files.resume) {
          uploadedResume = await strapi.plugins[
            "upload"
          ].services.upload.upload({
            data: {
              refId: id,
              ref: "api::consultant.consultant",
              field: "resume",
            },
            files: files.resume,
          });
          updateData.resume = uploadedResume[0].id;
        }
      }

      consultant = await strapi
        .service("api::consultant.consultant")
        .update(id, {
          data: updateData,
        });

      // Handle multiple attachments
      const attachmentFiles = Object.keys(files || {})
        .filter((key) => key.startsWith("attachment["))
        .map((key) => files[key]);

      const existingConsultant = await strapi
        .service("api::consultant.consultant")
        .findOne(id, { populate: ["attachments"] });

      const existingAttachments = Array.isArray(existingConsultant.attachments)
        ? existingConsultant.attachments.map((attachment) => attachment.id)
        : [];
      const newAttachments = [...existingAttachments];

      if (attachmentFiles.length > 0) {
        for (const file of attachmentFiles) {
          const uploadedFile = await strapi.plugins[
            "upload"
          ].services.upload.upload({
            data: {
              refId: id,
              ref: "api::consultant.consultant",
              field: "attachment",
            },
            files: file,
          });
          newAttachments.push(uploadedFile[0].id);
        }
      }
      const updatedConsultant = await strapi.service("api::consultant.consultant").findOne(id, {
        populate: {
          bankingInfo: {
            populate: {
              canton: true,
            }
          },
          resume: true,
          experience: true,
          languages: true,
          education: true,
          canton: true,
          profilePicture: true,
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
      const calculation = calculatePercentageCompletion(updatedConsultant);
      console.log("Percentage completion:", calculation.percentageCompletion);
      await strapi.service("api::consultant.consultant").update(id, {
        data: {
          attachments: newAttachments,
          ...calculation
        },
      });

      return { consultant: { ...updatedConsultant, ...calculation } };
    } catch (error) {
      return util.handleErrorResponse(error);
    }
  },

  async createUserAndConsultant(data, files) {
    let existingUser;
    let newUser = null;
    try {
      const { username, consultantData } = data;
      const email = data.email.toLowerCase();

      const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
      let password = "";
      for (let i = 0; i < 8; i++) {
        const randomIndex = Math.floor(Math.random() * chars.length);
        password += chars[randomIndex];
      }

      const hashedPassword = await strapi.service("admin::auth").hashPassword(password);
      const role = await strapi.query("plugin::users-permissions.role").findOne({
        where: { name: "L5" },
      });

      if (!role) {
        return util.handleErrorResponse("Role not found");
      }

      existingUser = await strapi.query("plugin::users-permissions.user").findOne({
        where: { email },
      });

      if (existingUser) {
        return util.handleErrorResponse("User with this email already exists");
      }

      newUser = await strapi.query("plugin::users-permissions.user").create({
        data: {
          username,
          email,
          password: hashedPassword,
          provider: "local",
          role: role.id,
          confirmed: true,
          passwordChanged: false,
        },
      });

      await strapi.service("api::temp-user.temp-user").create({
        data: {
          user: newUser.id,
          tempPassword: password,
        },
      });

      const consultant = await strapi.service("api::consultant.consultant").create({
        data: {
          ...consultantData,
          consultant_id: 'L5' + util.generateUniqueIdByEmail(newUser.email), // email is already lower case
          isActive: false,
          user: newUser.id,
        },
      });

      if (files && files.profilePicture) {
        const uploadedFiles = await strapi.plugins["upload"].services.upload.upload({
          data: {
            refId: consultant.id,
            ref: "api::consultant.consultant",
            field: "profilePicture",
          },
          files: files.profilePicture,
        });

        await strapi.service("api::consultant.consultant").update(consultant.id, {
          data: {
            profilePicture: uploadedFiles[0].id,
          },
        });
      }
      if (files && files.resume) {
        const uploadedFiles = await strapi.plugins["upload"].services.upload.upload({
          data: {
            refId: consultant.id,
            ref: "api::consultant.consultant",
            field: "resume",
          },
          files: files.resume,
        });

        await strapi.service("api::consultant.consultant").update(consultant.id, {
          data: {
            resume: uploadedFiles[0].id,
          },
        });
      }

      const attachmentFiles = Object.keys(files)
        .filter((key) => key.startsWith("attachment["))
        .map((key) => files[key]);

      if (attachmentFiles.length > 0) {
        const uploadedAttachments = [];
        for (const file of attachmentFiles) {
          const uploadedFile = await strapi.plugins["upload"].services.upload.upload({
            data: {
              refId: consultant.id,
              ref: "api::consultant.consultant",
              field: "attachment",
            },
            files: file,
          });
          uploadedAttachments.push(uploadedFile[0].id);
        }
        await strapi.service("api::consultant.consultant").update(consultant.id, {
          data: {
            attachments: uploadedAttachments,
          },
        });
      }

      console.log(consultant);
      console.log(
        "**-**temporarily stopped email plugin until email SMTP fixed **-**",
        `Your account has been created. Your temporary password is ${password}. Please change your password upon first login.`
      );

      try {
        console.log("Sending welcome email to:", email, consultant.firstName + ' ' + consultant.lastName, password);
        await util.sendWelcomeEmail(email, consultant.firstName + ' ' + consultant.lastName, password);
      } catch (error) {
        console.error(error);
        return util.handleErrorResponse(error);
      }
      return { user: newUser, consultant, password };
    } catch (error) {
      if (newUser?.id) {
        await strapi.query("plugin::users-permissions.user").delete({
          where: { id: newUser.id },
        });
      }
      console.log(error, JSON.stringify(error));
      return util.handleErrorResponse(error);
    }
  }
};
