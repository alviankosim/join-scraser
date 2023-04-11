module.exports = (arr, by = '', keepBy = false, stopsWhen = '') => {
    const finalArr = [];
    let tempArr = [];
    arr.every(o => {
        const _o = o?.paripurna();
        if (stopsWhen !== '' && _o.includes(stopsWhen)) {
            return;
        }
        if ((_o && by === '') || (_o && by !== '' && !_o.startsWith(by))) {
            tempArr.push(_o);
        } else {
            if (tempArr.length > 0) {
                finalArr.push(tempArr);
            }
            tempArr = [];
            if (keepBy) {
                tempArr.push(_o)
            }
        }

        return true;
    });

    // for the last one
    if (tempArr.length > 0) {
        finalArr.push(tempArr);
    }

    return finalArr;
}