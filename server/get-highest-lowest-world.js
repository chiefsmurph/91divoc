const getWorldData = require('./get-world-data');
const getHighestLowest = require('./common/get-highest-lowest');

module.exports = async () => {

    console.log('request data...');

    const withVaccinationTotals = await getWorldData();

    console.log("TOTAL WORLD LOCATIONS", withVaccinationTotals.length);

    return {
        overall: await getHighestLowest({
            withVaccinationTotals,
            // numPerSubset: 44
        }),
        excludingAfrica: await getHighestLowest({
            withVaccinationTotals: withVaccinationTotals
                .filter(location => !JSON.stringify(location).includes('Africa')),
            // numPerSubset: 44
        }),
    };

};