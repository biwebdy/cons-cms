// @ts-nocheck
module.exports = {
    '0 4 1 1 *': { // Runs annually on January 1st at 4 AM
        task: async () => {
            console.log('Running annual seniority level increment job');

            const BATCH_SIZE = 100; // this is to prevent server overload, so i am doing batches of 100
            let page = 0;
            let consultants;

            do {
                consultants = await strapi.entityService.findMany('api::consultant.consultant', {
                    limit: BATCH_SIZE,
                    start: page * BATCH_SIZE,
                    sort: { id: 'asc' },
                });
                if (consultants.length > 0) {
                    await Promise.all(
                        consultants.map(consultant =>
                            strapi.entityService.update('api::consultant.consultant', consultant.id, {
                                data: { seniorityLevel: (consultant.seniorityLevel || 0) + 1 },
                            })
                        )
                    );
                    page++;
                }
            } while (consultants.length === BATCH_SIZE);
            console.log('Seniority level increment job completed');
        },
        },
    '0 2 * * *': { // Runs at 2 AM every day
    task: async () => {
      await strapi.service('api::offer.offer').handleOfferPeriodity();
    },
    options: {
      tz: 'UTC',
    },
},
};