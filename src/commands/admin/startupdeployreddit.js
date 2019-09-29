const Discord = require('discord.js');
const Logger = require('../../logging/Logger');
const request = require('request-promise');
const later = require('later');

/**
 * Launches Reddit instances into every channel listed under a guild's
 * active instances in the settings DB upon bot start up.
 */
async function initializeInstance(discordClient) {
  if (discordClient !== undefined) {
    const DAILY_POST_TIME = 'at 08:00am';
    const TESTING_POST_TIME = 'every 20 seconds';
    const schedule = later.parse.text(TESTING_POST_TIME);

    later.date.localTime(); // time default is UTC

    const guild = discordClient.guilds.keyArray()[0];
    let instances = await discordClient.guilds.get(guild).settings.get('guild.reddit.instances');
    instances = await JSON.parse(instances);
    for (let index = 0; index < instances.instances.length; index++) {
      for (x in instances.instances[index]) {
        const channelID = x;
        //await queryReddit(discordClient, redditURL, x); // debugging - instant reply
        await later.setInterval(function() {
           queryReddit(discordClient, channelID);
        }, schedule);
      }
    }
  }
}

/**
 * Queries Reddit and sends embedded image
 */
async function queryReddit(discordClient, channelID) {

  let redditURL;
  const guild = discordClient.guilds.keyArray()[0];
  let instances = await discordClient.guilds.get(guild).settings.get('guild.reddit.instances');
  instances = await JSON.parse(instances);
  for (index in instances.instances) {
    if (instances.instances[index][channelID] !== undefined) {
      redditURL = instances.instances[index][channelID];
    }
  }

  await request(redditURL, (error, response, html) => {
    if (!error && response.statusCode == 200) {
      const jsonData = JSON.parse(html);
      for (let index = 0; index < jsonData.data.dist; index++) {
        if (jsonData.data.children[index].data.post_hint == 'image'
        || linksToImage(jsonData.data.children[index].data.url)) {
          if (discordClient !== null) {
            const messageToEmbed = new Discord.RichEmbed();
            messageToEmbed.setImage(jsonData.data.children[index].data.url);
            channelID = parseID(channelID);
            //const channel = discordClient.channels.get('619024772898095115'); // debugging - all posted on specified channel
            const channel = discordClient.channels.get(channelID);
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
    console.log(error)
  });
  console.log(`Reddit post made from ${channelID} :`, new Date());
}

const parseID = (channelID) => {
  return channelID.substring(2);
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
