const USE_CURRENT_HIGHEST_AND_LOWEST = false;
const USE_JSON = false;
const NUM_PER_SUBSET = 25;


const request = require('axios');
const fs = require('fs/promises');
const { mapObject, uniq } = require('underscore');
const avg = array => {
    const arr = array.filter(Boolean);
    return arr.reduce((acc, val) => acc + val, 0) / arr.length;
};


const requiredFields = [
    'total_cases_per_million', 'total_deaths_per_million', 'total_vaccinations_per_hundred'
];
const hasRequiredFields = d => requiredFields.every(key => d[key] !== undefined);


const getHighestLowest = ({ 
    withVaccinationTotals,
    date,
    highestVaccinatedLocations = [],
    lowestVaccinatedLocations = [],
}) => {

    const slicedVaccinationTotals = getAggregatesForDate({
        withVaccinationTotals,
        date,
    });
    
    // console.log({ withVaccinationTotals, slicedVaccinationTotals })
    const highestVaccinated = highestVaccinatedLocations.length
        ? highestVaccinatedLocations.map(location => slicedVaccinationTotals.find(p => p.location === location)).filter(Boolean)
        : [...slicedVaccinationTotals].sort((a, b) => b.total_vaccinations_per_hundred - a.total_vaccinations_per_hundred).slice(0, NUM_PER_SUBSET);
    const lowestVaccinated = lowestVaccinatedLocations.length
        ? lowestVaccinatedLocations.map(location => slicedVaccinationTotals.find(p => p.location === location)).filter(Boolean)
        : [...slicedVaccinationTotals].sort((a, b) => a.total_vaccinations_per_hundred - b.total_vaccinations_per_hundred).slice(0, NUM_PER_SUBSET);

    console.log({
        date,
        highestVaccinated: highestVaccinated.map(t => t.location),
        lowestVaccinated: lowestVaccinated.map(t => t.location),
    });
    return mapObject({
        highestVaccinated,
        lowestVaccinated,
    }, subset => 
        [
            'total_vaccinations_per_hundred',
            'total_cases_per_million',
            'total_deaths_per_million'
        ].reduce((acc, key) => ({
            ...acc,
            [key]: +avg(subset.map(d => d[key])).toFixed(1)
        }), {
            locations: subset.map(t => t.location)
        })
    );
};

const getAggregatesForDate = ({
    withVaccinationTotals,
    date,
}) => {
    
    let slicedVaccinationTotals = withVaccinationTotals
        .map(({ data, ...p }) => ({
            ...p,
            ...[...data].reverse().find(d => (new Date(d.date)).getTime() <= (new Date(date)).getTime())
        }))
        .filter(hasRequiredFields)
        .sort((a, b) => b.total_vaccinations_per_hundred - a.total_vaccinations_per_hundred);

    return slicedVaccinationTotals;

};

module.exports = async () => {
    console.log('request data...');

    const covidData = USE_JSON
            ? require('./data/owid-covid-data.json')
            : (await request('https://covid.ourworldindata.org/data/owid-covid-data.json')).data;
    // const { data: vaccinationsData } = await request('https://covid.ourworldindata.org/data/vaccinations/vaccinations.json');
    console.log(JSON.stringify(covidData, null, 2))
    console.log({ USE_CURRENT_HIGHEST_AND_LOWEST});

    await fs.writeFile(
        './data/owid-covid-data2.json',
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
        .filter(location => location.locationData.population > 5000000)
        .filter(location => {
            return !JSON.stringify(location).includes('Africa');
            console.log({ location})
            return true;
        });

    console.log("TOTAL LOCATIONS", withVaccinationTotals.length);


    const allDates = uniq(withVaccinationTotals.map(t => t.data.map(t => t.date)).flat(2))
        .sort((a, b) => (new Date(a)).getTime() - (new Date(b)).getTime());
    console.log({ allDates })
    // TEMP
    const mostRecentDate = allDates[allDates.length - 1];
    console.log(`NOW LETS GET THE CURRENT HIGHEST AND LOWEST LOCATIONS FOR ${mostRecentDate}`);
    const mostRecentAggs = getAggregatesForDate({
        withVaccinationTotals, 
        date: mostRecentDate
    });

    console.log({ mostRecentAggs })


    let currentHighestLowest = USE_CURRENT_HIGHEST_AND_LOWEST && (() => {
        const mostRecentDate = allDates[allDates.length - 1];
        console.log(`NOW LETS GET THE CURRENT HIGHEST AND LOWEST LOCATIONS FOR ${mostRecentDate}`);
        const mostRecentAggs = getHighestLowest({
            withVaccinationTotals, 
            date: mostRecentDate
        });
        console.log(JSON.stringify(mostRecentAggs, null, 2))
        const {
            highestVaccinated: {
                locations: highestVaccinatedLocations
            },
            lowestVaccinated: {
                locations: lowestVaccinatedLocations
            }
        } = mostRecentAggs;
        // console.log({ mostRecentAggs })
        const highestLowest = {
            highestVaccinatedLocations,
            lowestVaccinatedLocations
        };
        console.log('GOT THE CURRENT HIGHEST VACCINATED AND LOWEST VACCINATED LOCATIONS');
        console.log(highestLowest)
        return highestLowest;
    })();


    const withAggregates = allDates.map(date => ({
        date,
        aggregates: getHighestLowest({
            withVaccinationTotals,
            date,
            ...currentHighestLowest
        })
    }));



    const prefixKeys = (object, prefix) => 
        Object.keys(object).reduce((acc, key) => ({
            ...acc,
            [`${prefix}${key}`]: object[key]
        }), {});

    const formatted = withAggregates
        .map(({ 
            date, 
            aggregates: { 
                highestVaccinated,
                lowestVaccinated,
            }
        }) => ({
            date,
            ...prefixKeys(highestVaccinated, 'highestVaccinated_'),
            ...prefixKeys(lowestVaccinated, 'lowestVaccinated_'),
        }))
        .map(({ highestVaccinated_locations, lowestVaccinated_locations, ...rest }) => ({
            ...rest,
            highestVaccinated_locations: highestVaccinated_locations.join(', '),
            lowestVaccinated_locations: lowestVaccinated_locations.join(', '),
        }));

    return formatted;
    
};