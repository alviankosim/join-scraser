const isnumber = require("./isnumber");

const handleArgOrdering = (flag, idx) => {
    if (!(process.argv?.[idx + 1] && !isnumber(process.argv?.[idx + 1]) 
        && ['ASC','DESC'].includes(process.argv?.[idx + 1]))) {
            throw new Error(`Please check argument ${flag} and its value`);
    }
    return process.argv?.[idx + 1].trim();
}

const handleArgMinDataFetched = (flag, idx) => {
    if (!(process.argv?.[idx + 1] && isnumber(process.argv?.[idx + 1]))) {
        throw new Error(`Please check argument ${flag} and its value`);
    }
    return parseInt(process.argv?.[idx + 1], 10);
}

const _parser = (flag, idx) => {
    switch (flag) {
        case '--min-data-fetched':
            return handleArgMinDataFetched(flag, idx);
        case '--ordering':
            return handleArgOrdering(flag, idx);
        default:
            return false;
    }
}

module.exports = flag => {
    const finding = process.argv.findIndex(o => o === flag);
    if (finding < 0) {
        return;
    }
    if ((finding > 0 && !process.argv?.[finding + 1])) {
        throw new Error(`Please check argument ${flag} and its value`);
    }

    return _parser(flag, finding)
}