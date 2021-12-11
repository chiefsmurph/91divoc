
const request = require('axios');
const fs = require('fs/promises');
const csvToJson = require('csvtojson');
const { groupBy, mapObject } = require('underscore');

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
    const ordered = mapObject(
        outcomes, 
        data => data.sort((a, b) => (new Date(a.submission_date)).getTime() - (new Date(b.submission_date)).getTime())
    );
    return outcomes;
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


    const combined = Object.values(twoLetterToFull).reduce((acc, state) => ({
        ...acc,
        [state]: {
            vaxData: getStateData(vaxData, state),
            outcomeData: getStateData(outcomeData, state),
        }
    }), {});

    // console
    return combined;
};