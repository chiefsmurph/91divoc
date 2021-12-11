
const request = require('axios');
const fs = require('fs/promises');
const csvToJson = require('csvtojson');
const { groupBy, mapObject } = require('underscore');
const hasRequiredFields = require('./common/has-required-fields');

const getStateTwoLetterToFull = async () => {
    // https://worldpopulationreview.com/static/states/abbr-name.json
    const response = (await request('https://worldpopulationreview.com/static/states/abbr-name.json')).data;
    console.log({ response });
    response.NYC = response.NY;
    return response;
};

const getVaxDataByState = async () => {
    const data = (await request('https://raw.githubusercontent.com/owid/covid-19-data/master/public/data/vaccinations/us_state_vaccinations.csv')).data;
    console.log(data);
    const asJSON = await csvToJson().fromString(data);
    // console.log(asJSON);
    const grouped = groupBy(asJSON, 'location');
    return grouped;
};

const formatDateStr = dateStr => {
    const [month, day, year] = (new Date(dateStr)).toLocaleDateString().split('/');
    return [year, month, day].join('-');
};

const getOutcomeDataByState = async () => {
    // https://data.cdc.gov/api/views/9mfq-cb36/rows.json?accessType=DOWNLOAD

    const response = (await request('https://data.cdc.gov/api/views/9mfq-cb36/rows.json?accessType=DOWNLOAD')).data;
    console.log(response);
    const { columns } = response.meta.view;
    console.log({ columns});
    const data = response.data.map(d => 
        columns.reduce((acc, col, index) => ({
            ...acc,
            [col.name]: d[index]
        }), {})
    );
    const grouped = groupBy(data, 'state');
    const twoLetterToFull = await getStateTwoLetterToFull();
    console.log({ twoLetterToFull});
    const outcomes = Object.keys(grouped).reduce((acc, twoLetter) => {
        const fullState = twoLetterToFull[twoLetter];
        if (!fullState) console.log('AHHHH', twoLetter);
        return {
            ...acc,
            [fullState]: grouped[twoLetter]
        };
    }, {});
    delete outcomes.undefined;
    const formatted = mapObject(
        outcomes, 
        data => data
            .map(d => ({
                ...d,
                date: formatDateStr(d.submission_date)
            }))
            .sort((a, b) => (new Date(a.submission_date)).getTime() - (new Date(b.submission_date)).getTime())
    );
    return formatted;
};

const getStateData = (object, state = '') => {
    const foundKey = Object.keys(object).find(key => key.toUpperCase().includes(state.toUpperCase()));
    if (!foundKey) {
        console.log('missing', state);
    }
    return object[foundKey];
};


module.exports = async () => {

    const twoLetterToFull = await getStateTwoLetterToFull();
    const vaxData = await getVaxDataByState();
    const outcomeData = await getOutcomeDataByState();
    // console.log(Object.keys(outcomeData));

    console.log(Object.values(twoLetterToFull));


    const rawCombined = Object.values(twoLetterToFull).reduce((acc, state) => ({
        ...acc,
        [state]: {
            vaxData: getStateData(vaxData, state),
            outcomeData: getStateData(outcomeData, state),
        }
    }), {});

    // checkpoint rawCombined
    const formatted = format(rawCombined);
    const formattedByPopulation = await formatByPopulation(formatted);
    console.log(formattedByPopulation.map(s => s.location), 'JESUS')
    return formattedByPopulation;
};


const format = rawCombined =>
    Object.keys(rawCombined).map(
        state => {
            const { vaxData, outcomeData } = rawCombined[state];
            console.log({ vaxData, outcomeData });
            console.log('looking');

            return {
                state,
                location: state,
                // state_code,
                data: vaxData.map(v => {
                    const found = ([...outcomeData]).reverse().find(d => (new Date(d.submission_date)).getTime() < (new Date(v.date).getTime()));
                    return {
                        ...v,
                        ...found
                    };
                })
            }
        },
    );

const formatByPopulation = async formatted => {
    const { data: populationData } = (await request('https://datausa.io/api/data?drilldowns=State&measures=Population&year=latest')).data;
    return formatted.map(({ state, location, data }) => {
        const population = (populationData.find(pop => pop.State === state) || {}).Population;
        return {
            state,
            location,
            stateData: {
                population
            },
            data: data.map(d => {
                const { tot_cases, tot_death, total_vaccinations_per_hundred } = d;
                return {
                    ...d,
                    total_vaccinations_per_hundred: Number(total_vaccinations_per_hundred),
                    ...tot_cases && tot_death && {
                        total_cases_per_million: tot_cases / population * 1000000,
                        total_deaths_per_million: tot_death / population * 1000000,
                    }
                };
            }).filter(hasRequiredFields)
        };
    });
};