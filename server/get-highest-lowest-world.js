const getWorldData = require('./get-world-data');
const getHighestLowest = require('./common/get-highest-lowest');

module.exports = async () => {

    console.log('request data...');

    const withVaccinationTotals = await getWorldData();

    console.log("TOTAL WORLD LOCATIONS", withVaccinationTotals.length);

    return getHighestLowest({
        withVaccinationTotals,
        numPerSubset: 100
    });

};