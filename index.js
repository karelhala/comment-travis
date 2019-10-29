const { createComment } = require('./comment-bot');
const {
    trigger: configTrigger,
    releaseMapper: configReleaseMapper,
    users,
    labels: configLabels
} = require('./config.json');
const travisTrigger = require('./travis-bot');

const trigger = configTrigger || 'release';

const releaseMapper = configReleaseMapper || {
    major: 'major',
    minor: 'minor',
    bugfix: 'bugfix'
}

const labels = configLabels || {
    release: 'bugfix',
    'release minor': 'minor'
}

/**
 * This is the main entrypoint to your Probot app
 * @param {import('probot').Application} app
 */
module.exports = app => {
    app.log(`Trigger word: ${trigger}`);
    app.log(`${Object.entries(releaseMapper).map(([key, value]) => `will look for - ${key} as ${value}`).join('\n')}`);
    app.log(`Release labels: \n${Object.entries(labels).map(([key, value]) => `will look for - ${key} as ${value}`).join('\n')}`);

    app.on(['pull_request.closed', 'pull_request.labeled'], async context => {
        const currPr = context.issue();
        context.log(currPr);
        context.log('PR has been closed!');
        if (context.payload.pull_request.merged) {
            context.log('PR has been actually merged!');
            context.log(context.payload.pull_request.labels);
            const releaseLabel = context.payload.pull_request.labels.find(label => label.name in labels);
            if (releaseLabel) {
                const type = labels[releaseLabel.name];
                context.log(`We will trigger new Release: ${type}!`);
                createComment({ ...currPr, body: `We will trigger new Release: ${type}!` }, context);
                return travisTrigger(currPr, type, context);
            } else {
                context.log(`No release label found, no release triggered.`);
            }
        }
    });

    app.on(['issue_comment.edited', 'issue_comment.created'], async context => {
        let allowed = true;
        if (users && !users.some(user => user === context.payload.sender.login)) {
            allowed = false;
        }
        if (allowed && context.payload.comment.body) {
            const corrected = context.payload.comment.body.trim().toLowerCase();
            const isRelease = corrected.search(new RegExp(trigger)) === 0;
            const currPr = context.issue();
            context.log(currPr);
            if (isRelease) {
                const { data: pullRequest } = await context.github.pullRequests.get(currPr);
                if (pullRequest && pullRequest.merged) {
                    const type = releaseMapper[corrected.substring(trigger.length)] || 'bugfix';
                    context.log(`We will trigger new Release: ${type}!`);
                    createComment({ ...currPr, body: `We will trigger new Release: ${type}!` }, context);
                    return travisTrigger(currPr, type, context);
                }
                else {
                    context.log(`PR not merged, not gonna release.`);
                    createComment({ ...currPr, body: 'Sorry no release, PR has not been merged.' }, context);
                }
            }
            context.log(`Not running release, because magic word not present.`);
        }
    });
};
