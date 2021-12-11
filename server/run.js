(async () => {
    const file = process.argv.slice(2).join('');
    console.log({ file });
    const module = require(`./` + file);
    const response = await module();
    if (response) {
        console.log(
            JSON.stringify(response, null, 2)
        );
    }
})();