const { createComment, bot } = require('./comment-bot.js');

const { trigger: configTrigger, releaseMapper: configReleaseMapper, users, monorepo } = require('./config.json');

const trigger = configTrigger || 'release';

const releaseMapper = configReleaseMapper || {
  major: 'major',
  minor: 'minor',
  bugfix: 'bugfix'
}

function calculatePackages(files) {
  return [...new Set(files.map(({ filename }) => `${filename.substring(monorepo.length + 1).split('/')[0]}/`))];
}

/**
 * This is the main entrypoint to your Probot app
 * @param {import('probot').Application} app
 */
module.exports = app => {
  app.log(`Trigger word: ${trigger}`);
  app.log(`${Object.entries(releaseMapper).map(([key, value]) => `will look for - ${key} as ${value}`).join('\n')}`);
  app.on(['issue_comment.edited', 'issue_comment.created'], async context => {
    let allowed = true;
    if (users && !users.some(user => user === context.payload.sender.login)) {
      allowed = false;
    }
    if (allowed && context.payload.comment.body) {
      const corrected = context.payload.comment.body.trim().toLowerCase();
      const isRelease = corrected.search(new RegExp(trigger)) === 0;
      const currPr = context.issue();
      const { data: pullRequest } = await context.github.pullRequests.get(currPr);
      if (isRelease) {
        if (pullRequest.merged) {
          app.log('PR has been merged, let\'s release!');
          const type = releaseMapper[corrected.substring(trigger.length)] || 'bugfix';
          const { data: files } = await context.github.pullRequests.listFiles(currPr);
          const packageFolders = monorepo ? calculatePackages(files) : ['/'];
          context.log(`We will trigger new Release: ${type}!`);
          if (monorepo) {
            createComment({ ...currPr, body: `We will trigger new Release: ${type}!\nFor package folders:\n * ${
              calculatePackages(packageFolders).join('\n * ')
            }` }, context);
          } else {
            createComment({ ...currPr, body: `We will trigger new Release: ${type}!` }, context);
          }
        }

        createComment({ ...currPr, body: 'Sorry no release, PR has not been merged.' }, context);
      }
    }
  });
}
