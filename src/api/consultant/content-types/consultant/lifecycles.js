module.exports = {
    beforeFindMany(event) {
        applyIsDeletedFilter(event);
    },
};

function applyIsDeletedFilter(event) {
    const { where } = event.params;

    if (!where) {
        event.params.where = {};
    }
    if (where['$and'] && Array.isArray(where['$and']) && Array.isArray(where['$and'][0]['$and'])) {
        const isDeletedFilterExists = where['$and'][0]['$and'].some(condition => {
            return condition.isDeleted !== undefined ||
                (condition.isDeleted && condition.isDeleted['$eq'] !== undefined);
        });
        if (isDeletedFilterExists) {
            return;
        }
    }
    event.params.where.isDeleted = false;
}