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
                    messageArguments[0] = "guild.reddit.stop"
                    setRedditFromKey(message, messageArguments);
                } else {
                    messageArguments[0] = "guild.reddit.stop"
                    getValueOfReddit(message, messageArguments)
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
 */

function setRedditFromKey(message, messageArguments) {
    const [redditKey, newSetting] = messageArguments;
    console.log(redditKey + " " + newSetting);
    if (redditNames.includes(redditKey)) {
        Logger.info({
            server: message.guild,
            message: `${message.author.tag} updated ${redditKey} to ${newSetting}`,
        });
        message.guild.settings.set(redditKey, newSetting);
        return message.reply(`${redditKey} was assigned '${newSetting}'`);
    } else {
        return message.reply('Only preset settings can be set or modified. ' +
            'Use --listkeys to see a list of possible options.');
    }
}

function getValueOfReddit(message, messageArguments) {
    const redditValue = message.guild.settings.get(messageArguments[0], null);
    if (redditValue) {
        return message.reply(`Value for ${messageArguments[0]} is ${redditValue}`);
    } else {
        return message.reply(`There is no value for key ${messageArguments[0]}`);
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
