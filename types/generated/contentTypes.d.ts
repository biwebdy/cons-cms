import type { Schema, Attribute } from '@strapi/strapi';

export interface AdminPermission extends Schema.CollectionType {
  collectionName: 'admin_permissions';
  info: {
    name: 'Permission';
    description: '';
    singularName: 'permission';
    pluralName: 'permissions';
    displayName: 'Permission';
  };
  pluginOptions: {
    'content-manager': {
      visible: false;
    };
    'content-type-builder': {
      visible: false;
    };
  };
  attributes: {
    action: Attribute.String &
      Attribute.Required &
      Attribute.SetMinMaxLength<{
        minLength: 1;
      }>;
    actionParameters: Attribute.JSON & Attribute.DefaultTo<{}>;
    subject: Attribute.String &
      Attribute.SetMinMaxLength<{
        minLength: 1;
      }>;
    properties: Attribute.JSON & Attribute.DefaultTo<{}>;
    conditions: Attribute.JSON & Attribute.DefaultTo<[]>;
    role: Attribute.Relation<'admin::permission', 'manyToOne', 'admin::role'>;
    createdAt: Attribute.DateTime;
    updatedAt: Attribute.DateTime;
    createdBy: Attribute.Relation<
      'admin::permission',
      'oneToOne',
      'admin::user'
    > &
      Attribute.Private;
    updatedBy: Attribute.Relation<
      'admin::permission',
      'oneToOne',
      'admin::user'
    > &
      Attribute.Private;
  };
}

export interface AdminUser extends Schema.CollectionType {
  collectionName: 'admin_users';
  info: {
    name: 'User';
    description: '';
    singularName: 'user';
    pluralName: 'users';
    displayName: 'User';
  };
  pluginOptions: {
    'content-manager': {
      visible: false;
    };
    'content-type-builder': {
      visible: false;
    };
  };
  attributes: {
    firstname: Attribute.String &
      Attribute.SetMinMaxLength<{
        minLength: 1;
      }>;
    lastname: Attribute.String &
      Attribute.SetMinMaxLength<{
        minLength: 1;
      }>;
    username: Attribute.String;
    email: Attribute.Email &
      Attribute.Required &
      Attribute.Private &
      Attribute.Unique &
      Attribute.SetMinMaxLength<{
        minLength: 6;
      }>;
    password: Attribute.Password &
      Attribute.Private &
      Attribute.SetMinMaxLength<{
        minLength: 6;
      }>;
    resetPasswordToken: Attribute.String & Attribute.Private;
    registrationToken: Attribute.String & Attribute.Private;
    isActive: Attribute.Boolean &
      Attribute.Private &
      Attribute.DefaultTo<false>;
    roles: Attribute.Relation<'admin::user', 'manyToMany', 'admin::role'> &
      Attribute.Private;
    blocked: Attribute.Boolean & Attribute.Private & Attribute.DefaultTo<false>;
    preferedLanguage: Attribute.String;
    createdAt: Attribute.DateTime;
    updatedAt: Attribute.DateTime;
    createdBy: Attribute.Relation<'admin::user', 'oneToOne', 'admin::user'> &
      Attribute.Private;
    updatedBy: Attribute.Relation<'admin::user', 'oneToOne', 'admin::user'> &
      Attribute.Private;
  };
}

export interface AdminRole extends Schema.CollectionType {
  collectionName: 'admin_roles';
  info: {
    name: 'Role';
    description: '';
    singularName: 'role';
    pluralName: 'roles';
    displayName: 'Role';
  };
  pluginOptions: {
    'content-manager': {
      visible: false;
    };
    'content-type-builder': {
      visible: false;
    };
  };
  attributes: {
    name: Attribute.String &
      Attribute.Required &
      Attribute.Unique &
      Attribute.SetMinMaxLength<{
        minLength: 1;
      }>;
    code: Attribute.String &
      Attribute.Required &
      Attribute.Unique &
      Attribute.SetMinMaxLength<{
        minLength: 1;
      }>;
    description: Attribute.String;
    users: Attribute.Relation<'admin::role', 'manyToMany', 'admin::user'>;
    permissions: Attribute.Relation<
      'admin::role',
      'oneToMany',
      'admin::permission'
    >;
    createdAt: Attribute.DateTime;
    updatedAt: Attribute.DateTime;
    createdBy: Attribute.Relation<'admin::role', 'oneToOne', 'admin::user'> &
      Attribute.Private;
    updatedBy: Attribute.Relation<'admin::role', 'oneToOne', 'admin::user'> &
      Attribute.Private;
  };
}

export interface AdminApiToken extends Schema.CollectionType {
  collectionName: 'strapi_api_tokens';
  info: {
    name: 'Api Token';
    singularName: 'api-token';
    pluralName: 'api-tokens';
    displayName: 'Api Token';
    description: '';
  };
  pluginOptions: {
    'content-manager': {
      visible: false;
    };
    'content-type-builder': {
      visible: false;
    };
  };
  attributes: {
    name: Attribute.String &
      Attribute.Required &
      Attribute.Unique &
      Attribute.SetMinMaxLength<{
        minLength: 1;
      }>;
    description: Attribute.String &
      Attribute.SetMinMaxLength<{
        minLength: 1;
      }> &
      Attribute.DefaultTo<''>;
    type: Attribute.Enumeration<['read-only', 'full-access', 'custom']> &
      Attribute.Required &
      Attribute.DefaultTo<'read-only'>;
    accessKey: Attribute.String &
      Attribute.Required &
      Attribute.SetMinMaxLength<{
        minLength: 1;
      }>;
    lastUsedAt: Attribute.DateTime;
    permissions: Attribute.Relation<
      'admin::api-token',
      'oneToMany',
      'admin::api-token-permission'
    >;
    expiresAt: Attribute.DateTime;
    lifespan: Attribute.BigInteger;
    createdAt: Attribute.DateTime;
    updatedAt: Attribute.DateTime;
    createdBy: Attribute.Relation<
      'admin::api-token',
      'oneToOne',
      'admin::user'
    > &
      Attribute.Private;
    updatedBy: Attribute.Relation<
      'admin::api-token',
      'oneToOne',
      'admin::user'
    > &
      Attribute.Private;
  };
}

export interface AdminApiTokenPermission extends Schema.CollectionType {
  collectionName: 'strapi_api_token_permissions';
  info: {
    name: 'API Token Permission';
    description: '';
    singularName: 'api-token-permission';
    pluralName: 'api-token-permissions';
    displayName: 'API Token Permission';
  };
  pluginOptions: {
    'content-manager': {
      visible: false;
    };
    'content-type-builder': {
      visible: false;
    };
  };
  attributes: {
    action: Attribute.String &
      Attribute.Required &
      Attribute.SetMinMaxLength<{
        minLength: 1;
      }>;
    token: Attribute.Relation<
      'admin::api-token-permission',
      'manyToOne',
      'admin::api-token'
    >;
    createdAt: Attribute.DateTime;
    updatedAt: Attribute.DateTime;
    createdBy: Attribute.Relation<
      'admin::api-token-permission',
      'oneToOne',
      'admin::user'
    > &
      Attribute.Private;
    updatedBy: Attribute.Relation<
      'admin::api-token-permission',
      'oneToOne',
      'admin::user'
    > &
      Attribute.Private;
  };
}

export interface AdminTransferToken extends Schema.CollectionType {
  collectionName: 'strapi_transfer_tokens';
  info: {
    name: 'Transfer Token';
    singularName: 'transfer-token';
    pluralName: 'transfer-tokens';
    displayName: 'Transfer Token';
    description: '';
  };
  pluginOptions: {
    'content-manager': {
      visible: false;
    };
    'content-type-builder': {
      visible: false;
    };
  };
  attributes: {
    name: Attribute.String &
      Attribute.Required &
      Attribute.Unique &
      Attribute.SetMinMaxLength<{
        minLength: 1;
      }>;
    description: Attribute.String &
      Attribute.SetMinMaxLength<{
        minLength: 1;
      }> &
      Attribute.DefaultTo<''>;
    accessKey: Attribute.String &
      Attribute.Required &
      Attribute.SetMinMaxLength<{
        minLength: 1;
      }>;
    lastUsedAt: Attribute.DateTime;
    permissions: Attribute.Relation<
      'admin::transfer-token',
      'oneToMany',
      'admin::transfer-token-permission'
    >;
    expiresAt: Attribute.DateTime;
    lifespan: Attribute.BigInteger;
    createdAt: Attribute.DateTime;
    updatedAt: Attribute.DateTime;
    createdBy: Attribute.Relation<
      'admin::transfer-token',
      'oneToOne',
      'admin::user'
    > &
      Attribute.Private;
    updatedBy: Attribute.Relation<
      'admin::transfer-token',
      'oneToOne',
      'admin::user'
    > &
      Attribute.Private;
  };
}

export interface AdminTransferTokenPermission extends Schema.CollectionType {
  collectionName: 'strapi_transfer_token_permissions';
  info: {
    name: 'Transfer Token Permission';
    description: '';
    singularName: 'transfer-token-permission';
    pluralName: 'transfer-token-permissions';
    displayName: 'Transfer Token Permission';
  };
  pluginOptions: {
    'content-manager': {
      visible: false;
    };
    'content-type-builder': {
      visible: false;
    };
  };
  attributes: {
    action: Attribute.String &
      Attribute.Required &
      Attribute.SetMinMaxLength<{
        minLength: 1;
      }>;
    token: Attribute.Relation<
      'admin::transfer-token-permission',
      'manyToOne',
      'admin::transfer-token'
    >;
    createdAt: Attribute.DateTime;
    updatedAt: Attribute.DateTime;
    createdBy: Attribute.Relation<
      'admin::transfer-token-permission',
      'oneToOne',
      'admin::user'
    > &
      Attribute.Private;
    updatedBy: Attribute.Relation<
      'admin::transfer-token-permission',
      'oneToOne',
      'admin::user'
    > &
      Attribute.Private;
  };
}

export interface PluginUploadFile extends Schema.CollectionType {
  collectionName: 'files';
  info: {
    singularName: 'file';
    pluralName: 'files';
    displayName: 'File';
    description: '';
  };
  pluginOptions: {
    'content-manager': {
      visible: false;
    };
    'content-type-builder': {
      visible: false;
    };
  };
  attributes: {
    name: Attribute.String & Attribute.Required;
    alternativeText: Attribute.String;
    caption: Attribute.String;
    width: Attribute.Integer;
    height: Attribute.Integer;
    formats: Attribute.JSON;
    hash: Attribute.String & Attribute.Required;
    ext: Attribute.String;
    mime: Attribute.String & Attribute.Required;
    size: Attribute.Decimal & Attribute.Required;
    url: Attribute.String & Attribute.Required;
    previewUrl: Attribute.String;
    provider: Attribute.String & Attribute.Required;
    provider_metadata: Attribute.JSON;
    related: Attribute.Relation<'plugin::upload.file', 'morphToMany'>;
    folder: Attribute.Relation<
      'plugin::upload.file',
      'manyToOne',
      'plugin::upload.folder'
    > &
      Attribute.Private;
    folderPath: Attribute.String &
      Attribute.Required &
      Attribute.Private &
      Attribute.SetMinMax<
        {
          min: 1;
        },
        number
      >;
    createdAt: Attribute.DateTime;
    updatedAt: Attribute.DateTime;
    createdBy: Attribute.Relation<
      'plugin::upload.file',
      'oneToOne',
      'admin::user'
    > &
      Attribute.Private;
    updatedBy: Attribute.Relation<
      'plugin::upload.file',
      'oneToOne',
      'admin::user'
    > &
      Attribute.Private;
  };
}

export interface PluginUploadFolder extends Schema.CollectionType {
  collectionName: 'upload_folders';
  info: {
    singularName: 'folder';
    pluralName: 'folders';
    displayName: 'Folder';
  };
  pluginOptions: {
    'content-manager': {
      visible: false;
    };
    'content-type-builder': {
      visible: false;
    };
  };
  attributes: {
    name: Attribute.String &
      Attribute.Required &
      Attribute.SetMinMax<
        {
          min: 1;
        },
        number
      >;
    pathId: Attribute.Integer & Attribute.Required & Attribute.Unique;
    parent: Attribute.Relation<
      'plugin::upload.folder',
      'manyToOne',
      'plugin::upload.folder'
    >;
    children: Attribute.Relation<
      'plugin::upload.folder',
      'oneToMany',
      'plugin::upload.folder'
    >;
    files: Attribute.Relation<
      'plugin::upload.folder',
      'oneToMany',
      'plugin::upload.file'
    >;
    path: Attribute.String &
      Attribute.Required &
      Attribute.SetMinMax<
        {
          min: 1;
        },
        number
      >;
    createdAt: Attribute.DateTime;
    updatedAt: Attribute.DateTime;
    createdBy: Attribute.Relation<
      'plugin::upload.folder',
      'oneToOne',
      'admin::user'
    > &
      Attribute.Private;
    updatedBy: Attribute.Relation<
      'plugin::upload.folder',
      'oneToOne',
      'admin::user'
    > &
      Attribute.Private;
  };
}

export interface PluginContentReleasesRelease extends Schema.CollectionType {
  collectionName: 'strapi_releases';
  info: {
    singularName: 'release';
    pluralName: 'releases';
    displayName: 'Release';
  };
  options: {
    draftAndPublish: false;
  };
  pluginOptions: {
    'content-manager': {
      visible: false;
    };
    'content-type-builder': {
      visible: false;
    };
  };
  attributes: {
    name: Attribute.String & Attribute.Required;
    releasedAt: Attribute.DateTime;
    scheduledAt: Attribute.DateTime;
    timezone: Attribute.String;
    status: Attribute.Enumeration<
      ['ready', 'blocked', 'failed', 'done', 'empty']
    > &
      Attribute.Required;
    actions: Attribute.Relation<
      'plugin::content-releases.release',
      'oneToMany',
      'plugin::content-releases.release-action'
    >;
    createdAt: Attribute.DateTime;
    updatedAt: Attribute.DateTime;
    createdBy: Attribute.Relation<
      'plugin::content-releases.release',
      'oneToOne',
      'admin::user'
    > &
      Attribute.Private;
    updatedBy: Attribute.Relation<
      'plugin::content-releases.release',
      'oneToOne',
      'admin::user'
    > &
      Attribute.Private;
  };
}

export interface PluginContentReleasesReleaseAction
  extends Schema.CollectionType {
  collectionName: 'strapi_release_actions';
  info: {
    singularName: 'release-action';
    pluralName: 'release-actions';
    displayName: 'Release Action';
  };
  options: {
    draftAndPublish: false;
  };
  pluginOptions: {
    'content-manager': {
      visible: false;
    };
    'content-type-builder': {
      visible: false;
    };
  };
  attributes: {
    type: Attribute.Enumeration<['publish', 'unpublish']> & Attribute.Required;
    entry: Attribute.Relation<
      'plugin::content-releases.release-action',
      'morphToOne'
    >;
    contentType: Attribute.String & Attribute.Required;
    locale: Attribute.String;
    release: Attribute.Relation<
      'plugin::content-releases.release-action',
      'manyToOne',
      'plugin::content-releases.release'
    >;
    isEntryValid: Attribute.Boolean;
    createdAt: Attribute.DateTime;
    updatedAt: Attribute.DateTime;
    createdBy: Attribute.Relation<
      'plugin::content-releases.release-action',
      'oneToOne',
      'admin::user'
    > &
      Attribute.Private;
    updatedBy: Attribute.Relation<
      'plugin::content-releases.release-action',
      'oneToOne',
      'admin::user'
    > &
      Attribute.Private;
  };
}

export interface PluginUsersPermissionsPermission
  extends Schema.CollectionType {
  collectionName: 'up_permissions';
  info: {
    name: 'permission';
    description: '';
    singularName: 'permission';
    pluralName: 'permissions';
    displayName: 'Permission';
  };
  pluginOptions: {
    'content-manager': {
      visible: false;
    };
    'content-type-builder': {
      visible: false;
    };
  };
  attributes: {
    action: Attribute.String & Attribute.Required;
    role: Attribute.Relation<
      'plugin::users-permissions.permission',
      'manyToOne',
      'plugin::users-permissions.role'
    >;
    createdAt: Attribute.DateTime;
    updatedAt: Attribute.DateTime;
    createdBy: Attribute.Relation<
      'plugin::users-permissions.permission',
      'oneToOne',
      'admin::user'
    > &
      Attribute.Private;
    updatedBy: Attribute.Relation<
      'plugin::users-permissions.permission',
      'oneToOne',
      'admin::user'
    > &
      Attribute.Private;
  };
}

export interface PluginUsersPermissionsRole extends Schema.CollectionType {
  collectionName: 'up_roles';
  info: {
    name: 'role';
    description: '';
    singularName: 'role';
    pluralName: 'roles';
    displayName: 'Role';
  };
  pluginOptions: {
    'content-manager': {
      visible: false;
    };
    'content-type-builder': {
      visible: false;
    };
  };
  attributes: {
    name: Attribute.String &
      Attribute.Required &
      Attribute.SetMinMaxLength<{
        minLength: 3;
      }>;
    description: Attribute.String;
    type: Attribute.String & Attribute.Unique;
    permissions: Attribute.Relation<
      'plugin::users-permissions.role',
      'oneToMany',
      'plugin::users-permissions.permission'
    >;
    users: Attribute.Relation<
      'plugin::users-permissions.role',
      'oneToMany',
      'plugin::users-permissions.user'
    >;
    createdAt: Attribute.DateTime;
    updatedAt: Attribute.DateTime;
    createdBy: Attribute.Relation<
      'plugin::users-permissions.role',
      'oneToOne',
      'admin::user'
    > &
      Attribute.Private;
    updatedBy: Attribute.Relation<
      'plugin::users-permissions.role',
      'oneToOne',
      'admin::user'
    > &
      Attribute.Private;
  };
}

export interface PluginUsersPermissionsUser extends Schema.CollectionType {
  collectionName: 'up_users';
  info: {
    name: 'user';
    description: '';
    singularName: 'user';
    pluralName: 'users';
    displayName: 'User';
  };
  options: {
    draftAndPublish: false;
  };
  attributes: {
    username: Attribute.String &
      Attribute.Required &
      Attribute.Unique &
      Attribute.SetMinMaxLength<{
        minLength: 3;
      }>;
    email: Attribute.Email &
      Attribute.Required &
      Attribute.SetMinMaxLength<{
        minLength: 6;
      }>;
    provider: Attribute.String;
    password: Attribute.Password &
      Attribute.Private &
      Attribute.SetMinMaxLength<{
        minLength: 6;
      }>;
    resetPasswordToken: Attribute.String & Attribute.Private;
    confirmationToken: Attribute.String & Attribute.Private;
    confirmed: Attribute.Boolean & Attribute.DefaultTo<false>;
    blocked: Attribute.Boolean & Attribute.DefaultTo<false>;
    role: Attribute.Relation<
      'plugin::users-permissions.user',
      'manyToOne',
      'plugin::users-permissions.role'
    >;
    firstName: Attribute.String;
    lastName: Attribute.String;
    bio: Attribute.Text;
    credits: Attribute.Integer & Attribute.DefaultTo<0>;
    image: Attribute.Media<'images'>;
    passwordChanged: Attribute.Boolean & Attribute.DefaultTo<false>;
    consultant: Attribute.Relation<
      'plugin::users-permissions.user',
      'oneToOne',
      'api::consultant.consultant'
    >;
    client: Attribute.Relation<
      'plugin::users-permissions.user',
      'oneToOne',
      'api::client.client'
    >;
    isActive: Attribute.Boolean & Attribute.DefaultTo<true>;
    createdBy: Attribute.Relation<
      'plugin::users-permissions.user',
      'oneToOne',
      'admin::user'
    > &
      Attribute.Private;
    activationHistory: Attribute.Component<'user.activation-history', true>;
    createdAt: Attribute.DateTime;
    updatedAt: Attribute.DateTime;
    updatedBy: Attribute.Relation<
      'plugin::users-permissions.user',
      'oneToOne',
      'admin::user'
    > &
      Attribute.Private;
  };
}

export interface PluginI18NLocale extends Schema.CollectionType {
  collectionName: 'i18n_locale';
  info: {
    singularName: 'locale';
    pluralName: 'locales';
    collectionName: 'locales';
    displayName: 'Locale';
    description: '';
  };
  options: {
    draftAndPublish: false;
  };
  pluginOptions: {
    'content-manager': {
      visible: false;
    };
    'content-type-builder': {
      visible: false;
    };
  };
  attributes: {
    name: Attribute.String &
      Attribute.SetMinMax<
        {
          min: 1;
          max: 50;
        },
        number
      >;
    code: Attribute.String & Attribute.Unique;
    createdAt: Attribute.DateTime;
    updatedAt: Attribute.DateTime;
    createdBy: Attribute.Relation<
      'plugin::i18n.locale',
      'oneToOne',
      'admin::user'
    > &
      Attribute.Private;
    updatedBy: Attribute.Relation<
      'plugin::i18n.locale',
      'oneToOne',
      'admin::user'
    > &
      Attribute.Private;
  };
}

export interface ApiCantonCanton extends Schema.CollectionType {
  collectionName: 'cantons';
  info: {
    singularName: 'canton';
    pluralName: 'cantons';
    displayName: 'canton';
  };
  options: {
    draftAndPublish: false;
  };
  attributes: {
    name: Attribute.String & Attribute.Required;
    isActive: Attribute.Boolean & Attribute.DefaultTo<true>;
    createdAt: Attribute.DateTime;
    updatedAt: Attribute.DateTime;
    createdBy: Attribute.Relation<
      'api::canton.canton',
      'oneToOne',
      'admin::user'
    > &
      Attribute.Private;
    updatedBy: Attribute.Relation<
      'api::canton.canton',
      'oneToOne',
      'admin::user'
    > &
      Attribute.Private;
  };
}

export interface ApiClientClient extends Schema.CollectionType {
  collectionName: 'clients';
  info: {
    singularName: 'client';
    pluralName: 'clients';
    displayName: 'client';
    description: '';
  };
  options: {
    draftAndPublish: false;
  };
  attributes: {
    client_id: Attribute.String;
    email: Attribute.Email &
      Attribute.Required &
      Attribute.SetMinMaxLength<{
        minLength: 6;
      }>;
    street: Attribute.String;
    number: Attribute.String;
    areaPostalCodes: Attribute.String;
    commune: Attribute.String;
    canton: Attribute.Relation<
      'api::client.client',
      'oneToOne',
      'api::canton.canton'
    >;
    country: Attribute.String;
    isActive: Attribute.Boolean &
      Attribute.Required &
      Attribute.DefaultTo<true>;
    name: Attribute.String & Attribute.Required;
    details: Attribute.Text;
    accountOwnerFirstName: Attribute.String;
    accountOwnerLastName: Attribute.String;
    logo: Attribute.Media<'images' | 'videos' | 'audios'>;
    attachment: Attribute.Media<'images' | 'files', true>;
    user: Attribute.Relation<
      'api::client.client',
      'oneToOne',
      'plugin::users-permissions.user'
    >;
    projects: Attribute.Relation<
      'api::client.client',
      'oneToMany',
      'api::project.project'
    >;
    invoices: Attribute.Relation<
      'api::client.client',
      'oneToMany',
      'api::invoice.invoice'
    >;
    proposals: Attribute.Relation<
      'api::client.client',
      'oneToMany',
      'api::proposal.proposal'
    >;
    phoneNumber: Attribute.Text;
    deletedUserData: Attribute.JSON & Attribute.Private;
    isDeleted: Attribute.Boolean &
      Attribute.Required &
      Attribute.DefaultTo<false>;
    parentClient: Attribute.Relation<
      'api::client.client',
      'oneToOne',
      'api::client.client'
    >;
    createdAt: Attribute.DateTime;
    updatedAt: Attribute.DateTime;
    createdBy: Attribute.Relation<
      'api::client.client',
      'oneToOne',
      'admin::user'
    > &
      Attribute.Private;
    updatedBy: Attribute.Relation<
      'api::client.client',
      'oneToOne',
      'admin::user'
    > &
      Attribute.Private;
  };
}

export interface ApiClientRegistrationFormClientRegistrationForm
  extends Schema.CollectionType {
  collectionName: 'client_registration_forms';
  info: {
    singularName: 'client-registration-form';
    pluralName: 'client-registration-forms';
    displayName: 'Client Registration Form';
    description: '';
  };
  options: {
    draftAndPublish: true;
  };
  attributes: {
    name: Attribute.String;
    companyName: Attribute.String;
    message: Attribute.Text;
    email: Attribute.Email;
    phoneNumber: Attribute.String;
    createdAt: Attribute.DateTime;
    updatedAt: Attribute.DateTime;
    publishedAt: Attribute.DateTime;
    createdBy: Attribute.Relation<
      'api::client-registration-form.client-registration-form',
      'oneToOne',
      'admin::user'
    > &
      Attribute.Private;
    updatedBy: Attribute.Relation<
      'api::client-registration-form.client-registration-form',
      'oneToOne',
      'admin::user'
    > &
      Attribute.Private;
  };
}

export interface ApiConsultantConsultant extends Schema.CollectionType {
  collectionName: 'consultants';
  info: {
    singularName: 'consultant';
    pluralName: 'consultants';
    displayName: 'consultant';
    description: '';
  };
  options: {
    draftAndPublish: false;
  };
  attributes: {
    consultant_id: Attribute.String;
    firstName: Attribute.String & Attribute.Required;
    lastName: Attribute.String & Attribute.Required;
    email: Attribute.Email & Attribute.Required;
    phoneNumber: Attribute.String;
    resume: Attribute.Media<'files'> & Attribute.Required;
    percentageCompletion: Attribute.Decimal & Attribute.DefaultTo<16>;
    profileCompleted: Attribute.Boolean & Attribute.DefaultTo<false>;
    gender: Attribute.Enumeration<['Male', 'Female', 'Others']>;
    dob: Attribute.Date & Attribute.Required;
    street: Attribute.String;
    number: Attribute.String;
    areaPostalCodes: Attribute.String;
    commune: Attribute.String;
    canton: Attribute.Relation<
      'api::consultant.consultant',
      'oneToOne',
      'api::canton.canton'
    >;
    country: Attribute.String;
    nationality: Attribute.String;
    about: Attribute.Text;
    mostRecentDiploma: Attribute.Text;
    profilePicture: Attribute.Media;
    attachment: Attribute.Media<'images' | 'files', true>;
    bankingInfo: Attribute.Component<'consultant.banking-info'>;
    experience: Attribute.Component<'consultant.experiences', true>;
    languages: Attribute.Component<'consultant.languages', true>;
    education: Attribute.Component<'consultant.educations', true>;
    preferences: Attribute.Component<'consultant.preferences'>;
    user: Attribute.Relation<
      'api::consultant.consultant',
      'oneToOne',
      'plugin::users-permissions.user'
    >;
    civilStatus: Attribute.Enumeration<
      ['Single', 'Married', 'Separated', 'Divorced', 'Widowed']
    >;
    residencyPermit: Attribute.Enumeration<
      ['B permit', 'C permit', 'Swiss Citizenship', 'No permit', 'Others']
    >;
    socialSecurityNumber: Attribute.String;
    frameworkContract: Attribute.Media<
      'images' | 'files' | 'videos' | 'audios',
      true
    >;
    frameworkContractEnvelopID: Attribute.String;
    frameworkContractSigningDate: Attribute.Date;
    approval: Attribute.Enumeration<['TOAPPROVE', 'APPROVED', 'REJECTED']> &
      Attribute.DefaultTo<'TOAPPROVE'>;
    isActive: Attribute.Boolean & Attribute.DefaultTo<true>;
    projects: Attribute.Relation<
      'api::consultant.consultant',
      'oneToMany',
      'api::project.project'
    > &
      Attribute.Private;
    proposals: Attribute.Relation<
      'api::consultant.consultant',
      'oneToMany',
      'api::proposal.proposal'
    > &
      Attribute.Private;
    deletedUserData: Attribute.JSON & Attribute.Private;
    isDeleted: Attribute.Boolean &
      Attribute.Required &
      Attribute.DefaultTo<false>;
    seniorityLevel: Attribute.Integer;
    createdAt: Attribute.DateTime;
    updatedAt: Attribute.DateTime;
    createdBy: Attribute.Relation<
      'api::consultant.consultant',
      'oneToOne',
      'admin::user'
    > &
      Attribute.Private;
    updatedBy: Attribute.Relation<
      'api::consultant.consultant',
      'oneToOne',
      'admin::user'
    > &
      Attribute.Private;
  };
}

export interface ApiDayDay extends Schema.CollectionType {
  collectionName: 'days';
  info: {
    singularName: 'day';
    pluralName: 'days';
    displayName: 'day';
    description: '';
  };
  options: {
    draftAndPublish: false;
  };
  attributes: {
    name: Attribute.String & Attribute.Required;
    isActive: Attribute.Boolean &
      Attribute.Required &
      Attribute.DefaultTo<true>;
    createdAt: Attribute.DateTime;
    updatedAt: Attribute.DateTime;
    createdBy: Attribute.Relation<'api::day.day', 'oneToOne', 'admin::user'> &
      Attribute.Private;
    updatedBy: Attribute.Relation<'api::day.day', 'oneToOne', 'admin::user'> &
      Attribute.Private;
  };
}

export interface ApiEsignatureEsignature extends Schema.CollectionType {
  collectionName: 'esignatures';
  info: {
    singularName: 'esignature';
    pluralName: 'esignatures';
    displayName: 'Esignature';
  };
  options: {
    draftAndPublish: false;
  };
  attributes: {
    user: Attribute.Relation<
      'api::esignature.esignature',
      'oneToOne',
      'plugin::users-permissions.user'
    >;
    object: Attribute.JSON;
    createdAt: Attribute.DateTime;
    updatedAt: Attribute.DateTime;
    createdBy: Attribute.Relation<
      'api::esignature.esignature',
      'oneToOne',
      'admin::user'
    > &
      Attribute.Private;
    updatedBy: Attribute.Relation<
      'api::esignature.esignature',
      'oneToOne',
      'admin::user'
    > &
      Attribute.Private;
  };
}

export interface ApiGlobalGlobal extends Schema.SingleType {
  collectionName: 'globals';
  info: {
    singularName: 'global';
    pluralName: 'globals';
    displayName: 'Global';
    description: '';
  };
  options: {
    draftAndPublish: true;
  };
  attributes: {
    title: Attribute.String;
    description: Attribute.Text;
    header: Attribute.Component<'layout.header'>;
    footer: Attribute.Component<'layout.footer'>;
    createdAt: Attribute.DateTime;
    updatedAt: Attribute.DateTime;
    publishedAt: Attribute.DateTime;
    createdBy: Attribute.Relation<
      'api::global.global',
      'oneToOne',
      'admin::user'
    > &
      Attribute.Private;
    updatedBy: Attribute.Relation<
      'api::global.global',
      'oneToOne',
      'admin::user'
    > &
      Attribute.Private;
  };
}

export interface ApiIndustryIndustry extends Schema.CollectionType {
  collectionName: 'industries';
  info: {
    singularName: 'industry';
    pluralName: 'industries';
    displayName: 'Industry';
  };
  options: {
    draftAndPublish: false;
  };
  attributes: {
    name: Attribute.String & Attribute.Required;
    isActive: Attribute.Boolean &
      Attribute.Required &
      Attribute.DefaultTo<true>;
    createdAt: Attribute.DateTime;
    updatedAt: Attribute.DateTime;
    createdBy: Attribute.Relation<
      'api::industry.industry',
      'oneToOne',
      'admin::user'
    > &
      Attribute.Private;
    updatedBy: Attribute.Relation<
      'api::industry.industry',
      'oneToOne',
      'admin::user'
    > &
      Attribute.Private;
  };
}

export interface ApiInvoiceInvoice extends Schema.CollectionType {
  collectionName: 'invoices';
  info: {
    singularName: 'invoice';
    pluralName: 'invoices';
    displayName: 'invoice';
    description: '';
  };
  options: {
    draftAndPublish: false;
  };
  attributes: {
    total_amount: Attribute.Decimal & Attribute.Required;
    status: Attribute.Enumeration<['draft', 'sent', 'paid']> &
      Attribute.DefaultTo<'draft'>;
    client: Attribute.Relation<
      'api::invoice.invoice',
      'manyToOne',
      'api::client.client'
    >;
    createdAt: Attribute.DateTime;
    updatedAt: Attribute.DateTime;
    createdBy: Attribute.Relation<
      'api::invoice.invoice',
      'oneToOne',
      'admin::user'
    > &
      Attribute.Private;
    updatedBy: Attribute.Relation<
      'api::invoice.invoice',
      'oneToOne',
      'admin::user'
    > &
      Attribute.Private;
  };
}

export interface ApiLocationLocation extends Schema.CollectionType {
  collectionName: 'locations';
  info: {
    singularName: 'location';
    pluralName: 'locations';
    displayName: 'Location';
  };
  options: {
    draftAndPublish: false;
  };
  attributes: {
    name: Attribute.String & Attribute.Required;
    isActive: Attribute.Boolean &
      Attribute.Required &
      Attribute.DefaultTo<true>;
    createdAt: Attribute.DateTime;
    updatedAt: Attribute.DateTime;
    createdBy: Attribute.Relation<
      'api::location.location',
      'oneToOne',
      'admin::user'
    > &
      Attribute.Private;
    updatedBy: Attribute.Relation<
      'api::location.location',
      'oneToOne',
      'admin::user'
    > &
      Attribute.Private;
  };
}

export interface ApiMessageMessage extends Schema.CollectionType {
  collectionName: 'messages';
  info: {
    singularName: 'message';
    pluralName: 'messages';
    displayName: 'message';
  };
  options: {
    draftAndPublish: false;
  };
  attributes: {
    name: Attribute.String & Attribute.Required;
    email: Attribute.Email & Attribute.Required;
    message: Attribute.Text;
    createdAt: Attribute.DateTime;
    updatedAt: Attribute.DateTime;
    createdBy: Attribute.Relation<
      'api::message.message',
      'oneToOne',
      'admin::user'
    > &
      Attribute.Private;
    updatedBy: Attribute.Relation<
      'api::message.message',
      'oneToOne',
      'admin::user'
    > &
      Attribute.Private;
  };
}

export interface ApiOfferOffer extends Schema.CollectionType {
  collectionName: 'offers';
  info: {
    singularName: 'offer';
    pluralName: 'offers';
    displayName: 'offer';
    description: '';
  };
  options: {
    draftAndPublish: false;
  };
  attributes: {
    title: Attribute.String;
    description: Attribute.Text;
    offerContract: Attribute.Media;
    offerEnvelopID: Attribute.String;
    status: Attribute.Enumeration<
      [
        'Expired',
        'ExpiredPO',
        'Pending',
        'AcceptedByClient',
        'AcceptedByAdmin',
        'PendingL3Signing',
        'SignedByL3',
        'PendingL1Approval',
        'ApprovedByL1',
        'RejectedByL1',
        'POPending',
        'POSubmitted',
        'POApproved',
        'POApprovedByAdmin',
        'PORejected',
        'ProjectStarted',
        'PendingConsultantSigning',
        'RejectedByClient',
        'RejectedByAdmin',
        'SigningStartedByClient',
        'SigningCompletedByClient'
      ]
    > &
      Attribute.DefaultTo<'Pending'>;
    signingCompletedAt: Attribute.DateTime;
    purchaseOrder: Attribute.Media<'images' | 'files'>;
    proposal: Attribute.Relation<
      'api::offer.offer',
      'oneToOne',
      'api::proposal.proposal'
    >;
    poDeadline: Attribute.DateTime;
    poSubmittedAt: Attribute.DateTime;
    signedByL3At: Attribute.DateTime;
    l3Signer: Attribute.Relation<
      'api::offer.offer',
      'manyToOne',
      'plugin::users-permissions.user'
    >;
    l1Approver: Attribute.Relation<
      'api::offer.offer',
      'manyToOne',
      'plugin::users-permissions.user'
    >;
    offerHistory: Attribute.Component<'offer.offer-history', true>;
    createdAt: Attribute.DateTime;
    updatedAt: Attribute.DateTime;
    createdBy: Attribute.Relation<
      'api::offer.offer',
      'oneToOne',
      'admin::user'
    > &
      Attribute.Private;
    updatedBy: Attribute.Relation<
      'api::offer.offer',
      'oneToOne',
      'admin::user'
    > &
      Attribute.Private;
  };
}

export interface ApiOtpOtp extends Schema.CollectionType {
  collectionName: 'otps';
  info: {
    singularName: 'otp';
    pluralName: 'otps';
    displayName: 'OTP';
  };
  options: {
    draftAndPublish: false;
  };
  attributes: {
    code: Attribute.String & Attribute.Required;
    expiresAt: Attribute.DateTime & Attribute.Required;
    isUsed: Attribute.Boolean & Attribute.DefaultTo<false>;
    user: Attribute.Relation<
      'api::otp.otp',
      'oneToOne',
      'plugin::users-permissions.user'
    >;
    createdAt: Attribute.DateTime;
    updatedAt: Attribute.DateTime;
    createdBy: Attribute.Relation<'api::otp.otp', 'oneToOne', 'admin::user'> &
      Attribute.Private;
    updatedBy: Attribute.Relation<'api::otp.otp', 'oneToOne', 'admin::user'> &
      Attribute.Private;
  };
}

export interface ApiPositionPosition extends Schema.CollectionType {
  collectionName: 'positions';
  info: {
    singularName: 'position';
    pluralName: 'positions';
    displayName: 'Position';
    description: '';
  };
  options: {
    draftAndPublish: false;
  };
  attributes: {
    name: Attribute.String & Attribute.Required;
    isActive: Attribute.Boolean &
      Attribute.Required &
      Attribute.DefaultTo<true>;
    createdAt: Attribute.DateTime;
    updatedAt: Attribute.DateTime;
    createdBy: Attribute.Relation<
      'api::position.position',
      'oneToOne',
      'admin::user'
    > &
      Attribute.Private;
    updatedBy: Attribute.Relation<
      'api::position.position',
      'oneToOne',
      'admin::user'
    > &
      Attribute.Private;
  };
}

export interface ApiProjectProject extends Schema.CollectionType {
  collectionName: 'projects';
  info: {
    singularName: 'project';
    pluralName: 'projects';
    displayName: 'project';
    description: '';
  };
  options: {
    draftAndPublish: false;
  };
  attributes: {
    title: Attribute.String;
    description: Attribute.Text;
    status: Attribute.Enumeration<
      ['Ongoing', 'Paused', 'Canceled', 'Finished']
    > &
      Attribute.DefaultTo<'Ongoing'>;
    timesheets: Attribute.Relation<
      'api::project.project',
      'oneToMany',
      'api::timesheet.timesheet'
    >;
    consultant: Attribute.Relation<
      'api::project.project',
      'manyToOne',
      'api::consultant.consultant'
    >;
    client: Attribute.Relation<
      'api::project.project',
      'manyToOne',
      'api::client.client'
    >;
    offer: Attribute.Relation<
      'api::project.project',
      'oneToOne',
      'api::offer.offer'
    >;
    createdAt: Attribute.DateTime;
    updatedAt: Attribute.DateTime;
    createdBy: Attribute.Relation<
      'api::project.project',
      'oneToOne',
      'admin::user'
    > &
      Attribute.Private;
    updatedBy: Attribute.Relation<
      'api::project.project',
      'oneToOne',
      'admin::user'
    > &
      Attribute.Private;
  };
}

export interface ApiProposalProposal extends Schema.CollectionType {
  collectionName: 'proposals';
  info: {
    singularName: 'proposal';
    pluralName: 'proposals';
    displayName: 'proposal';
    description: '';
  };
  options: {
    draftAndPublish: false;
  };
  attributes: {
    status: Attribute.Enumeration<
      [
        'Pending',
        'PendingConsultantSigning',
        'AcceptedByConsultant',
        'ApprovedByAdmin',
        'RejectedByConsultant',
        'RejectedByAdmin',
        'RejectedByClient',
        'SigningStartedByConsultant',
        'SigningCompletedByConsultant',
        'OfferCreated',
        'ProposalCompleted',
        'PendingL3Approval',
        'PendingL1Approval',
        'RejectedByL3',
        'RejectedByL1',
        'ApprovedByL3',
        'ApprovedByL1'
      ]
    > &
      Attribute.DefaultTo<'Pending'>;
    missionLocation: Attribute.Text & Attribute.Required;
    typeOfWork: Attribute.Text & Attribute.Required;
    startDate: Attribute.Date & Attribute.Required;
    endDate: Attribute.Date & Attribute.Required;
    numberOfDays: Attribute.Integer;
    details: Attribute.Text;
    baseSalary: Attribute.Decimal & Attribute.Required;
    vacationAndPulicHolidayAllowance: Attribute.Decimal & Attribute.Required;
    totalHourlyWage: Attribute.Decimal & Attribute.Required;
    fees: Attribute.Decimal;
    rejectionDetails: Attribute.Text;
    doccuSignEnvelopID: Attribute.String;
    missionContract: Attribute.Media;
    client: Attribute.Relation<
      'api::proposal.proposal',
      'manyToOne',
      'api::client.client'
    >;
    consultant: Attribute.Relation<
      'api::proposal.proposal',
      'manyToOne',
      'api::consultant.consultant'
    >;
    offer: Attribute.Relation<
      'api::proposal.proposal',
      'oneToOne',
      'api::offer.offer'
    >;
    createdBy: Attribute.Relation<
      'api::proposal.proposal',
      'oneToOne',
      'admin::user'
    > &
      Attribute.Private;
    approvalHistory: Attribute.Component<'proposal.approval-history', true>;
    feedback: Attribute.Component<'proposal.feedback', true>;
    requiresL1Approval: Attribute.Boolean & Attribute.DefaultTo<false>;
    isL4Proposal: Attribute.Boolean & Attribute.DefaultTo<false>;
    lastModifiedBy: Attribute.Relation<
      'api::proposal.proposal',
      'manyToOne',
      'plugin::users-permissions.user'
    >;
    createdAt: Attribute.DateTime;
    updatedAt: Attribute.DateTime;
    updatedBy: Attribute.Relation<
      'api::proposal.proposal',
      'oneToOne',
      'admin::user'
    > &
      Attribute.Private;
  };
}

export interface ApiSkillSkill extends Schema.CollectionType {
  collectionName: 'skills';
  info: {
    singularName: 'skill';
    pluralName: 'skills';
    displayName: 'skill';
  };
  options: {
    draftAndPublish: false;
  };
  attributes: {
    name: Attribute.String & Attribute.Required;
    isActive: Attribute.Boolean &
      Attribute.Required &
      Attribute.DefaultTo<true>;
    createdAt: Attribute.DateTime;
    updatedAt: Attribute.DateTime;
    createdBy: Attribute.Relation<
      'api::skill.skill',
      'oneToOne',
      'admin::user'
    > &
      Attribute.Private;
    updatedBy: Attribute.Relation<
      'api::skill.skill',
      'oneToOne',
      'admin::user'
    > &
      Attribute.Private;
  };
}

export interface ApiTempUserTempUser extends Schema.CollectionType {
  collectionName: 'temp_users';
  info: {
    singularName: 'temp-user';
    pluralName: 'temp-users';
    displayName: 'TempUser';
  };
  options: {
    draftAndPublish: true;
  };
  attributes: {
    user: Attribute.Relation<
      'api::temp-user.temp-user',
      'oneToOne',
      'plugin::users-permissions.user'
    >;
    tempPassword: Attribute.String;
    createdAt: Attribute.DateTime;
    updatedAt: Attribute.DateTime;
    publishedAt: Attribute.DateTime;
    createdBy: Attribute.Relation<
      'api::temp-user.temp-user',
      'oneToOne',
      'admin::user'
    > &
      Attribute.Private;
    updatedBy: Attribute.Relation<
      'api::temp-user.temp-user',
      'oneToOne',
      'admin::user'
    > &
      Attribute.Private;
  };
}

export interface ApiTimesheetTimesheet extends Schema.CollectionType {
  collectionName: 'timesheets';
  info: {
    singularName: 'timesheet';
    pluralName: 'timesheets';
    displayName: 'timesheet';
    description: '';
  };
  options: {
    draftAndPublish: false;
  };
  attributes: {
    year: Attribute.Integer & Attribute.Required;
    month: Attribute.Enumeration<
      [
        'January',
        'February',
        'March',
        'April',
        'May',
        'June',
        'July',
        'August',
        'September',
        'October',
        'November',
        'December'
      ]
    > &
      Attribute.Required;
    comments: Attribute.JSON & Attribute.DefaultTo<[]>;
    approvalStatus: Attribute.Enumeration<
      ['Approved', 'Rejected', 'AwaitingApproval']
    >;
    project: Attribute.Relation<
      'api::timesheet.timesheet',
      'manyToOne',
      'api::project.project'
    >;
    workingDays: Attribute.Component<'time-sheet.working-days', true>;
    isSubmitted: Attribute.Boolean & Attribute.DefaultTo<false>;
    timesheetFile: Attribute.Media<'images' | 'files' | 'videos' | 'audios'>;
    createdAt: Attribute.DateTime;
    updatedAt: Attribute.DateTime;
    createdBy: Attribute.Relation<
      'api::timesheet.timesheet',
      'oneToOne',
      'admin::user'
    > &
      Attribute.Private;
    updatedBy: Attribute.Relation<
      'api::timesheet.timesheet',
      'oneToOne',
      'admin::user'
    > &
      Attribute.Private;
  };
}

declare module '@strapi/types' {
  export module Shared {
    export interface ContentTypes {
      'admin::permission': AdminPermission;
      'admin::user': AdminUser;
      'admin::role': AdminRole;
      'admin::api-token': AdminApiToken;
      'admin::api-token-permission': AdminApiTokenPermission;
      'admin::transfer-token': AdminTransferToken;
      'admin::transfer-token-permission': AdminTransferTokenPermission;
      'plugin::upload.file': PluginUploadFile;
      'plugin::upload.folder': PluginUploadFolder;
      'plugin::content-releases.release': PluginContentReleasesRelease;
      'plugin::content-releases.release-action': PluginContentReleasesReleaseAction;
      'plugin::users-permissions.permission': PluginUsersPermissionsPermission;
      'plugin::users-permissions.role': PluginUsersPermissionsRole;
      'plugin::users-permissions.user': PluginUsersPermissionsUser;
      'plugin::i18n.locale': PluginI18NLocale;
      'api::canton.canton': ApiCantonCanton;
      'api::client.client': ApiClientClient;
      'api::client-registration-form.client-registration-form': ApiClientRegistrationFormClientRegistrationForm;
      'api::consultant.consultant': ApiConsultantConsultant;
      'api::day.day': ApiDayDay;
      'api::esignature.esignature': ApiEsignatureEsignature;
      'api::global.global': ApiGlobalGlobal;
      'api::industry.industry': ApiIndustryIndustry;
      'api::invoice.invoice': ApiInvoiceInvoice;
      'api::location.location': ApiLocationLocation;
      'api::message.message': ApiMessageMessage;
      'api::offer.offer': ApiOfferOffer;
      'api::otp.otp': ApiOtpOtp;
      'api::position.position': ApiPositionPosition;
      'api::project.project': ApiProjectProject;
      'api::proposal.proposal': ApiProposalProposal;
      'api::skill.skill': ApiSkillSkill;
      'api::temp-user.temp-user': ApiTempUserTempUser;
      'api::timesheet.timesheet': ApiTimesheetTimesheet;
    }
  }
}
