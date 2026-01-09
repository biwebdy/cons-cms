module.exports = ({ env }) => ({
  host: env('HOST', '0.0.0.0'),
  port: env.int('PORT', 1337),
  proxy: true,
  logger: {
    level: 'debug',
    exposeInContext: true,
    requests: true,
  },
  app: {
    keys: env.array('APP_KEYS'),
  },
  cron: {
    enabled: env.bool('CRON_ENABLED', true),
    tasks: require('./cron-tasks'),
  },
  webhooks: {
    populateRelations: env.bool('WEBHOOKS_POPULATE_RELATIONS', false),
  },
});
