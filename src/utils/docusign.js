// @ts-nocheck
'use strict';

const docusign = require('docusign-esign');
const path = require('path');
const fs = require('fs');
const config = require('../../config/docusign');

// Global variables for access token and expiration time
let access_token = null;
let expires_at = null;

const requestConsent = async () => {
  const scopes = 'signature impersonation';
  const consentUrl = `${config.docusign.basePath}/oauth/auth?response_type=code&scope=${scopes}&client_id=${config.docusign.integrationKey}&redirect_uri=${config.docusign.oAuthRedirectUri}`;

  console.log('Please visit this URL to grant consent:', consentUrl);
};

const checkToken = async () => {
  try {
    if (access_token && Date.now() < expires_at) {
      console.log("Re-using access_token");
      return;
    }

    console.log("Generating a new access token");
    let dsApiClient = new docusign.ApiClient();
    dsApiClient.addDefaultHeader('User-Agent', 'Expertree/1.0');
    dsApiClient.setBasePath(config.docusign.basePath);
    const p = path.resolve(strapi.dirs.dist.config, config.docusign.privateKey);

    try {
      const results = await dsApiClient.requestJWTUserToken(
        config.docusign.integrationKey,
        config.docusign.userId,
        "signature",
        fs.readFileSync(p),
        3600
      );

      access_token = results.body.access_token;
      expires_at = Date.now() + (results.body.expires_in - 60) * 1000;
    } catch (error) {
      if (error.response?.data?.error === 'consent_required') {
        await requestConsent();
        throw new Error('DocuSign consent required. Please check the console for the consent URL.');
      }
      throw error;
    }
  } catch (error) {
    console.error('Error in checkToken:', error);
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Headers:', JSON.stringify(error.response.headers));
      console.error('Data:', JSON.stringify(error.response.data));
    }
    throw error;
  }
};

const getEnvelopesApi = async () => {
  await checkToken();
  let dsApiClient = new docusign.ApiClient();
  dsApiClient.setBasePath(config.docusign.basePath);
  dsApiClient.addDefaultHeader('Authorization', 'Bearer ' + access_token);
  return new docusign.EnvelopesApi(dsApiClient);
};

const makeEnvelope = (name, data, userId, templateId) => {
  try {
    const { email } = data;
    if (!email || !name || !templateId || !userId) {
      console.error('Missing required fields', email, name, templateId, userId);
      throw new Error('Missing required fields');
    }

    // Initialize the EnvelopeDefinition
    let envelope = new docusign.EnvelopeDefinition();
    envelope.emailSubject = 'Please sign this document';
    envelope.templateId = templateId;

    // Create text tabs dynamically from the data object
    const textTabs = Object.entries(data).map(([key, value]) => ({
      tabLabel: key,
      value: value,
      font: 'Arial',
      // fontSize: 'Size10',
      bold: 'false'
    }));

    let tabs = docusign.Tabs.constructFromObject({ textTabs });
    const signerOption = {
      email: email,
      name: name,
      tabs: tabs,
      clientUserId: userId, // Must be unique per recipient
      roleName: 'Consultant',
      requireIdLookup: 'false', // Disables ID lookup
      idCheckConfigurationName: 'none', // Ensures no ID check is required
      identificationMethod: 'none' // Specifies no additional identification
    }
    // Define the signer with template role
    let signer = docusign.TemplateRole.constructFromObject(signerOption);
    console.log("signer", signerOption);
    // Add the signer to the envelope
    envelope.templateRoles = [signer];
    envelope.status = "sent";

    // Define the event notification settings
    let eventNotification = docusign.EventNotification.constructFromObject({
      loggingEnabled: 'true',
      requireAcknowledgment: 'true',
      useSoapInterface: 'false',
      includeCertificateOfCompletion: 'true',
      signMessageWithX509Cert: 'false',
      includeDocuments: 'false',
      includeEnvelopeVoidReason: 'true',
      includeTimeZone: 'true',
      includeSenderAccountAsCustomField: 'true',
      includeDocumentFields: 'true',
      includeCertificateWithSoap: 'false',
      envelopeEvents: [
        { envelopeEventStatusCode: 'sent', includeDocuments: 'false' },
        { envelopeEventStatusCode: 'delivered', includeDocuments: 'false' },
        { envelopeEventStatusCode: 'completed', includeDocuments: 'true' },
        { envelopeEventStatusCode: 'declined', includeDocuments: 'false' },
        { envelopeEventStatusCode: 'voided', includeDocuments: 'false' },
      ],
    });

    envelope.eventNotification = eventNotification;

    return envelope;
  } catch (error) {
    console.error('Error creating envelope:', error);
    throw error;
  }
};

const makeRecipientViewRequest = (name, email, userId, callbackURL) => {
  let viewRequest = new docusign.RecipientViewRequest();

  viewRequest.returnUrl = callbackURL;
  viewRequest.authenticationMethod = 'none'; // Specifies no authentication required
  viewRequest.email = email;
  viewRequest.userName = name;
  viewRequest.clientUserId = userId; // Must match the clientUserId in envelope
  console.log("viewRequest", { returnUrl: callbackURL, email, name, clientUserId: userId, authenticationMethod: 'none' });
  return viewRequest;
};

const sendDocumentForSignature = async (data, id, templateId, callbackURL) => {
  //go over the data object and make sure only the text feilds strat with capital if not make them
  const capitalizeTextFields = (dataObject) => {
    for (const key in dataObject) {
      if (typeof dataObject[key] === 'string') {
        dataObject[key] = dataObject[key].charAt(0).toUpperCase() + dataObject[key].slice(1);
      }
    }
    return dataObject;
  }

  data = capitalizeTextFields(data);
  const { name, email } = data;
  let envelopesApi = await getEnvelopesApi();
  let envelope = makeEnvelope(name, data, id, templateId);

  let results = await envelopesApi.createEnvelope(config.docusign.accountId, {
    envelopeDefinition: envelope,
  });

  let viewRequest = makeRecipientViewRequest(name, email, id, callbackURL);
  const recipientView = await envelopesApi.createRecipientView(config.docusign.accountId, results.envelopeId, {
    recipientViewRequest: viewRequest,
  });

  return { url: recipientView.url, envelopeId: results.envelopeId };
};

const sendMissionContractForSignature = (data, id) => {
  return sendDocumentForSignature(data, id, config.docusign.missiontemplateId, config.docusign.proposalRedirectUri);
};

const sendOfferForSignature = (data, id) => {
  return sendDocumentForSignature(data, id, config.docusign.offerTemplateId, config.docusign.offerRedirectUri);
};
const sendFramworkContractForSignature = (data, id) => {
  return sendDocumentForSignature(data, id, config.docusign.frameworkTemplateId, config.docusign.frameworkRedirectUri);
};

const retrieveSignedDocumentAndUpload = async (envelopeId) => {
  try {
    let envelopesApi = await getEnvelopesApi();

    let results = await envelopesApi.listDocuments(config.docusign.accountId, envelopeId);
    let documentId = results.envelopeDocuments[0].documentId; // Assuming the first document is the signed document

    // Get the document directly
    let documentBuffer = await envelopesApi.getDocument(config.docusign.accountId, envelopeId, documentId);

    const tempFilePath = path.resolve(strapi.dirs.dist.root, 'public', `signed_document_${envelopeId}.pdf`);

    // Write the buffer to a temporary file
    fs.writeFileSync(tempFilePath, documentBuffer);

    const fileStat = fs.statSync(tempFilePath);
    const fileName = `signed_document_${envelopeId}.pdf`;

    const fileData = {
      path: tempFilePath,
      name: fileName,
      type: 'application/pdf',
      size: fileStat.size
    };

    // Upload the file to Strapi
    const uploadedFiles = await strapi.plugins["upload"].services.upload.upload({
      data: {},
      files: fileData
    });

    // Delete the temporary file
    fs.unlinkSync(tempFilePath);

    // Return the ID of the uploaded file
    if (uploadedFiles && uploadedFiles.length > 0) {
      return uploadedFiles[0].id;
    } else {
      throw new Error('File upload failed');
    }
  } catch (error) {
    console.error('Error in retrieveSignedDocumentAndUpload:', error);
    throw error;
  }
};

module.exports = {
  sendMissionContractForSignature,
  sendOfferForSignature,
  sendFramworkContractForSignature,
  retrieveSignedDocumentAndUpload,
};
