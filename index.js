const request = require('axios');
const { pick, omit, mapObject } = require('underscore');
const avg = array => {
    array = array.filter(Boolean);
    return array.reduce((acc, val) => acc + val, 0) / array.length;
};


const requiredFields = [
    'total_cases_per_million', 'total_deaths_per_million', 'total_vaccinations_per_hundred'
];
const hasRequiredFields = d => requiredFields.every(key => d[key]);


const getAggregatesForDate = (withVaccinationTotals, date) => {
    const slicedVaccinationTotals = withVaccinationTotals.map(({ data, ...p }) => {
        const relevantData = [...data].reverse().find(d => (new Date(d.date)).getTime() <= (new Date(date)).getTime());
        // if (!relevantData) {
        //     console.log('no relevant');
        //     console.log({
        //         date,
        //         data
        //     })
        // }
        return {
            ...p,
            ...relevantData
        };
    }).filter(hasRequiredFields);

    const highestVaccinated = [...slicedVaccinationTotals].sort((a, b) => b.total_vaccinations_per_hundred - a.total_vaccinations_per_hundred);
    const lowestVaccinated = [...slicedVaccinationTotals].sort((a, b) => a.total_vaccinations_per_hundred - b.total_vaccinations_per_hundred);

    return mapObject({
        highestVaccinated,
        lowestVaccinated
    }, sorted => {

        const top = sorted.slice(0, 30);
        return [
            'total_vaccinations_per_hundred',
            'total_cases_per_million',
            'total_deaths_per_million'
        ].reduce((acc, key) => ({
            ...acc,
            [key]: Math.round(avg(top.map(d => d[key])))
        }), {
            locations: top.map(t => t.location)
        })

    });
};


(async () => {
    const { data: covidData } = await request('https://covid.ourworldindata.org/data/owid-covid-data.json');
    // const { data: vaccinationsData } = await request('https://covid.ourworldindata.org/data/vaccinations/vaccinations.json');


    const withVaccinationTotals = Object.keys(covidData).map(iso_code => {
        const { location, data } = covidData[iso_code];
        // console.log({ location, data, iso_code });
        // const withTotals = data.filter(({ total_vaccinations_per_hundred }) => total_vaccinations_per_hundred);
        // const mostRecentTotal = withTotals.pop();
        const importantData = data.filter(hasRequiredFields);
        return {
            iso_code,
            location,
            data: importantData,
        };
    });

    const allDates = withVaccinationTotals.find(t => t.iso_code === 'ISR').data.map(t => t.date);




    const withAggregates = allDates.map(date => ({
        date,
        aggregates: getAggregatesForDate(withVaccinationTotals, date)
    }));



    const prefixKeys = (object, prefix) => 
        Object.keys(object).reduce((acc, key) => ({
            ...acc,
            [`${prefix}${key}`]: object[key]
        }), {});

    const formatted = withAggregates.map(({ 
        date, 
        aggregates: { 
            highestVaccinated,
            lowestVaccinated,
        }
    }) => ({
        date,
        ...prefixKeys(omit(highestVaccinated, 'locatiodns'), 'highestVaccinated_'),
        ...prefixKeys(omit(lowestVaccinated, 'locatidons'), 'lowestVaccinated_'),
    }));







    console.log(JSON.stringify({ formatted }, null, 2));
    
    // const highestVaccinated = [...withVaccinationTotals].sort((a, b) => b.mostRecentTotalVaccinationsPerHundred - a.mostRecentTotalVaccinationsPerHundred);
    // const lowestVaccinated = [...withVaccinationTotals].sort((a, b) => a.mostRecentTotalVaccinationsPerHundred - b.mostRecentTotalVaccinationsPerHundred);

    // const addCovidData = vaccinated =>
    //     vaccinated.map(p => ({
    //         ...p,
    //         covidData: ((covidData[p.iso_code] || {}).data || []).pop()
    //     }))
    //     .map(p => ({
    //         ...p,
    //         ...pick(p.covidData, ['total_cases_per_million', 'total_deaths_per_million'])
    //     }))
    //     .map(p => ({
    //         ...pick(p, ['country', 'iso_code', 'mostRecentTotalVaccinationsPerHundred']),
    //         ...pick(p.covidData, ['total_cases_per_million', 'total_deaths_per_million'])
    //     }));

    // // console.log('total', highestVaccinated.length)

    // [highestVaccinated, lowestVaccinated]
    //     .map(data => data.slice(0, 100))
    //     .map(addCovidData)
    //     .forEach(data => {
    //         console.log(
    //             'averages', 
    //             [
    //                 'mostRecentTotalVaccinationsPerHundred',
    //                 'total_cases_per_million',
    //                 'total_deaths_per_million'
    //             ].reduce((acc, key) => ({
    //                 ...acc,
    //                 [key]: avg(data.map(d => d[key]))
    //             }), {})
    //         )
    //         console.table(data);
    //     });


    // console.log(JSON.stringify({ highestVaccinated: addCovidData(highestVaccinated), lowestVaccinated: addCovidData(lowestVaccinated) }, null, 2));//.map(p => p.country)});
})();