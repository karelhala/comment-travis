const axios = require('axios');
const { travis } = require('./config.json');

async function travisTrigger({ owner, repo, number, issue_number }, releaseType, context) {
    const body = {
        request: {
            config: {
                env: {
                    PR_NUMBER: issue_number || number,
                    RELEASE_TYPE: releaseType
                },
                script: (travis && travis.script) || 'npm run release:api'
            }
        }
    }

    const travisURL = `https://api.travis-ci.com/repo/${(travis && travis.group) || owner}%2F${(travis && travis.repo) || repo}/requests`;
    context && context.log(`Notifyig travis on URL: ${travisURL}`);
    context && context.log(`With data: ${JSON.stringify(body)}`);
    try {
        axios.post(
            travisURL,
            body,
            {
                headers: {
                    'Content-Type': 'application/json',
                    Accept: 'application/json',
                    'Travis-API-Version': 3,
                    'Authorization': `token ${process.env.TRAVIS_TOKEN}`
                }
            }
        ).catch(({ response: { data, status } }) => {
            context.log('Error status: ', status);
            context.log('Error data: ', data);
        })
    } catch(e) {
        context.log(e);
    }
}

module.exports = travisTrigger;
