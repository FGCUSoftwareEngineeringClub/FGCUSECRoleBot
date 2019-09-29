const Commando = require('discord.js-commando');
const Logger = require('../../logging/Logger');
const request = require('request-promise');
const later = require('later');

/**
 * Sends an embedded message containing the most popular image on a given subreddit at
 * a given time for a selected guild channel, daily. Offers C.R.U.D functionality for 
 * users to be able to manipulate their deployed instances.
 */
class DeployReddit extends Commando.Command {
  constructor(client) {
    super(client, {
      name: 'dreddit',
      description: 'Deploys the top img in any subreddit every 24hrs',
      guildOnly: true,
      group: 'admin',
      memberName: 'deployreddit',
    });
  }

  async run(message, args) {
    const messageArguments = args.split(' ');

    switch (messageArguments[0]) {
      case '--stop':
        if (messageArguments.length == 2) {
          const instanceKey = 'guild.reddit.instances';
          const channelID = messageArguments[1];
          deleteRedditInstance(message, instanceKey, channelID);
        } else {
          message.reply(`!!deployreddit --stop <channelID>\nStops the execution of the reddit deployment in the specified channel.`);
        }
        return;
      case '--edit':
        if (messageArguments.length == 3) {
          const instanceKey = 'guild.reddit.instances';
          const channelID = messageArguments[1];
          const link = refactorLink(messageArguments[2]);
          if (await validatedLink(message, link)) {
            updateRedditFromKey(message, instanceKey, channelID, link);
          }
        } else {
          message.reply(`!!deployreddit --edit <channelID> <redditURL>\nChanges the given URL of a channel.`);
        }
        return;
      case '--status':
        if (messageArguments.length == 2) {
          const instanceKey = 'guild.reddit.instances';
          const channelID = refactorID(message, messageArguments[1]);
          getValueOfReddit(message, instanceKey, channelID);
        } else {
          // debugging - remove following comments to enable debugging
          // const instanceKey = 'guild.reddit.instances';
          // const instances = message.guild.settings.get(instanceKey, null);
          // console.log(instances);

          message.reply(`!!deployreddit --status <channelID>\nGives information about the given channel with respect to reddit deployment.`);
        }
        return;
      case '--removeall':
        // debugging - remove following comments to enable debugging
        // const instanceKey = 'guild.reddit.instances';
        // const instances = message.guild.settings.get(instanceKey, null);
        // console.log(instances);

        deleteAllInstances(message);
        return;
      default:
        if (messageArguments.length == 2) {
          const instanceKey = 'guild.reddit.instances';
          let channelID = messageArguments[0];
          const link = refactorLink(messageArguments[1]);

          if (await validatedLink(message, link) != true) return;

          channelID = refactorID(message, channelID);

          if (doesChannelExist(message, instanceKey, channelID)) return;

          if (!isFirstInstance(message, instanceKey, channelID, link)) {
            setRedditFromKey(message, instanceKey, channelID, link);
            initializeInstance(message, link, channelID);
            console.log(`${channelID} : ${link} has been added to Reddit active instances.`);
          }
          return;
        } else {
          message.reply(`!!deployreddit <channelID> <redditURL>\nAdds a reddit instance to a given channel.`);
        }
        return;
    }
  }
}

/**
 * Launches a Reddit instance upon first creation into
 * specified channel
 */
function initializeInstance(message, redditURL, channelID) {
  const DAILY_POST_TIME = 'at 08:00am';
  const TESTING_POST_TIME = 'every 20 seconds';
  const schedule = later.parse.text(TESTING_POST_TIME);
  later.date.localTime(); // relative time default is UTC
  queryReddit(message, redditURL, channelID); // one instant deployment
  later.setInterval(function () { queryReddit(message, redditURL, channelID); }, schedule);
}

/**
 * @return undefined if channelID not found or DB not instantiated
 */
function deleteRedditInstance(message, instanceKey, channelID) {
  channelID = refactorID(message, channelID);

  let instances = message.guild.settings.get(instanceKey, null);

  if (instances == null) {
    message.reply(`${instanceKey} was not found.\nTry creating a new instance using "!!deployreddit <channelID> <redditURL>"`);
    return undefined;
  }

  instances = JSON.parse(instances);
  for (index in instances.instances) {
    if (instances.instances[index][channelID] !== undefined) {
      instances.instances.splice(index, 1);
      const newInstances = JSON.stringify(instances);
      if (typeof newInstances === 'string') {
        message.guild.settings.set(instanceKey, newInstances);
        message.reply(`${channelID} was removed from this guild.`);
        return;
      }
      break;
    }
  }

  message.reply(`${channelID} was not in active instances.`);
  return undefined;
}

/**
 * @return stringified JSON of instances if update successful
 */
function updateRedditFromKey(message, instanceKey, channelID, redditURL) {
  channelID = refactorID(message, channelID);
  let instances = message.guild.settings.get(instanceKey, null);
  instances = JSON.parse(instances);
  for (index in instances.instances) {
    if (instances.instances[index][channelID] !== undefined) {
      instances.instances[index][channelID] = redditURL;
      instances = JSON.stringify(instances);
      if (typeof instances === 'string') {
        console.log('altering old val');
        message.guild.settings.set(instanceKey, instances);
        message.reply(`${instanceKey} was assigned ${redditURL}`);
        return instances;
      }
      break;
    }
  }

  message.reply(`${channelID} was not in active instances.`);
  return;
}

function setRedditFromKey(message, instanceKey, channelID, redditURL) {
  let instances = message.guild.settings.get(instanceKey, null);
  instances = JSON.parse(instances);
  instances.instances.push({[channelID]: redditURL});
  instances = JSON.stringify(instances);
  message.guild.settings.set(instanceKey, instances);

  message.reply(`${channelID} was assigned ${redditURL}`);
  return;
}

/**
 * @return undefined if DB not found, null if ID not found, instances string
 */
function getValueOfReddit(message, instanceKey, channelID) {
  let instances = message.guild.settings.get(instanceKey, null);
  if (instances == null) {
    message.reply(`${instanceKey} was not found`);
    return undefined;
  }
  instances = JSON.parse(instances);
  for (key in instances.instances) {
    if (instances.instances[key][channelID] !== undefined) {
      instances = instances.instances[key][channelID];
      break;
    }
  }

  if (typeof instances !== 'string') {
    message.reply(`The given ID for ${instanceKey} was not found`);
    return null;
  } else {
    message.reply(`Value for ${channelID} is ${instances}`);
    return instances;
  }
}

function doesDefaultInstanceExist(message, instanceKey, channelID) {
  const instances = message.guild.settings.get(instanceKey, null);
  return (instances == null) ? false : true;
}

function deleteAllInstances(message) {
  const instanceKey = 'guild.reddit.instances';
  message.guild.settings.remove(instanceKey, null);
  console.log('All instances deleted.');
}

/**
 * Queries Reddit and sends embedded image
 */
async function queryReddit(message, redditURL, channelID) {
  await request(redditURL, async (error, response, html) => {
    if (!error && response.statusCode == 200) {
      const jsonData = JSON.parse(html);
      for (let index = 0; index < jsonData.data.dist; index++) {
        if (jsonData.data.children[index].data.post_hint == 'image'
        || linksToImage(jsonData.data.children[index].data.url)) {
          const imageToEmbed = {
            'image': {
              'url': jsonData.data.children[index].data.url,
            },
          };
          channelID = parseID(channelID);
          const channel = await message.guild.channels.get(channelID);
          channel.send({embed: imageToEmbed}).then(async function(reply) {
            reply.channel.fetchMessage(reply.id).then(async function(messageRetrieved) {
              await messageRetrieved.react('👍');
              await messageRetrieved.react('👎');
            });
          });
          return;
        }
      }
    }
  });
  console.log('Reddit post deployed :', new Date());
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

const refactorID = (message, channelID) => {
  if (channelID === undefined) {
    channelID = 'id' + message.channel.id;
  } else {
    channelID = 'id' + channelID;
  }
  return channelID;
};

const isFirstInstance = (message, instanceKey, channelID, redditURL) => {
  if (doesDefaultInstanceExist(message, instanceKey, channelID) === false) {
    let defaultInstanceObject = {
      'instances': [
      ],
    };
    defaultInstanceObject.instances.push({[channelID]: redditURL});
    defaultInstanceObject = JSON.stringify(defaultInstanceObject);
    message.guild.settings.set(instanceKey, defaultInstanceObject);
    initializeInstance(message, redditURL, channelID);
    message.reply(`First Reddit instance has been deployed!`);
    return true;
  }
  return false;
};

const doesChannelExist = (message, instanceKey, channelID) => {
  let keyValueExits = message.guild.settings.get(instanceKey, null);
  keyValueExits = JSON.parse(keyValueExits);
  if (keyValueExits !== null) {
    for (const z in keyValueExits.instances) {
      if (keyValueExits.instances[z][channelID] !== undefined) {
        message.reply(`${channelID} was already found in active instances\nTry using "--edit" or "--stop`);
        return true;
      }
    }
  }
  return false;
};

const refactorLink = (link) => {
  if (link.search('reddit.com/') == -1) {
    if (link.search('/') == 0) {
      link = 'https://www.reddit.com' + link;
    } else {
      link = 'https://www.reddit.com/' + link;
    }
  }
  const lastCharOfURL = link.charAt(link.length - 1);
  switch (lastCharOfURL) {
    case '/':
      link += '.json';
      break;
    default:
      link += '/.json';
      break;
  }
  return link;
};

const validatedLink = async (message, link) => {
  await request(link, (error, response, html) => {
    let errorGiven;
    let jsonData;
    try {
      jsonData = JSON.parse(html);
    } catch (e) {
      message.reply('Sorry, this link did not work.\nTry using a link like "r/programmerhumor" or "r/memes"');
      return false;
    }

    try {
    errorGiven = (jsonData.data.after == null) ? true : false;
    } catch (e) {
      message.reply('Sorry, this link did not work.\nTry using a link like "r/programmerhumor" or "r/memes"');
      return false;
    }

    if (error) {
      message.reply('Sorry, this link did not work.\nTry using a link like "r/programmerhumor" or "r/memes"');
      return false;
    } else if (errorGiven == true) {
      message.reply('Sorry, this link did not work.\nTry using a link like "r/programmerhumor" or "r/memes"');
      return false;
    }
    return;
  })
  return true;
};

module.exports = DeployReddit;
