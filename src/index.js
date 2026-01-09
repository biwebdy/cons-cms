"use strict";

const { sendWelcomeEmail } = require("./utils/util");

module.exports = {
  /**
   * An asynchronous register function that runs before
   * your application is initialized.
   *
   * This gives you an opportunity to extend code.
   */
  async register({ strapi }) {
    // Getting all the users permissions routes
    // try {
    //   await sendWelcomeEmail('kaltimany@gmail.com', 'kaltimany@gmail.com', 'TestPassword');
    //   console.log('Email sent successfully!');
    // } catch (error) {
    //   console.error(error);
    // }
    const userRoutes =
      strapi.plugins["users-permissions"].routes["content-api"].routes;
    // Set the UUID for our middleware
    const isUserOwnerMiddleware = "global::user-find-many";
    const isUserCanUpdateMiddleware = "global::user-can-update";

    // Find the route where we want to inject the middleware
    const findUser = userRoutes.findIndex(
      (route) => route.handler === "user.find" && route.method === "GET"
    );

    // Find the route where we want to inject the middleware
    const updateUser = userRoutes.findIndex(
      (route) => route.handler === "user.update" && route.method === "PUT"
    );

    // helper function that will add the required keys and set them accordingly
    function initializeRoute(routes, index) {
      routes[index].config.middlewares = routes[index].config.middlewares || [];
      routes[index].config.policies = routes[index].config.policies || [];
    }

    // Check if we found the find one route if so push our middleware on to that route
    if (findUser) {
      initializeRoute(userRoutes, findUser);
      userRoutes[findUser].config.middlewares.push(isUserOwnerMiddleware);
    }

    // Check if we found the find one route if so push our middleware on to that route
    if (updateUser) {
      initializeRoute(userRoutes, updateUser);
      userRoutes[updateUser].config.middlewares.push(isUserCanUpdateMiddleware);
    }

    console.log(userRoutes[findUser]);
  },

  /**
   * An asynchronous bootstrap function that runs before
   * your application gets started.
   *
   * This gives you an opportunity to set up your data model,
   * run jobs, or perform some special logic.
   */
  async bootstrap(/*{ strapi }*/) {
    // console.log("Bootstrap function ", process.env.FIRST_RUN);
    const firstRun = JSON.parse(process.env.FIRST_RUN || "false");
    if (firstRun) {
      const skills = [
        { name: "Project Management" },
        { name: "Regulatory Affairs" },
        { name: "Facility, Equipment and Utilities Maintenance" },
        { name: "Quality Management Systems" },
        { name: "Quality Assurance for Quality Control (QA for QC)" },
        { name: "Automation" },
        { name: "Equipment Commissioning, Qualification and Validation" },
        { name: "Computerized System Validation" },
        { name: "Process Validation" },
        { name: "Analytical Method Validation" },
        { name: "Laboratory Management" },
        { name: "Cleaning and Sterilization Validation" },
        { name: "Manufacturing Science and Technology (MSAT)" },
        { name: "Quality Assurance for Operations (e.g. Batch Records)" },
        { name: "Process Engineer" },
        { name: "Downstream Process Engineer" },
        { name: "Upstream Process Engineer" },
        { name: "Training Specialist" },
        { name: "Auditing" },
        { name: "Remediation" },
      ];

      const industries = [
        { name: "Pharmaceutical" },
        { name: "Biotechnology" },
        { name: "Medical Devices" },
        { name: "Chemistry" },
        { name: "Cosmetics" },
        { name: "Agri-Food" },
      ];

      const daysAvailable = [
        { name: "Monday" },
        { name: "Tuesday" },
        { name: "Wednesday" },
        { name: "Thursday" },
        { name: "Friday" },
        { name: "Saturday" },
        { name: "Sunday" },
      ];

      const cantons = [
        { name: "Aargau" },
        { name: "Appenzell Ausserrhoden" },
        { name: "Appenzell Innerrhoden" },
        { name: "Basel-Landschaft" },
        { name: "Basel-Stadt" },
        { name: "Bern" },
        { name: "Fribourg" },
        { name: "Geneva" },
        { name: "Glarus" },
        { name: "Graubünden" },
        { name: "Jura" },
        { name: "Lucerne" },
        { name: "Neuchâtel" },
        { name: "Nidwalden" },
        { name: "Obwalden" },
        { name: "Schaffhausen" },
        { name: "Schwyz" },
        { name: "Solothurn" },
        { name: "St. Gallen" },
        { name: "Thurgau" },
        { name: "Ticino" },
        { name: "Uri" },
        { name: "Valais" },
        { name: "Vaud" },
        { name: "Zug" },
        { name: "Zurich" },
      ];

      for (const canton of cantons) {
        const existingCanton = await strapi.db.query('api::canton.canton').findOne({ where: { name: canton.name } });
        if (!existingCanton) {
          await strapi.db.query('api::canton.canton').create({ data: { ...canton, isActive: true } });
        }
      }

      for (const skill of skills) {
        const existingSkill = await strapi.db.query('api::skill.skill').findOne({ where: { name: skill.name } });
        if (!existingSkill) {
          await strapi.db.query('api::skill.skill').create({ data: { ...skill, isActive: true } });
        }
      }
      for (const industry of industries) {
        const existingIndustry = await strapi.db.query('api::industry.industry').findOne({ where: { name: industry.name } });
        if (!existingIndustry) {
          await strapi.db.query('api::industry.industry').create({ data: { ...industry, isActive: true } });
        }
      }
      for (const day of daysAvailable) {
        const existingDay = await strapi.db.query('api::day.day').findOne({ where: { name: day.name } });
        if (!existingDay) {
          await strapi.db.query('api::day.day').create({ data: { ...day, isActive: true } });
        }
      }
    }
  }
};
