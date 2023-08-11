const Discord = require('discord.js');
const axios = require('axios');
const cron = require('node-cron');
const config = require('./config.json');

const client = new Discord.Client();

client.once('ready', () => {
  console.log('Bot is online!');
  console.log('Code by 约 - Wick');

  
  cron.schedule('*/30 * * * * *', () => { // check every 30 seconds
    checkGitHubProfile();
  });
});

client.login(config.token);


async function checkGitHubProfile() {
  const channel = client.channels.cache.get(config.channelId);
  if (!channel || !(channel instanceof Discord.TextChannel)) {
    console.error('Invalid channel or channel type.');
    return;
  }

  try {
    const response = await axios.get(`https://api.github.com/users/${config.githubProfile}/events`);
    const repositoryEvents = response.data.filter(event => (
      (event.type === 'CreateEvent' && event.payload.ref_type === 'repository') ||
      event.type === 'PushEvent'
    ));

    for (const event of repositoryEvents) {
      const lastTimestamp = config.lastEventTimestamp;
      const eventTimestamp = new Date(event.created_at).getTime();

      if (!lastTimestamp || eventTimestamp > lastTimestamp) {
     
        config.lastEventTimestamp = eventTimestamp;

        if (event.type === 'CreateEvent') {
      
          const repoName = event.repo.name;
          const repoUrl = event.repo.url;
          const repoDescription = event.payload.description;

          const embed = new Discord.MessageEmbed()
            .setTitle(`New GitHub Repository Created`)
            .addField('Repository Name', repoName)
            .addField('Description', repoDescription || 'No description provided')
            .addField('Check it out', `[Here](${repoUrl})`)
            .setColor('#36a64f')
            .setTimestamp();

          channel.send(embed);
        } else if (event.type === 'PushEvent') {
          const repoName = event.repo.name;
          const commits = event.payload.commits;

          for (const commit of commits) {
            const commitMessage = commit.message;
            const commitUrl = commit.url;

            const embed = new Discord.MessageEmbed()
              .setTitle(`File(s) updated in GitHub Repository`)
              .addField('Repository Name', repoName)
              .addField('Commit Message', commitMessage || 'No commit message provided')
              .addField('Commit Details', `[Here](${commitUrl})`)
              .setColor('#36a64f')
              .setTimestamp();

            channel.send(embed);
          }
        }
      }
    }
  } catch (error) {
    console.error(`An error occurred while fetching data:`, error);
  }
}
