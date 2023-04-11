const fs = require('fs').promises;
const path = require('path');

module.exports = async (data, filenamePrefix = 'JOURNAL') => {
    const currDatetime = (new Date(Date.now() - (new Date()).getTimezoneOffset() * 60000))
        .toISOString().slice(0, 19).replace(/[^0-9]/g, "");

    const saveDir = path.join(__dirname, '..', `fetched/${filenamePrefix} - ${currDatetime}.json`);
    await fs.writeFile(saveDir, JSON.stringify(data, null, 2), 'utf8');
    return `'${JSON.stringify(saveDir)}'`;
}