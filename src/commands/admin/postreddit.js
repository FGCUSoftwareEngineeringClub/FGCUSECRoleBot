const Discord = require('discord.js');
const Logger = require('../../logging/Logger');
const request = require('request');
const later = require('later');

async function initializeInstance(discordClient) {
  if (discordClient !== undefined) {
    const DAILY_POST_TIME = 'at 08:00am';
    const TESTING_POST_TIME = 'every 20 seconds';
    const sched = later.parse.text(TESTING_POST_TIME);

    later.date.localTime(); // time default is UTC | 4 hours ahead of FL

    const guild = discordClient.guilds.keyArray()[0];
    let instances = await discordClient.guilds.get(guild).settings.get('guild.reddit.instances');
    instances = await JSON.parse(instances);
    for (let index = 0; index < instances.instances.length; index++) {
      for (x in instances.instances[index]) {
        const channelID = x;
        const redditURL = instances.instances[index][x];
        await queryReddit(discordClient, redditURL, x);
        // await later.setInterval(function() {
        //   query_reddit(redditURL, discordClient, channelID);
        // }, sched);
      }
    }
  }
}

async function queryReddit(discordClient, redditURL, channelID) {
  await request(redditURL, (error, response, html) => {
    if (!error && response.statusCode == 200) {
      const jsonData = JSON.parse(html);
      for (let index = 0; index < jsonData.data.dist; index++) {
        if (jsonData.data.children[index].data.post_hint == 'image'
        || linksToImage(jsonData.data.children[index].data.url)) {
          if (discordClient !== null) {
            const messageToEmbed = new Discord.RichEmbed();
            messageToEmbed.setImage(jsonData.data.children[index].data.url);
            const channel = discordClient.channels.get('619024772898095115');
            channel.send(messageToEmbed).then(async function(reply) {
              reply.channel.fetchMessage(reply.id).then(async function(messageRetrieved) {
                await messageRetrieved.react('👍');
                await messageRetrieved.react('👎');
              });
            });
            return;
          }
        }
      }
    }
  });
  console.log('Reddit post made:', new Date());
}

const linksToImage = (link) => {
  const IMG_EXTENSIONS = ['jpg', 'png', 'gif'];
  const linkExtension = link.substr(link.length - 3);
  if (IMG_EXTENSIONS.includes(linkExtension)) {
    return true;
  }
  return false;
};

module.exports = {initializeInstance: initializeInstance};
