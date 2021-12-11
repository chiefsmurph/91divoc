const USE_JSON = false;
const request = require('axios');
const fs = require('fs/promises');
const hasRequiredFields = require('./common/has-required-fields');
const cacheThis = require('./common/cache-this');

module.exports = cacheThis(async () => {
    const covidData = USE_JSON
        ? require('./data/owid-covid-data.json')
        : (await request('https://covid.ourworldindata.org/data/owid-covid-data.json')).data;
    // const { data: vaccinationsData } = await request('https://covid.ourworldindata.org/data/vaccinations/vaccinations.json');
    // console.log(JSON.stringify(covidData, null, 2))
    await fs.writeFile(
        './data/owid-covid-data.json',
        JSON.stringify(covidData, null, 2)
    );
    const withVaccinationTotals = Object.keys(covidData)
        .map(iso_code => {
            const { location, data, ...rest } = covidData[iso_code];
            // console.log({ location, data, iso_code });
            // const withTotals = data.filter(({ total_vaccinations_per_hundred }) => total_vaccinations_per_hundred);
            // const mostRecentTotal = withTotals.pop();
            const importantData = data.filter(hasRequiredFields);
            return {
                iso_code,
                location,
                locationData: rest,
                data: importantData,
            };
        })
        .filter(location => location.locationData.continent)
        // .filter(location => location.locationData.population > 5000000)
        .filter(location => {
            // return !JSON.stringify(location).includes('Africa');
            console.log({ location})
            return true;
        });

    return withVaccinationTotals;
}, 80);