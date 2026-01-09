import type { Schema, Attribute } from '@strapi/strapi';

export interface UserActivationHistory extends Schema.Component {
  collectionName: 'components_user_activation_history';
  info: {
    displayName: 'Activation History';
    description: 'Track the history of user activation and deactivation';
  };
  attributes: {
    action: Attribute.Enumeration<['Activated', 'Deactivated']> &
      Attribute.Required;
    actedBy: Attribute.Relation<
      'user.activation-history',
      'manyToOne',
      'plugin::users-permissions.user'
    > &
      Attribute.Required;
    actedAt: Attribute.DateTime & Attribute.Required;
    comment: Attribute.Text;
  };
}

export interface TimeSheetWorkingDays extends Schema.Component {
  collectionName: 'components_time_sheet_working_days';
  info: {
    displayName: 'Working Days';
    icon: 'clock';
    description: '';
  };
  attributes: {
    day: Attribute.Date & Attribute.Required;
    numberOfHoursWorked: Attribute.Decimal & Attribute.Required;
    expense: Attribute.Decimal & Attribute.Required;
    overtime: Attribute.Decimal;
  };
}

export interface ProposalFeedback extends Schema.Component {
  collectionName: 'components_proposal_feedback';
  info: {
    displayName: 'Feedback';
    description: 'Store feedback and comments on proposals';
  };
  attributes: {
    comment: Attribute.Text & Attribute.Required;
    providedBy: Attribute.Relation<
      'proposal.feedback',
      'manyToOne',
      'plugin::users-permissions.user'
    > &
      Attribute.Required;
    providedAt: Attribute.DateTime & Attribute.Required;
    isResolved: Attribute.Boolean & Attribute.DefaultTo<false>;
    resolvedAt: Attribute.DateTime;
  };
}

export interface ProposalApprovalHistory extends Schema.Component {
  collectionName: 'components_proposal_approval_history';
  info: {
    displayName: 'Approval History';
    description: 'Track the history of proposal approvals and rejections';
  };
  attributes: {
    action: Attribute.Enumeration<
      ['Submitted', 'Approved', 'Rejected', 'FeedbackProvided', 'Resubmitted']
    > &
      Attribute.Required;
    status: Attribute.String & Attribute.Required;
    comment: Attribute.Text;
    actedBy: Attribute.Relation<
      'proposal.approval-history',
      'manyToOne',
      'plugin::users-permissions.user'
    >;
    actedAt: Attribute.DateTime & Attribute.Required;
  };
}

export interface OfferOfferHistory extends Schema.Component {
  collectionName: 'components_offer_history';
  info: {
    displayName: 'Offer History';
    description: 'Track the history of offer status changes';
  };
  attributes: {
    action: Attribute.Enumeration<
      [
        'Created',
        'L3Signed',
        'L1Approved',
        'L1Rejected',
        'POSubmitted',
        'POApproved',
        'PORejected',
        'POExpired',
        'ProjectStarted'
      ]
    > &
      Attribute.Required;
    actedBy: Attribute.Relation<
      'offer.offer-history',
      'manyToOne',
      'plugin::users-permissions.user'
    > &
      Attribute.Required;
    actedAt: Attribute.DateTime & Attribute.Required;
    comment: Attribute.Text;
    previousStatus: Attribute.String;
    newStatus: Attribute.String & Attribute.Required;
  };
}

export interface LayoutHeader extends Schema.Component {
  collectionName: 'components_layout_headers';
  info: {
    displayName: 'Header';
  };
  attributes: {
    logoText: Attribute.Component<'components.link'>;
    ctaButton: Attribute.Component<'components.link'>;
  };
}

export interface LayoutFooter extends Schema.Component {
  collectionName: 'components_layout_footers';
  info: {
    displayName: 'Footer';
  };
  attributes: {
    logoText: Attribute.Component<'components.link'>;
    text: Attribute.Text;
    socialLink: Attribute.Component<'components.link', true>;
  };
}

export interface ConsultantPreferences extends Schema.Component {
  collectionName: 'preferences';
  info: {
    name: 'preference';
    icon: 'globe';
    displayName: 'preference';
    description: 'preference';
  };
  attributes: {
    daysAvailable: Attribute.Integer;
    industries: Attribute.Relation<
      'consultant.preferences',
      'oneToMany',
      'api::industry.industry'
    >;
    preferredLocationOfWork: Attribute.Relation<
      'consultant.preferences',
      'oneToMany',
      'api::canton.canton'
    >;
    skills: Attribute.Relation<
      'consultant.preferences',
      'oneToMany',
      'api::skill.skill'
    >;
    availableDate: Attribute.Date;
    rate: Attribute.Decimal;
    homeOfficePercentage: Attribute.Decimal;
  };
}

export interface ConsultantLanguages extends Schema.Component {
  collectionName: 'languages';
  info: {
    name: 'language';
    icon: 'globe';
    displayName: 'Language';
    description: 'Language is a system of communication consisting of sounds, words, and grammar, or the system of communication used by people in a particular country or type of work.';
  };
  attributes: {
    language: Attribute.String;
    level: Attribute.Enumeration<['A1', 'A2', 'B1', 'B2', 'C1', 'C2']>;
  };
}

export interface ConsultantExperiences extends Schema.Component {
  collectionName: 'experiences';
  info: {
    name: 'experience';
    icon: 'briefcase';
    displayName: 'Experience';
    description: 'A work experience';
  };
  attributes: {
    title: Attribute.String;
    employer: Attribute.String;
    startDate: Attribute.Date;
    endDate: Attribute.Date;
    details: Attribute.Text;
    currentlyWorking: Attribute.Boolean & Attribute.DefaultTo<false>;
  };
}

export interface ConsultantEducations extends Schema.Component {
  collectionName: 'education_entries';
  info: {
    name: 'education-entry';
    icon: 'graduation-cap';
    displayName: 'Education';
    description: 'Education entries';
  };
  attributes: {
    title: Attribute.String;
    startDate: Attribute.Date;
    endDate: Attribute.Date;
    institution: Attribute.String;
    details: Attribute.Text;
  };
}

export interface ConsultantBankingInfo extends Schema.Component {
  collectionName: 'banking_infos';
  info: {
    name: 'banking-info';
    icon: 'money-bill-wave';
    displayName: 'Banking Info';
    description: 'Banking Info';
  };
  attributes: {
    iban: Attribute.String;
    bankName: Attribute.String;
    street: Attribute.String;
    number: Attribute.String;
    areaPostalCodes: Attribute.String;
    commune: Attribute.String;
    canton: Attribute.Relation<
      'consultant.banking-info',
      'oneToOne',
      'api::canton.canton'
    >;
    country: Attribute.String;
    holderFirstName: Attribute.String;
    holderLastName: Attribute.String;
  };
}

export interface ComponentsLink extends Schema.Component {
  collectionName: 'components_components_links';
  info: {
    displayName: 'Link';
  };
  attributes: {
    url: Attribute.String;
    text: Attribute.String;
    isExternal: Attribute.Boolean & Attribute.DefaultTo<false>;
  };
}

declare module '@strapi/types' {
  export module Shared {
    export interface Components {
      'user.activation-history': UserActivationHistory;
      'time-sheet.working-days': TimeSheetWorkingDays;
      'proposal.feedback': ProposalFeedback;
      'proposal.approval-history': ProposalApprovalHistory;
      'offer.offer-history': OfferOfferHistory;
      'layout.header': LayoutHeader;
      'layout.footer': LayoutFooter;
      'consultant.preferences': ConsultantPreferences;
      'consultant.languages': ConsultantLanguages;
      'consultant.experiences': ConsultantExperiences;
      'consultant.educations': ConsultantEducations;
      'consultant.banking-info': ConsultantBankingInfo;
      'components.link': ComponentsLink;
    }
  }
}
