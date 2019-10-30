const { createComment, bot } = require('./comment-bot');
const {
    trigger: configTrigger,
    releaseMapper: configReleaseMapper,
    users,
    labels: configLabels,
    released
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

const triggerRelease = (type) => `&emsp;&emsp;&emsp;&emsp;&emsp;&emsp;&emsp;&emsp;&emsp;&emsp;&emsp;&emsp;&emsp;&emsp;&emsp;&emsp;&emsp;&emsp;&emsp;&emsp;&emsp;&emsp;:soon::shipit::octocat:
&emsp;&emsp;&emsp;&emsp;&emsp;${type === 'bugfix' ? ':bug:' : ':rose:'}Shipit Squirrel has this release **${type}** surrounded, be ready for a new version${type === 'bugfix' ? ':beetle:' : ':sunflower:'}`;

const noRelease = `&emsp;&emsp;&emsp;&emsp;&emsp;&emsp;&emsp;&emsp;&emsp;&emsp;&emsp;&emsp;&emsp;&emsp;&emsp;&emsp;&emsp;&emsp;&emsp;&emsp;&emsp;&emsp;:rage1::volcano:
&emsp;&emsp;&emsp;&emsp;&emsp;&emsp;&emsp;&emsp;&emsp;&emsp;&emsp;&emsp;&emsp;:no_bell:Sorry, no release, PR has not yet been merged:see_no_evil:`

const alreadyReleased = `&emsp;&emsp;&emsp;&emsp;&emsp;&emsp;&emsp;&emsp;&emsp;&emsp;&emsp;&emsp;&emsp;&emsp;&emsp;&emsp;&emsp;&emsp;&emsp;&emsp;&emsp;&emsp;:broken_heart::persevere:
&emsp;&emsp;&emsp;&emsp;&emsp;&emsp;&emsp;&emsp;&emsp;&emsp;&emsp;&emsp;&emsp;:mute:Sorry, no release, Pr has already been released:video_game:`

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
            const releasedLabel = context.payload.pull_request.labels.find(({ name }) => name === released);
            const releaseLabel = context.payload.pull_request.labels.find(({ name }) => name in labels);
            if (releasedLabel) {
                context.log(`Already released, not releasing again.`);
                createComment({ ...currPr, body: alreadyReleased }, context);
            } else if (releaseLabel) {
                const type = labels[releaseLabel.name] || 'bugfix';
                context.log(`We will trigger new Release: ${type}!`);
                createComment({ ...currPr, body: triggerRelease(type) }, context);
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
                const { data: pullRequest } = await bot.pulls.get({
                    owner: currPr.owner,
                    repo: currPr.repo,
                    pull_number: currPr.number || currPr.pull_number
                });
                if (pullRequest && pullRequest.merged) {
                    const releasedLabel = pullRequest.labels.find(({ name }) => name === released);
                    if (releasedLabel) {
                        context.log(`Already released, not releasing again.`);
                        createComment({ ...currPr, body: alreadyReleased }, context);
                    } else {
                        const type = releaseMapper[corrected.substring(trigger.length)] || 'bugfix';
                        context.log(`We will trigger new Release: ${type}!`);
                        createComment({ ...currPr, body: triggerRelease(type) }, context);
                        return travisTrigger(currPr, type, context);
                    }
                }
                else {
                    context.log(`PR not merged, not gonna release.`);
                    createComment({ ...currPr, body: noRelease }, context);
                }
            } else {
                context.log(`Not running release, because magic word not present.`);
            }
        }
    });
};
