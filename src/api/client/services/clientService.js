"use strict";

const util = require("../../../utils/util");

module.exports = {
  async updateClient(id, { email, clientData }, files) {
    try {
      console.log(
        "updateClient",
        id,
        "id",
        email,
        "email",
        clientData,
        "clientData",
        files,
        "files"
      );

      let client;
      delete clientData.email;
      delete clientData.attachment;

      // Handle logo upload
      if (files && files?.logo) {
        const uploadedFiles = await strapi.plugins[
          "upload"
        ].services.upload.upload({
          data: {
            refId: id,
            ref: "api::client.client",
            field: "logo",
          },
          files: files?.logo,
        });
        client = await strapi.service("api::client.client").update(id, {
          data: {
            logo: uploadedFiles[0]?.id,
            ...clientData,
          },
        });
      } else {
        client = await strapi.service("api::client.client").update(id, {
          data: {
            ...clientData,
          },
        });
      }

      if (files && files?.attachment) {
        // Handle multiple attachments
        const attachmentFiles = Object.keys(files)
          ?.filter((key) => key.startsWith("attachment["))
          ?.map((key) => files[key]);

        const existingClient = await strapi
          .service("api::client.client")
          .findOne(id, { populate: ["attachments"] });

        const existingAttachments = Array.isArray(existingClient.attachments)
          ? existingClient.attachments.map((attachment) => attachment.id)
          : [];
        const newAttachments = [...existingAttachments];

        if (attachmentFiles.length > 0) {
          for (const file of attachmentFiles) {
            const uploadedFile = await strapi.plugins[
              "upload"
            ].services.upload.upload({
              data: {
                refId: id,
                ref: "api::client.client",
                field: "attachment",
              },
              files: file,
            });
            newAttachments.push(uploadedFile[0].id);
          }
        }

        await strapi.service("api::client.client").update(id, {
          data: {
            attachments: newAttachments,
          },
        });
      }

      return { client };
    } catch (error) {
      return util.handleErrorResponse(error);
    }
  },
  async createUserClientOrSubClient(data, files) {
    if (!data.clientData) {
      return util.handleErrorResponse("Client data is required");
    }
    if (!data.clientData.email) {
      return util.handleErrorResponse("Client email is required");
    }
    if (!data.clientData.parentClient) {
      //if client id not passed that mean that we are creating client
      return this.createUserAndClient(data, files, "L3");
    } else {
      // if we have client id that means we are creating subclient
      // check if client id exists
      const client = await strapi
        .service("api::client.client")
        .findOne(data.clientData.parentClient);
      if (!client) {
        return util.handleErrorResponse("Client not found");
      }
      return this.createUserAndClient(data, files, "L4");
    }
  },
  async createUserAndClient(data, files, defaultRole) {
    let existingUser;
    try {
      const { username, email, clientData } = data;

      const chars =
        "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
      let password = "";
      for (let i = 0; i < 8; i++) {
        const randomIndex = Math.floor(Math.random() * chars.length);
        password += chars[randomIndex];
      }

      const hashedPassword = await strapi
        .service("admin::auth")
        .hashPassword(password);
      const role = await strapi
        .query("plugin::users-permissions.role")
        .findOne({
          where: { name: defaultRole },
        });

      if (!role) {
        return util.handleErrorResponse("Role not found");
      }

      existingUser = await strapi
        .query("plugin::users-permissions.user")
        .findOne({
          where: { email },
        });

      if (existingUser) {
        return util.handleErrorResponse("User with this email already exists");
      }

      const user = await strapi.query("plugin::users-permissions.user").create({
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
          user: user.id,
          tempPassword: password,
        },
      });

      const client = await strapi.service("api::client.client").create({
        data: {
          ...clientData,
          client_id: defaultRole + util.generateUniqueIdByEmail(user.email),
          user: user.id,
          parentClient: clientData.parentClient || null,
        },
      });

      if (files && files.logo) {
        const uploadedFiles = await strapi.plugins[
          "upload"
        ].services.upload.upload({
          data: {
            refId: client.id,
            ref: "api::client.client",
            field: "logo",
          },
          files: files.logo,
        });

        await strapi.service("api::client.client").update(client.id, {
          data: {
            logo: uploadedFiles[0].id,
          },
        });
      }

      // Handle multiple attachments
      const attachmentFiles = files
        ? Object.keys(files)
          .filter((key) => key.startsWith("attachment["))
          .map((key) => files[key])
        : [];

      if (attachmentFiles.length > 0) {
        const uploadedAttachments = [];
        for (const file of attachmentFiles) {
          const uploadedFile = await strapi.plugins[
            "upload"
          ].services.upload.upload({
            data: {
              refId: client.id,
              ref: "api::client.client",
              field: "attachment",
            },
            files: file,
          });
          uploadedAttachments.push(uploadedFile[0].id);
        }
        await strapi.service("api::client.client").update(client.id, {
          data: {
            attachments: uploadedAttachments,
          },
        });
      }

      console.log(client);
      console.log(
        "**-**temporarily stopped email plugin until email SMTP fixed**-** ",
        `Your account has been created. Your temporary password is ${password}. Please change your password upon first login.`
      );

      try {
        await util.sendWelcomeEmail(email, client.accountOwnerFirstName + ' ' + client.accountOwnerLastName, password);
      } catch (error) {
        console.error(error);
        return util.handleErrorResponse(error);
      }

      return { user, client, password };
    } catch (error) {
      if (existingUser?.id) {
        await strapi.query("api::consultant.consultant").delete({
          where: { user: existingUser.id },
        });
      }
      console.log(error, JSON.stringify(error));
      return util.handleErrorResponse(error);
    }
  },
  async getSubClientsIds(clientId) {
    try {
      console.log("getSubClientsIds", clientId);
      const subClients = await strapi.entityService.findMany("api::client.client", {
        filters: { parentClient: clientId },
        fields: ["id"],
      });
      return subClients.map((subClient) => subClient.id);
    } catch (error) {
      return util.handleErrorResponse(error);
    }
  }
};
