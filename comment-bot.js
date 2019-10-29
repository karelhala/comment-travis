const Octokit = require("@octokit/rest");
const { botName: cofigBotName } = require('./config.json');
const botName = cofigBotName || 'karelhala-bot';
const octokit = Octokit({
    auth: process.env.GH_TOKEN,
    userAgent: botName,
    previews: ['jean-grey', 'symmetra'],
    timeZone: 'Europe/Prague',
    baseUrl: 'https://api.github.com',
});

const createComment = async ({ repo, owner, number, issue_number, body }, context) => {
    const { data: comments } = await octokit.issues.listComments({
        owner,
        repo,
        issue_number: issue_number || number,
        page: -1
    });
    context && context.log(`Comment triggered - ${body}`);
    if (comments[comments.length - 1] && comments[comments.length - 1].user.login === botName) {
        context && context.log('Last comment from this bot. No comment, sorry.');
        return;
    }
    octokit.issues.createComment({
        repo,
        owner,
        issue_number: issue_number || number,
        body
    });
}

module.exports = {
    createComment,
    bot: octokit
};
