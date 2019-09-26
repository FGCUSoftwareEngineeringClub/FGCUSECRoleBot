const Commando = require('discord.js-commando');
const Logger = require('../../logging/Logger');
const request = require('request');
const later = require('later');

class DeployReddit extends Commando.Command {
  constructor(client) {
    super(client, {
      name: 'deployreddit',
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
          if (validatedLink(message, link)) {
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
          // debugging
          const instanceKey = 'guild.reddit.instances';
          const instances = message.guild.settings.get(instanceKey, null);
          console.log(instances);

          message.reply(`!!deployreddit --status <channelID>\nGives information about the given channel with respect to reddit deployment.`);
        }
        return;
      case '--removeall':
        // debugging
        const instanceKey = 'guild.reddit.instances';
        const instances = message.guild.settings.get(instanceKey, null);
        console.log(instances);

        deleteAllInstances(message);
        return;
      default:
        if (messageArguments.length == 2) {
          const instanceKey = 'guild.reddit.instances';
          let channelID = messageArguments[0];
          const link = refactorLink(messageArguments[1]);

          if (!validatedLink(message, link)) return;

          channelID = refactorID(message, channelID);

          if (doesChannelExist(message, instanceKey, channelID)) return;

          if (!isFirstInstance(message, instanceKey, channelID, link)) {
            setRedditFromKey(message, instanceKey, channelID, link);
            initializeInstance(message, link);
            console.log(`${channelID} : ${link} has been added to Reddit instances.`);
          }
          return;
        } else {
          message.reply(`!!deployreddit <channelID> <redditURL>\nAdds a reddit instance to a given channel.`);
        }
        return;
    }
  }
}

function initializeInstance(message, redditURL) {
  const DAILY_POST_TIME = 'at 08:00am';
  const TESTING_POST_TIME = 'every 20 seconds';
  const sched = later.parse.text(TESTING_POST_TIME);
  later.date.localTime(); // time default is UTC | 4 hours ahead of FL
  // query_reddit(message, redditURL);
  // later.setInterval(function () { query_reddit(message, redditURL); }, sched);
}

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

  message.reply(`${channelID} was not in instances.`);
  return undefined;
}

function updateRedditFromKey(message, instanceKey, channelID, redditURL) {
  channelID = refactorID(message, channelID);

  // Altering old value
  let redditValue = message.guild.settings.get(instanceKey, null);
  redditValue = JSON.parse(redditValue);
  for (index in redditValue.instances) {
    if (redditValue.instances[index][channelID] !== undefined) {
      redditValue.instances[index][channelID] = redditURL;
      redditValue = JSON.stringify(redditValue);
      if (typeof redditValue === 'string') {
        console.log('altering old val');
        message.guild.settings.set(instanceKey, redditValue);
        message.reply(`${instanceKey} was assigned ${redditURL}`);
        return redditValue;
      }
      break;
    }
  }
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

function getValueOfReddit(message, instanceKey, channelID) {
  let redditValue = message.guild.settings.get(instanceKey, null);
  if (redditValue == null) {
    message.reply(`${instanceKey} was not found`);
    return undefined;
  }
  redditValue = JSON.parse(redditValue);
  for (key in redditValue.instances) {
    if (redditValue.instances[key][channelID] !== undefined) {
      redditValue = redditValue.instances[key][channelID];
      break;
    }
  }

  if (typeof redditValue !== 'string') {
    message.reply(`The given ID for ${instanceKey} was not found`);
    return null;
  } else {
    message.reply(`Value for ${channelID} is ${redditValue}`);
    return redditValue;
  }
}

function doesDefaultInstanceExist(message, instanceKey, channelID) {
  const redditValue = message.guild.settings.get(instanceKey, null);
  return (redditValue == null) ? false : true;
}

function deleteAllInstances(message) {
  const instanceKey = 'guild.reddit.instances';
  message.guild.settings.remove(instanceKey, null);
  console.log('All instances deleted.');
}

async function queryReddit(message, redditURL) {
  await request(redditURL, (error, response, html) => {
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
          message.embed(imageToEmbed).then(async function(reply) {
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
    initializeInstance(message, redditURL);
    message.reply(`First Reddit instance made!`);
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
        message.reply(`${channelID} was already found\nTry using "--edit" or "--stop`);
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
  let errorGiven;
  await request(link, async (error, response, html) => {
    let jsonData;
    try {
      jsonData = await JSON.parse(html);
    } catch (e) {
      message.say('Sorry, this link did not work.');
      return false;
    }
    errorGiven = jsonData.error == '404' ? true : false;

    if (error) {
      message.say('Sorry, this link did not work.');
      return false;
    } else if (errorGiven == true) {
      message.say('Sorry, this link did not work.');
      return false;
    }
  });
  return true;
};

module.exports = DeployReddit;
