const Discord = require('discord.js');
const Commando = require('discord.js-commando');
const Logger = require('../../logging/Logger');
const { redditKeys, redditNames } = require('../../settings/SettingsProvider');
const request = require('request');
var later = require('later');

class DeployReddit extends Commando.Command {
    /** @param {Commando.CommandoClient} client */
    constructor(client) {
        super(client, {
            name: 'deployreddit',
            description: 'Deploys the top img in any subreddit every 24hrs',
            guildOnly: true,
            group: 'admin',
            memberName: 'deployreddit',
        });
    }

    /**
     *  TO-DO
     *  Example Args
     *  !!deployreddit --stop
     *      stops execution
     *  !!deployreddit --edit
     *      here's how you can edit:
     *  !!deployreddit --edit https:newlink
     *      Link updated
     * !!deployreddit --status
     *      gives current link, and iteration time
     * 
     *  if (!!deployreddit http:link) when an instance is already deployed
     *      send message to try using --stop or --edit
     * 
     *  upon bot reset, if instance was active when shutdown, relauch this instance
     */

    async run(message, args) {
        const messageArguments = args.split(' ');

        switch (messageArguments[0]) {
            case '--stop':
                if (messageArguments.length > 1) {
                    messageArguments[0] = "guild.reddit.instances"
                    aaasetRedditFromKey(message, messageArguments);
                } else {
                    messageArguments[0] = "guild.reddit.instances"
                    console.log(aaagetValueOfReddit(message, messageArguments, "1234"))
                }
                return;
            case '--edit':
                if (messageArguments[1].length > 0) {
                    //test the url and replace
                } else {
                    //send message about how to edit
                }
                return;
            case '--status':
                TESTING(message);
                return;
            default:
                break;
        }

        // appending the argument of "r/...." to make a URL
        if (messageArguments[0].search("reddit.com/") == -1) {
            if (messageArguments[0].search("/") == 0) {
                messageArguments[0] = "https://www.reddit.com" + messageArguments[0];
            } else {
                messageArguments[0] = "https://www.reddit.com/" + messageArguments[0];
            }
        }
        const last_char_of_URL = messageArguments[0].charAt(messageArguments[0].length - 1);
        switch (last_char_of_URL) {
            case '/':
                messageArguments[0] += ".json"
                break;
            default:
                messageArguments[0] += "/.json"
                break;
        }
        console.log(messageArguments[0])


        // catching broken link errors
        var error_given;
        await request(messageArguments[0], async (error, response, html) => {
            var json_data;
            try {
                json_data = await JSON.parse(html)
            } catch (e) {
                message.say("Sorry, this link did not work.");
                return;
            }
            error_given = json_data.error == '404' ? true : false;

            if (error) {
                message.say("Sorry, this link did not work.");
                return;
            } else if (error_given == true) {
                message.say("Sorry, this link did not work.");
                return;
            }

            //console.log(message.channel.id) gets the ID of current text channel
            const daily_time = 'at 08:00am';
            const testing_time = 'every 10 seconds';
            var sched = later.parse.text(testing_time);
            // time default is UTC | 4 hours ahead of FL
            later.date.localTime();
            var interval_instance = later.setInterval(function () { query_reddit(message, messageArguments[0], interval_instance) }, sched);   // interval_instance.clear() clears timer
        });
    }
}

/**
 * 
 * ANY NEW SETTINGS NEED TO BE ADDED TO "SettingsProvider"
 * 
 * 
 *    Method to alter guild.reddit.instance
 array = [["a","b","c"],["d","e","f"],["g","h","i"]]
 console.log(array)
 for (element in array) {
   if(array[element][0] == "d") {
     array.splice(element,1)
   }
 }
 console.log(array)
 * 
 * 
 */

function setRedditFromKey(message, messageArguments) {
    const [redditKey, newSetting] = messageArguments;
    //console.log(redditKey + " " + newSetting);
    //var collection = [["a", "b", "c"], ["d", "e", "f"], ["g", "h", "i"]]
    //var collection = { type: "Fiat", model: "500", color: "white" };
    var collection = {
        "instances": {
            id12313: "something1",
            id1234: "something2",
        }
    };



    if (redditNames.includes(redditKey)) {
        Logger.info({
            server: message.guild,
            message: `${message.author.tag} updated ${redditKey} to ${newSetting}`,
        });
        message.guild.settings.set(redditKey, JSON.stringify(collection));
        return message.reply(`${redditKey} was assigned '${newSetting}'`);
    } else {
        return message.reply('Only preset settings can be set or modified. ' +
            'Use --listkeys to see a list of possible options.');
    }
}

function aaasetRedditFromKey(message, messageArguments, channelID) {
    const [redditKey, newSetting] = messageArguments;
    //console.log(aaagetValueOfReddit(message, messageArguments, "12313"))
    if (aaagetValueOfReddit(message, messageArguments, "12313", true) === undefined) {
        var default_instance_object = {
            "instances": [
            ]
        };
        default_instance_object.instances.push({ id12313: "something1" });
        default_instance_object.instances.push({ id1234: "something2" });
        default_instance_object = JSON.stringify(default_instance_object);
        //console.log(default_instance_object)
        message.guild.settings.set(redditKey, default_instance_object);
        console.log("Default created!")
        return;
    }
    var redditValue = message.guild.settings.get(redditKey, null);
    redditValue = JSON.parse(redditValue)
    for (key in redditValue.instances) {
        //console.log(key)
        console.log(redditValue.instances[0]["id12313"])
        if (redditValue.instances[key]["id12313"] !== undefined) {
            //console.log("Matched!");
            redditValue = redditValue.instances[key]["id12313"];
            break;
        }
    }
    //console.log(redditValue)
    if (typeof redditValue !== 'string') {
        message.reply(`The given ID for ${messageArguments[0]} was not found`);
        return null;
    } else {
        message.reply(`Value for ${messageArguments[0]} is ${redditValue}`);
        return redditValue;
    }
}

function TESTING(message) {
    console.log(message.guild.settings.remove('guild.reddit.instances', null))
}

function getValueOfReddit(message, messageArguments, channelID) {
    var redditValue = message.guild.settings.get(messageArguments, null);
    console.log(messageArguments)
    redditValue = JSON.parse(redditValue)
    console.log(redditValue)
    //console.log(redditValue.instances.id12313)
    //console.log(redditValue.instances.id1234)
    for (x in redditValue.instances) {
        if (channelID === x) console.log(redditValue.instances[x]);
        redditValue.instances[x] = "changedval"
        console.log(redditValue.instances[x])
        var toChange = JSON.stringify(redditValue);
        message.guild.settings.set("guild.reddit.instances", toChange);
    }
    if (redditValue) {
        return message.reply(`Value for ${messageArguments[0]} is ${redditValue}`);
    } else {
        return message.reply(`There is no value for key ${messageArguments[0]}`);
    }
}

function aaagetValueOfReddit(message, messageArguments, channelID, setting_default) {
    channelID = "id" + channelID;
    var redditValue = message.guild.settings.get(messageArguments[0], null);
    if (redditValue == null) {
        if (!setting_default) {
            message.reply(`${messageArguments[0]} was not found`);
            return undefined;
        } else {
            return undefined;
        }
    }
    redditValue = JSON.parse(redditValue)
    for (key in redditValue.instances) {
        //console.log(key)
        //console.log(redditValue.instances[key][channelID])
        if (redditValue.instances[key][channelID] !== undefined) {
            //console.log("Matched!");
            redditValue = redditValue.instances[key][channelID];
            break;
        }
    }
    //console.log(redditValue)

    if (typeof redditValue !== 'string') {
        message.reply(`The given ID for ${messageArguments[0]} was not found`);
        return null;
    } else {
        message.reply(`Value for ${messageArguments[0]} is ${redditValue}`);
        return redditValue;
    }
}

async function query_reddit(message, redditURL, interval_instance) {
    //console.log(redditURL)
    await request(redditURL, (error, response, html) => {
        if (!error && response.statusCode == 200) {
            const json_data = JSON.parse(html);
            for (var counter = 0; counter < json_data.data.dist; counter++) {
                //console.log(json_data.data.children[counter].data.post_hint)
                if (json_data.data.children[counter].data.post_hint == "image" || linksToImage(json_data.data.children[counter].data.url)) {
                    const message_to_embed = {
                        "image": {
                            "url": json_data.data.children[counter].data.url
                        }
                    };
                    message.embed(message_to_embed).then(async function (reply) {
                        //console.log(reply.id)
                        reply.channel.fetchMessage(reply.id).then(async function (message_retrieved) {
                            await message_retrieved.react('👍');
                            await message_retrieved.react('👎');
                        });
                    });
                    return;
                }
            }
        }
    });
    console.log(new Date());
}

function linksToImage(link) {
    img_extensions = ['jpg', 'png', 'gif']
    //console.log(link.substr(link.length - 3));
    if (img_extensions.includes(link.substr(link.length - 3))) {
        return true;
    }
    return false;
}

module.exports = DeployReddit;
