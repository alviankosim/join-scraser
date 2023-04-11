module.exports = (val) => {
    return typeof +val === 'number' && !isNaN(val);
}