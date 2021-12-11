const requiredFields = [
    'total_cases_per_million', 'total_deaths_per_million', 'total_vaccinations_per_hundred'
];
const hasRequiredFields = d => requiredFields.every(key => d[key] !== undefined);

module.exports = hasRequiredFields;