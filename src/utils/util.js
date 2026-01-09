// @ts-nocheck
"use strict";
const nodemailer = require('nodemailer');
const defaultSender = process.env.SMTP_USERNAME || 'np-reply@expertree.com';
const loginPage = process.env.LOGIN_PAGE || 'https://92.205.233.109:8080/login';
const emailTemplate = `
<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
<html xmlns="http://www.w3.org/1999/xhtml" lang="en">
<head>
    <meta http-equiv="Content-Type" content="text/html; charset=UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Email Template</title>
</head>
<body>
    <table border="0" cellpadding="0" cellspacing="0" width="100%" id="bodyTable">
        <tr>
            <td align="center" valign="top" id="bodyCell">
                <table border="0" cellpadding="0" cellspacing="0" width="600" class="email-container">
                    <tr>
                        <td align="center" valign="top" class="header" style="padding: 20px 0;">
                            <img src="https://www.expertree.com/images/logos/logo-yellow.png" alt="Expertree Logo" style="max-width: 100%; height: auto;" />
                        </td>
                    </tr>
                    <tr>
                        <td align="left" valign="top" class="content" style="padding: 20px;">
                            {{DYNAMIC_CONTENT}}
                        </td>
                    </tr>
                    <tr>
                        <td align="center" valign="top" class="footer" style="padding: 20px; color: #999999; font-family: Arial, sans-serif; font-size: 14px;">
                            &copy; 2024 Expertree. All rights reserved.
                        </td>
                    </tr>
                </table>
            </td>
        </tr>
    </table>
</body>
</html>
`;
function generateDynamicContent(title, recipientName, content) {
  return `
    <h1 style="color: #333333; font-family: Arial, sans-serif; font-size: 24px; line-height: 1.2; margin-bottom: 20px;">${title}</h1>
    ${recipientName ? `<p style="color: #666666; font-family: Arial, sans-serif; font-size: 16px; line-height: 1.5;">Dear ${recipientName},</p>` : ''}
    ${content}
    <p style="color: #666666; font-family: Arial, sans-serif; font-size: 16px; line-height: 1.5;">If you have any questions, feel free to <a href="mailto:info@expertree.com" style="color: #0066cc; text-decoration: underline;">contact us</a>.</p>
    <p style="color: #666666; font-family: Arial, sans-serif; font-size: 16px; line-height: 1.5;">Best regards,<br>The Expertree Team</p>
  `;
}

const generateUniqueIdByEmail = (email) => {
  if (!email) {
    throw new Error('Email is required');
  }
  const lowerEmail = email.toLowerCase();
  let hash = 0;
  for (let i = 0; i < lowerEmail.length; i++) {
    hash = ((hash * 31 + lowerEmail.charCodeAt(i)) * 17) >>> 0;
  }
  let id = (hash % 100000000).toString().padStart(8, '1');
  if (id.length < 8) {
    const padding = '12345678'.substring(0, 8 - id.length);
    id = padding + id;
  }
  return id;
};


const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'mail.expertree.com',
  port: process.env.SMTP_PORT || 465,
  secure: true, // true for 465, false for other ports
  auth: {
    user: process.env.SMTP_USERNAME || 'no-reply@expertree.com',
    pass: process.env.SMTP_PASSWORD || 'u-oZuQQEzC!@',
  },
  tls: {
    rejectUnauthorized: false, // Use with caution
  },
  debug: true, // Enable debug output for troubleshooting
});
const sendEmail = async ({ to, subject, html }) => {
  const mailOptions = {
    from: `"Expertree" <${defaultSender}>`,
    to,
    subject,
    html
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log(`Email sent:(${to}) ` + info.response);
  } catch (error) {
    console.error('Error sending email:', error);
  }
};
const sendWelcomeEmail = async (email, name, password) => {
  console.log('sendWelcomeEmail called:', email, name);
  const dynamicContent = generateDynamicContent(
    "Welcome to Expertree!",
    name,
    `
      <p style="color: #666666; font-family: Arial, sans-serif; font-size: 16px; line-height: 1.5;">Thank you for joining Expertree. We are excited to have you on board. Please find bellow your login credentials:</p>
      <ul style="color: #666666; font-family: Arial, sans-serif; font-size: 16px; line-height: 1.5; padding-left: 20px;">
          <li>Email: ${email}</li>
          <li>Password: ${password}</li>
      </ul>
        <p style="color: #666666; font-family: Arial, sans-serif; font-size: 16px; line-height: 1.5;">To access your account, please visit our <a href="${loginPage}" style="color: #f0bc68; text-decoration: none;">login page</a>.</p>

    `
  );
  const finalHtml = emailTemplate.replace('{{DYNAMIC_CONTENT}}', dynamicContent);
  await sendEmail({
    to: email,
    subject: 'Welcome to Expertree!',
    html: finalHtml
  });
};

const sendEmailForActivatedUser = async (email, name) => {
  console.log('sendEmailForActivatedUser called:', email, name);
  const dynamicContent = generateDynamicContent(
    "Your Expertree Account is Now Activated!",
    name,
    `
      <p style="color: #666666; font-family: Arial, sans-serif; font-size: 16px; line-height: 1.5;">We are pleased to inform you that your Expertree account has been successfully activated.</p>
      <p style="color: #666666; font-family: Arial, sans-serif; font-size: 16px; line-height: 1.5;">You can now log in to your account and start exploring all the features Expertree has to offer.</p>
      <p style="color: #666666; font-family: Arial, sans-serif; font-size: 16px; line-height: 1.5;">To access your account, please visit our <a href="${loginPage}" style="color: #f0bc68; text-decoration: none;">login page</a>.</p>
    `
  );
  const finalHtml = emailTemplate.replace('{{DYNAMIC_CONTENT}}', dynamicContent);
  await sendEmail({
    to: email,
    subject: 'Your Expertree Account is Activated',
    html: finalHtml
  });
};

const sendOtpForUser = async (email, otp) => {
  console.log('sendOtpForUser called:', email, otp);
  const dynamicContent = generateDynamicContent(
    "Your One Time Password is bellow, Dont share it with anybody!",
    null,
    `
      <p style="color: #666666; font-family: Arial, sans-serif; font-size: 24px; line-height: 1.5;">${otp}</p>
    `
  );
  const finalHtml = emailTemplate.replace('{{DYNAMIC_CONTENT}}', dynamicContent);
  await sendEmail({
    to: email,
    subject: 'Expertree Account OTP',
    html: finalHtml
  });
};
const sendProposalNotificationEmail = async (consultant, client, proposalData) => {
  console.log('sendProposalNotificationEmail called:', consultant, client);
  console.log("sending email to consultant:", consultant);
  if (!consultant?.email) {
    console.warn('Consultant email not found for proposal notification');
    return;
  }
  const dynamicContent = `
    <p style="color: #666666; font-family: Arial, sans-serif; font-size: 16px; line-height: 1.5;">
      You have received a new proposal from ${client?.name || 'a client'}.
    </p>
    <div style="background-color: #f8f9fa; padding: 20px; margin: 20px 0; border-radius: 5px;">
      <h3 style="color: #333333; margin-top: 0;">Proposal Details:</h3>
      <ul style="color: #666666; font-family: Arial, sans-serif; font-size: 16px; line-height: 1.5;">
        <li><strong>Mission Location:</strong> ${proposalData.missionLocation}</li>
        <li><strong>Type of Work:</strong> ${proposalData.typeOfWork}</li>
        <li><strong>Start Date:</strong> ${new Date(proposalData.startDate).toLocaleDateString()}</li>
        <li><strong>End Date:</strong> ${new Date(proposalData.endDate).toLocaleDateString()}</li>
        <li><strong>All in Hourly Rate:</strong> ${consultant?.preferences?.rate} CHF</li>
 
      </ul>
    </div>
    <p style="color: #666666; font-family: Arial, sans-serif; font-size: 16px; line-height: 1.5;">
      Please log in to your account to review the complete proposal details and take necessary action.
    </p>
    <p style="text-align: center; margin: 30px 0;">
      <a href="${loginPage}" 
         style="background-color: #f0bc68; 
                color: white; 
                padding: 12px 25px; 
                text-decoration: none; 
                border-radius: 5px; 
                font-family: Arial, sans-serif;">
        Review Proposal
      </a>
    </p>
  `;

  const finalHtml = emailTemplate.replace(
    '{{DYNAMIC_CONTENT}}',
    generateDynamicContent(
      "New Proposal Received",
      `${consultant.firstName} ${consultant.lastName}`,
      dynamicContent
    )
  );

  await sendEmail({
    to: consultant?.email,
    subject: 'New Proposal Received - Expertree',
    html: finalHtml
  });
};

const sendProposalStatusChangeEmail = async (proposal, status) => {
  console.log('sendProposalStatusChangeEmail called:', proposal, status);
  const { client, consultant } = proposal;

  if (!client?.email) {
    console.warn('Client email not found for proposal status change notification');
    return;
  }
  const isAccepted = status === 'AcceptedByConsultant';
  const statusText = isAccepted ? 'accepted' : 'rejected';
  const statusColor = isAccepted ? '#28a745' : '#dc3545';
  const statusBgColor = isAccepted ? '#f8fff9' : '#fff8f8';

  const dynamicContent = `
    <p style="color: #666666; font-family: Arial, sans-serif; font-size: 16px; line-height: 1.5;">
      ${statusText === "accepted" ? consultant.firstName + " " + consultant.lastName + " has accepted your proposal." : "Unfortunately, the consultant is unable to accept the below proposal at this time. We invite you to explore our platform to find another expert who may be available to assist you."}
    </p>
    <div style="background-color: ${statusBgColor}; padding: 20px; margin: 20px 0; border-radius: 5px; border-left: 4px solid ${statusColor};">
      <h3 style="color: #333333; margin-top: 0;">Proposal Details:</h3>
      <ul style="color: #666666; font-family: Arial, sans-serif; font-size: 16px; line-height: 1.5;">
        <li><strong>Mission Location:</strong> ${proposal.missionLocation}</li>
        <li><strong>Type of Work:</strong> ${proposal.typeOfWork}</li>
        <li><strong>Start Date:</strong> ${new Date(proposal.startDate).toLocaleDateString()}</li>
        <li><strong>End Date:</strong> ${new Date(proposal.endDate).toLocaleDateString()}</li>
        <li><strong>Hourly Rate:</strong> ${Math.round(consultant.preferences.rate / 0.955)} CHF</li>
        ${proposal.numberOfDays ? `<li><strong>Number of Days:</strong> ${proposal.numberOfDays}</li>` : ''}
        ${!isAccepted && proposal.rejectionDetails ? `
          <li style="margin-top: 15px;">
            <strong>Rejection Reason:</strong><br>
            <p style="margin: 5px 0; padding: 10px; background-color: #fff; border-radius: 3px;">
              ${proposal.rejectionDetails}
            </p>
          </li>
        ` : ''}
      </ul>
    </div>
    ${isAccepted ? `
      <p style="color: #666666; font-family: Arial, sans-serif; font-size: 16px; line-height: 1.5;">
        An offer has been automatically created based on this accepted proposal. You can now proceed with the next steps in the hiring process.
      </p>
    ` : `
      <p style="color: #666666; font-family: Arial, sans-serif; font-size: 16px; line-height: 1.5;">
        You can continue searching for other consultants or modify your proposal terms.
      </p>
    `}
    <p style="text-align: center; margin: 30px 0;">
      <a href="${loginPage}" 
         style="background-color: ${statusColor}; 
                color: white; 
                padding: 12px 25px; 
                text-decoration: none; 
                border-radius: 5px; 
                font-family: Arial, sans-serif;">
        View Details
      </a>
    </p>
  `;

  const finalHtml = emailTemplate.replace(
    '{{DYNAMIC_CONTENT}}',
    generateDynamicContent(
      `Proposal ${isAccepted ? 'Accepted' : 'Rejected'}`,
      `${client.accountOwnerFirstName} ${client.accountOwnerLastName}`,
      dynamicContent
    )
  );

  await sendEmail({
    to: client.email,
    subject: `Proposal ${isAccepted ? 'Accepted' : 'Rejected'} - Expertree`,
    html: finalHtml
  });
};

const sendMissionContractSigningEmail = async (proposal) => {
  const { consultant, client } = proposal;
  console.log('sendMissionContractSigningEmail called:', proposal);
  console.debug('******************************* Sending mission contract signing email for : ' + consultant?.user?.email, proposal);

  if (!consultant?.user?.email) {
    console.warn('Consultant email not found for mission contract signing notification');
    return;
  }

  const dynamicContent = `
    <p style="color: #666666; font-family: Arial, sans-serif; font-size: 16px; line-height: 1.5;">
      ${client?.name || 'The client'} has signed the offer contract. The next step is for you to sign the mission contract.
    </p>
    <div style="background-color: #f8f9fa; padding: 20px; margin: 20px 0; border-radius: 5px; border-left: 4px solid #f0bc68;">
      <h3 style="color: #333333; margin-top: 0;">Mission Details:</h3>
      <ul style="color: #666666; font-family: Arial, sans-serif; font-size: 16px; line-height: 1.5;">
        <li><strong>Mission Location:</strong> ${proposal.missionLocation}</li>
        <li><strong>Type of Work:</strong> ${proposal.typeOfWork}</li>
        <li><strong>Start Date:</strong> ${new Date(proposal.startDate).toLocaleDateString()}</li>
        <li><strong>End Date:</strong> ${new Date(proposal.endDate).toLocaleDateString()}</li>
        <li><strong>Base Salary:</strong> ${proposal.baseSalary} CHF</li>
        <li><strong>Total hourly wage (including vacations and bank holidays):</strong> ${proposal.totalHourlyWage} CHF</li>
        ${proposal.numberOfDays ? `<li><strong>Number of Days:</strong> ${proposal.numberOfDays}</li>` : ''}
      </ul>
    </div>
    <p style="color: #666666; font-family: Arial, sans-serif; font-size: 16px; line-height: 1.5;">
      Please log in to your account to review and sign the mission contract. This is the final step to formalize your engagement.
    </p>
    <p style="color: #666666; font-family: Arial, sans-serif; font-size: 16px; line-height: 1.5;">
      <strong>Important:</strong> The mission contract contains all the terms and conditions of your engagement. Please review it carefully before signing.
    </p>
    <p style="text-align: center; margin: 30px 0;">
      <a href="${loginPage}" 
         style="background-color: #f0bc68; 
                color: white; 
                padding: 12px 25px; 
                text-decoration: none; 
                border-radius: 5px; 
                font-family: Arial, sans-serif;">
        Sign Mission Contract
      </a>
    </p>
  `;

  const finalHtml = emailTemplate.replace(
    '{{DYNAMIC_CONTENT}}',
    generateDynamicContent(
      "Mission Contract Ready for Signing",
      `${consultant.firstName} ${consultant.lastName}`,
      dynamicContent
    )
  );

  await sendEmail({
    to: consultant.user.email,
    subject: 'Mission Contract Ready for Signing - Expertree',
    html: finalHtml
  });
};

const sendProjectLaunchEmail = async (proposal, recipient = 'consultant') => {
  console.log('sendProjectLaunchEmail called:', proposal, recipient);
  const { consultant, client } = proposal;
  const isConsultant = recipient === 'consultant';
  const recipientEmail = isConsultant ? consultant?.user?.email : client?.email;
  const recipientName = isConsultant
    ? `${consultant.firstName} ${consultant.lastName}`
    : `${client.accountOwnerFirstName} ${client.accountOwnerLastName}`;

  if (!recipientEmail) {
    console.warn(`${recipient} email not found for project launch notification`);
    return;
  }

  const dynamicContent = `
    <p style="color: #666666; font-family: Arial, sans-serif; font-size: 16px; line-height: 1.5;">
      ${isConsultant
      ? `Your project with ${client?.name || 'the client'} has been officially launched.`
      : `Your project with ${consultant.firstName} ${consultant.lastName} has been officially launched.`}
    </p>
    <div style="background-color: #f0f9ff; padding: 20px; margin: 20px 0; border-radius: 5px; border-left: 4px solid #0066cc;">
      <h3 style="color: #333333; margin-top: 0;">Project Details:</h3>
      <ul style="color: #666666; font-family: Arial, sans-serif; font-size: 16px; line-height: 1.5;">
        ${proposal ? `
          <li><strong>Mission Location:</strong> ${proposal.missionLocation}</li>
          <li><strong>Type of Work:</strong> ${proposal.typeOfWork}</li>
          <li><strong>Start Date:</strong> ${new Date(proposal.startDate).toLocaleDateString()}</li>
          <li><strong>End Date:</strong> ${new Date(proposal.endDate).toLocaleDateString()}</li>
        ` : ''}
      </ul>
    </div>
    ${isConsultant ? `
      <p style="color: #666666; font-family: Arial, sans-serif; font-size: 16px; line-height: 1.5;">
        You can now begin your work according to the terms specified in the mission contract. Make sure to:
        <ul style="color: #666666; font-family: Arial, sans-serif; font-size: 16px; line-height: 1.5;">
          <li>Review all project documentation</li>
          <li>Confirm your start date with the client</li>
          <li>Set up any necessary access or equipment</li>
        </ul>
      </p>
    ` : `
      <p style="color: #666666; font-family: Arial, sans-serif; font-size: 16px; line-height: 1.5;">
        Next steps:
        <ul style="color: #666666; font-family: Arial, sans-serif; font-size: 16px; line-height: 1.5;">
          <li>Coordinate with the consultant regarding project specifics</li>
          <li>Ensure all necessary access and resources are provided</li>
          <li>Schedule an initial kick-off meeting if needed</li>
        </ul>
      </p>
    `}
    <p style="text-align: center; margin: 30px 0;">
      <a href="${loginPage}" 
         style="background-color: #0066cc; 
                color: white; 
                padding: 12px 25px; 
                text-decoration: none; 
                border-radius: 5px; 
                font-family: Arial, sans-serif;">
        View Project Details
      </a>
    </p>
  `;

  const finalHtml = emailTemplate.replace(
    '{{DYNAMIC_CONTENT}}',
    generateDynamicContent(
      "Project Successfully Launched!",
      recipientName,
      dynamicContent
    )
  );

  await sendEmail({
    to: recipientEmail,
    subject: 'Project Launch Confirmation - Expertree',
    html: finalHtml
  });
};

const sendProjectFinishEmail = async (project, recipient = 'consultant') => {
  console.log('sendProjectFinishEmail called:', project, recipient);
  const { consultant, client, offer } = project.attributes;
  const isConsultant = recipient === 'consultant';
  const recipientEmail = isConsultant ? consultant?.data?.attributes?.email : client?.data?.attributes?.email;
  const recipientName = isConsultant
    ? `${consultant?.data?.attributes?.firstName} ${consultant?.data?.attributes?.lastName}`
    : `${client?.data?.attributes?.accountOwnerFirstName} ${client?.data?.attributes?.accountOwnerLastName}`;

  if (!recipientEmail) {
    console.warn(`${recipient} email not found for project finish notification`);
    return;
  }

  const dynamicContent = `
    <p style="color: #666666; font-family: Arial, sans-serif; font-size: 16px; line-height: 1.5;">
      ${isConsultant
      ? `Your project with ${client?.data?.attributes?.name || 'the client'} has been successfully completed.`
      : `Your project with ${consultant?.data?.attributes?.firstName} ${consultant?.data?.attributes?.lastName} has been successfully completed.`}
    </p>
    <div style="background-color: #f8f9fa; padding: 20px; margin: 20px 0; border-radius: 5px; border-left: 4px solid #28a745;">
      <h3 style="color: #333333; margin-top: 0;">Project Details:</h3>
      <ul style="color: #666666; font-family: Arial, sans-serif; font-size: 16px; line-height: 1.5;">
        ${project ? `
          <li><strong>Mission Location:</strong> ${offer?.data?.attributes?.proposal?.data?.attributes?.missionLocation}</li>
          <li><strong>Type of Work:</strong> ${offer?.data?.attributes?.proposal?.data?.attributes?.typeOfWork}</li>
          <li><strong>Start Date:</strong> ${new Date(offer?.data?.attributes?.proposal?.data?.attributes?.startDate).toLocaleDateString()}</li>
          <li><strong>End Date:</strong> ${new Date(offer?.data?.attributes?.proposal?.data?.attributes?.endDate).toLocaleDateString()}</li>
        ` : ''}
      </ul>
    </div>
    ${isConsultant ? `
      <p style="color: #666666; font-family: Arial, sans-serif; font-size: 16px; line-height: 1.5;">
        Thank you for your hard work and dedication throughout the project. Please ensure that:
        <ul style="color: #666666; font-family: Arial, sans-serif; font-size: 16px; line-height: 1.5;">
          <li>All deliverables are finalized and submitted</li>
          <li>Any pending timesheets are completed</li>
          <li>Feedback is provided to the client</li>
        </ul>
      </p>
    ` : `
      <p style="color: #666666; font-family: Arial, sans-serif; font-size: 16px; line-height: 1.5;">
        Thank you for collaborating with ${consultant?.data?.attributes?.firstName} ${consultant?.data?.attributes?.lastName}. Please ensure that:
        <ul style="color: #666666; font-family: Arial, sans-serif; font-size: 16px; line-height: 1.5;">
          <li>All deliverables are reviewed and accepted</li>
          <li>Feedback is provided to the consultant</li>
          <li>Any pending payments are processed</li>
        </ul>
      </p>
    `}
    <p style="text-align: center; margin: 30px 0;">
      <a href="${loginPage}" 
         style="background-color: #28a745; 
                color: white; 
                padding: 12px 25px; 
                text-decoration: none; 
                border-radius: 5px; 
                font-family: Arial, sans-serif;">
        View Project Details
      </a>
    </p>
  `;

  const finalHtml = emailTemplate.replace(
    '{{DYNAMIC_CONTENT}}',
    generateDynamicContent(
      "Project Successfully Completed!",
      recipientName,
      dynamicContent
    )
  );

  await sendEmail({
    to: recipientEmail,
    subject: 'Project Completion Confirmation - Expertree',
    html: finalHtml
  });
};

const sendTimesheetSubmittedEmail = async (project, timesheet, recipient = 'consultant') => {
  console.log('sendTimesheetSubmittedEmail called:', project, timesheet, recipient);
  const { consultant, client } = project;
  const isConsultant = recipient === 'consultant';
  const recipientEmail = isConsultant ? consultant?.email : client?.email;
  const recipientName = isConsultant
    ? `${consultant.firstName} ${consultant.lastName}`
    : `${client.accountOwnerFirstName} ${client.accountOwnerLastName}`;

  if (!recipientEmail) {
    console.warn(`${recipient} email not found for Timesheet submission notification`);
    return;
  }

  const dynamicContent = `
    <p style="color: #666666; font-family: Arial, sans-serif; font-size: 16px; line-height: 1.5;">
      ${isConsultant
      ? `Your timesheet with ${client?.name || 'the client'} has been officially submitted.`
      : `${consultant.firstName} ${consultant.lastName} has officially submitted the timesheet of ${timesheet?.month} - ${timesheet?.year}.`}
    </p>

    ${isConsultant ? `
      <p style="color: #666666; font-family: Arial, sans-serif; font-size: 16px; line-height: 1.5;">
        Please wait for the client approval or rejection of the timesheet.
      </p>
    ` : `
      <p style="color: #666666; font-family: Arial, sans-serif; font-size: 16px; line-height: 1.5;">
          You can now approve or reject the timesheet.
      </p>
    `}
    <p style="text-align: center; margin: 30px 0;">
      <a href="${loginPage}" 
         style="background-color: #0066cc; 
                color: white; 
                padding: 12px 25px; 
                text-decoration: none; 
                border-radius: 5px; 
                font-family: Arial, sans-serif;">
        View Project Details
      </a>
    </p>
  `;


  const finalHtml = emailTemplate.replace(
    '{{DYNAMIC_CONTENT}}',
    generateDynamicContent(
      "Timesheet Submitted.",
      recipientName,
      dynamicContent
    )
  );

  await sendEmail({
    to: recipientEmail,
    subject: 'Timesheet Submission Confirmation - Expertree',
    html: finalHtml
  });

};



const sendTimesheetApprovedEmail = async (project, timesheet, recipient = 'consultant') => {
  console.log('sendTimesheetApprovedEmail called:', project, timesheet, recipient);
  const { consultant, client } = project;
  const isConsultant = recipient === 'consultant';
  const recipientEmail = isConsultant ? consultant?.email : client?.email;
  const recipientName = isConsultant
    ? `${consultant.firstName} ${consultant.lastName}`
    : `${client.accountOwnerFirstName} ${client.accountOwnerLastName}`;

  if (!recipientEmail) {
    console.warn(`${recipient} email not found for project launch notification`);
    return;
  }
  console.log('sendTimesheetApprovedEmail:');
  const dynamicContent = `
    <p style="color: #666666; font-family: Arial, sans-serif; font-size: 16px; line-height: 1.5;">
      ${isConsultant
      ? `${client.accountOwnerFirstName && client.accountOwnerLastName
        ? `${client.accountOwnerFirstName} ${client.accountOwnerLastName}`
        : 'The client'} has officially approved your timesheet of ${timesheet?.month} - ${timesheet?.year}.`
      : `You have officially approved the timesheet of ${timesheet?.month} - ${timesheet?.year}.`}
    </p>
    <p style="text-align: center; margin: 30px 0;">
      <a href="${loginPage}" 
         style="background-color: #0066cc; 
                color: white; 
                padding: 12px 25px; 
                text-decoration: none; 
                border-radius: 5px; 
                font-family: Arial, sans-serif;">
        View Project Details
      </a>
    </p>
  `;


  const finalHtml = emailTemplate.replace(
    '{{DYNAMIC_CONTENT}}',
    generateDynamicContent(
      "Timesheet Approved.",
      recipientName,
      dynamicContent
    )
  );

  await sendEmail({
    to: recipientEmail,
    subject: 'Timesheet Approval Confirmation - Expertree',
    html: finalHtml
  });

};

const sendTimesheetRejectedEmail = async (project, timesheet, recipient = 'consultant') => {
  console.log('sendTimesheetRejectedEmail called:', project, timesheet, recipient);
  const { consultant, client } = project;
  const isConsultant = recipient === 'consultant';
  const recipientEmail = isConsultant ? consultant?.email : client?.email;
  const recipientName = isConsultant
    ? `${consultant.firstName} ${consultant.lastName}`
    : `${client.accountOwnerFirstName} ${client.accountOwnerLastName}`;

  if (!recipientEmail) {
    console.warn(`${recipient} email not found for project launch notification`);
    return;
  }

  const dynamicContent = `
    <p style="color: #666666; font-family: Arial, sans-serif; font-size: 16px; line-height: 1.5;">
      ${isConsultant
      ? `${client.accountOwnerFirstName && client.accountOwnerLastName
        ? `${client.accountOwnerFirstName} ${client.accountOwnerLastName}`
        : 'The client'} has officially rejected your timesheet of ${timesheet?.month} - ${timesheet?.year}.`
      : `You have officially rejected the timesheet of ${timesheet?.month} - ${timesheet?.year}.`}
    </p>
    <p style="text-align: center; margin: 30px 0;">
      <a href="${loginPage}" 
         style="background-color: #0066cc; 
                color: white; 
                padding: 12px 25px; 
                text-decoration: none; 
                border-radius: 5px; 
                font-family: Arial, sans-serif;">
        View Project Details
      </a>
    </p>
  `;


  const finalHtml = emailTemplate.replace(
    '{{DYNAMIC_CONTENT}}',
    generateDynamicContent(
      "Timesheet Rejected.",
      recipientName,
      dynamicContent
    )
  );

  await sendEmail({
    to: recipientEmail,
    subject: 'Timesheet Rejection Confirmation - Expertree',
    html: finalHtml
  });

};

const sendConsultantRejectionEmail = async (email, name) => {
  console.log('sendConsultantRejectionEmail called:', email, name);

  const dynamicContent = generateDynamicContent(
    "Update on Your Application via Expertree",
    name,
    `
      <p style="color: #666666; font-family: Arial, sans-serif; font-size: 16px; line-height: 1.5;">Thank you for applying through Expertree, the platform powered by Lifesci Consulting SA that connects talented consultants with leading life sciences companies.</p>
      <p style="color: #666666; font-family: Arial, sans-serif; font-size: 16px; line-height: 1.5;">We truly appreciate the time and effort you put into your application. While your current experience doesn't fully align with the specific requirements of this role, we encourage you to stay connected — new opportunities are published regularly and may be a better fit in the near future.</p>
      <p style="color: #666666; font-family: Arial, sans-serif; font-size: 16px; line-height: 1.5;">We value your interest in our platform and wish you continued success in your career. We hope to have the chance to collaborate in the future.</p>
      <p style="color: #666666; font-family: Arial, sans-serif; font-size: 16px; line-height: 1.5;">Warm regards,<br>The Expertree Team</p>
    `
  );
  const finalHtml = emailTemplate.replace('{{DYNAMIC_CONTENT}}', dynamicContent);
  await sendEmail({
    to: email,
    subject: 'Update on Your Application via Expertree',
    html: finalHtml
  });
};

const sendProposalApprovalRequestEmail = async (client, subClient, proposal) => {
  console.log('sendProposalApprovalRequestEmail called:', client, subClient, proposal);
  if (!client?.email) {
    console.warn('Client email not found for proposal approval request notification');
    return;
  }

  const dynamicContent = `
    <p style="color: #666666; font-family: Arial, sans-serif; font-size: 16px; line-height: 1.5;">
      A new proposal has been submitted by ${subClient?.accountOwnerFirstName && subClient?.accountOwnerLastName
      ? `${subClient.accountOwnerFirstName} ${subClient.accountOwnerLastName}`
      : 'sub-client'} and requires your approval.
    </p>
    <div style="background-color: #f8f9fa; padding: 20px; margin: 20px 0; border-radius: 5px; border-left: 4px solid #0066cc;">
      <h3 style="color: #333333; margin-top: 0;">Proposal Details:</h3>
      <ul style="color: #666666; font-family: Arial, sans-serif; font-size: 16px; line-height: 1.5;">

        <li><strong>Mission Location:</strong> ${proposal.missionLocation}</li>
        <li><strong>Type of Work:</strong> ${proposal.typeOfWork}</li>
        <li><strong>Start Date:</strong> ${new Date(proposal.startDate).toLocaleDateString()}</li>
        <li><strong>End Date:</strong> ${new Date(proposal.endDate).toLocaleDateString()}</li>
        <li><strong>Hourly rate:</strong> ${proposal.fees} CHF</li>

      </ul>
    </div>
    <p style="color: #666666; font-family: Arial, sans-serif; font-size: 16px; line-height: 1.5;">
      Please log in to your account to review the proposal and take the necessary action (approve or reject).
    </p>
    <p style="text-align: center; margin: 30px 0;">
      <a href="${loginPage}" 
         style="background-color: #0066cc; 
                color: white; 
                padding: 12px 25px; 
                text-decoration: none; 
                border-radius: 5px; 
                font-family: Arial, sans-serif;">
        Review Proposal
      </a>
    </p>
  `;

  const finalHtml = emailTemplate.replace(
    '{{DYNAMIC_CONTENT}}',
    generateDynamicContent(
      "New Proposal Approval Request",
      `${client?.accountOwnerFirstName} ${client?.accountOwnerLastName}`,
      dynamicContent
    )
  );

  await sendEmail({
    to: client.email,
    subject: 'New Proposal Approval Request - Expertree',
    html: finalHtml
  });
};


const sendOfferStatusChangeEmailByClient = async (offer, status) => {
  const statusText = status === "RejectedByClient" ? "Rejected" : "Accepted";
  if (!offer?.proposal?.consultant?.email) {
    console.warn('Client email not found for offer status change notification');
    return;
  }

  const dynamicContent = `
    ${statusText === "Accepted" ? `
      <p style="color: #666666; font-family: Arial, sans-serif; font-size: 16px; line-height: 1.5;">
        Congratulations! The client has approved the offer. You can now proceed with the next steps in the process.
      </p>
    ` : `
      <p style="color: #666666; font-family: Arial, sans-serif; font-size: 16px; line-height: 1.5;">
        Unfortunately, the client has rejected the offer. You may review the feedback and make necessary adjustments if applicable.
      </p>
    `}
  `;

  const finalHtml = emailTemplate.replace(
    '{{DYNAMIC_CONTENT}}',
    generateDynamicContent(
      `Offer ${statusText}`,
      `${offer?.proposal?.consultant?.firstName} ${offer?.proposal?.consultant?.lastName}`,
      dynamicContent
    )
  );

  await sendEmail({
    to: offer?.proposal?.consultant?.email,
    subject: `Offer ${statusText} - Expertree`,
    html: finalHtml
  });
};

const sendProposalDecisionNotificationToSubClient = async (subClient, client, proposal, decision) => {
  console.log('sendProposalDecisionNotificationToSubClient called:', subClient, client, proposal, decision);
  if (!subClient?.email) {
    console.warn('Sub-client email not found for proposal decision notification');
    return;
  }

  const isApproved = decision === 'approved';
  const decisionText = isApproved ? 'approved' : 'rejected';
  const decisionColor = isApproved ? '#28a745' : '#dc3545';
  const decisionBgColor = isApproved ? '#f8fff9' : '#fff8f8';

  const dynamicContent = `
    <p style="color: #666666; font-family: Arial, sans-serif; font-size: 16px; line-height: 1.5;">
      Your proposal has been ${decisionText} by ${client.accountOwnerFirstName && client.accountOwnerLastName
      ? `${client.accountOwnerFirstName} ${client.accountOwnerLastName}`
      : 'client'}, and its sent to the consultant for acceptance.
    </p>
    <div style="background-color: ${decisionBgColor}; padding: 20px; margin: 20px 0; border-radius: 5px; border-left: 4px solid ${decisionColor};">
      <h3 style="color: #333333; margin-top: 0;">Proposal Details:</h3>
      <ul style="color: #666666; font-family: Arial, sans-serif; font-size: 16px; line-height: 1.5;">
        <li><strong>Mission Location:</strong> ${proposal.missionLocation}</li>
        <li><strong>Type of Work:</strong> ${proposal.typeOfWork}</li>
        <li><strong>Start Date:</strong> ${new Date(proposal.startDate).toLocaleDateString()}</li>
        <li><strong>End Date:</strong> ${new Date(proposal.endDate).toLocaleDateString()}</li>
        <li><strong>All in Hourly Rate:</strong> ${proposal.fees} CHF</li>
  
      </ul>
    </div>
    ${isApproved ? `
      <p style="color: #666666; font-family: Arial, sans-serif; font-size: 16px; line-height: 1.5;">
        Congratulations! The client has approved your proposal. You can now proceed with the next steps in the process.
      </p>
    ` : `
      <p style="color: #666666; font-family: Arial, sans-serif; font-size: 16px; line-height: 1.5;">
        Unfortunately, the client has rejected your proposal. You may review the feedback and make necessary adjustments if applicable.
      </p>
    `}
    <p style="text-align: center; margin: 30px 0;">
      <a href="${loginPage}" 
         style="background-color: ${decisionColor}; 
                color: white; 
                padding: 12px 25px; 
                text-decoration: none; 
                border-radius: 5px; 
                font-family: Arial, sans-serif;">
        View Proposal Details
      </a>
    </p>
  `;

  const finalHtml = emailTemplate.replace(
    '{{DYNAMIC_CONTENT}}',
    generateDynamicContent(
      `Proposal ${isApproved ? 'Approved' : 'Rejected'}`,
      `${subClient.accountOwnerFirstName && subClient.accountOwnerLastName
        ? `${subClient.accountOwnerFirstName} ${subClient.accountOwnerLastName}`
        : 'sub-client'}`,
      dynamicContent
    )
  );

  await sendEmail({
    to: subClient.email,
    subject: `Proposal ${isApproved ? 'Approved' : 'Rejected'} - Expertree`,
    html: finalHtml
  });
};


const handleErrorResponse = async (error, data) => {
  console.log("handleErrorResponse: someting went wrong", error);
  if (error instanceof Object) console.error(JSON.stringify(error, null, 2));
  throw { status: 400, error: error.details || error, data: data || null };
}


module.exports = {
  handleErrorResponse,
  sendWelcomeEmail,
  sendEmailForActivatedUser,
  generateUniqueIdByEmail,
  sendOtpForUser,
  sendProposalNotificationEmail,
  sendProposalStatusChangeEmail,
  sendMissionContractSigningEmail,
  sendProjectLaunchEmail,
  sendProjectFinishEmail,
  sendTimesheetSubmittedEmail,
  sendTimesheetApprovedEmail,
  sendTimesheetRejectedEmail,
  sendConsultantRejectionEmail,
  sendProposalApprovalRequestEmail,
  sendProposalDecisionNotificationToSubClient,
  sendOfferStatusChangeEmailByClient
};
