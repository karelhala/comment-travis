const axios = require('axios');
const { travis } = require('./config.json');

function travisTrigger(prNumber, releaseType) {
    const body = {
        request: {
            config: {
                env: {
                    PR_NUMBER: prNumber,
                    RELEASE_TYPE: releaseType
                },
                script: 'npm run clean; npm instal; npm run release'
            }
        }
    }

    const travisURL = `https://api.travis-ci.com/repo/${travis.group}%2F${travis.repo}/requests`
    axios.post(
        travisURL,
        JSON.stringify(body),
        {
            'Content-Type': 'application/json',
            Accept: 'application/json',
            'Travis-API-Version': 3,
            'Authorization': `token ${process.env.TRAVIS_TOKEN}`
        }
    )
}

module.exports = travisTrigger;