const getStateData = require('./get-state-data');
const getHighestLowest = require('./common/get-highest-lowest');

module.exports = async () => {

    console.log('request data...');

    const withVaccinationTotals = await getStateData();

    console.log("TOTAL STATES", withVaccinationTotals.length);

    return {
        overall: await getHighestLowest({
            withVaccinationTotals,
            numPerSubset: 12
        })
    };

};