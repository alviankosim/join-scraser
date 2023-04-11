const axios = require('axios');
const ua = require('./ua');

module.exports = async (url) => {
    const { data } = await axios.get(url, { headers: ua[Math.floor(Math.random() * ua.length)] });
    return data;
}