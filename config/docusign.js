module.exports = {
  docusign: {
    accountId: process.env.ACCOUNT_ID,
    basePath: process.env.BASE_PATH,
    integrationKey: process.env.INTEGRATION_KEY,
    userId: process.env.USER_ID,
    clientUserId: process.env.CLIENT_USER_ID,
    missiontemplateId: process.env.MISSION_TEMPLATE_ID,
    offerTemplateId: process.env.OFFER_TEMPLATE_ID,
    frameworkTemplateId: process.env.FRAMEWORK_TEMPLATE_ID,
    privateKey: process.env.PRIVATE_KEY,
    offerRedirectUri: process.env.OFFER_REDIRECT_URI,
    frameworkRedirectUri: process.env.FRAMEWORK_REDIRECT_URI,
    proposalRedirectUri: process.env.PROPOSAL_REDIRECT_URI
  }
};