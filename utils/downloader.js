const axios = require('axios');

module.exports = async url => {
    return axios({
        url,
        method: "get",
        responseType: "arraybuffer"
    })
}