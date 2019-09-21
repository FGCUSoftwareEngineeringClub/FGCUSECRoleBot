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
        var messageArguments = args.split(' ');

        switch (messageArguments[0]) {
            case '--stop':
                messageArguments[0] = "guild.reddit.instances"
                if (messageArguments.length == 2) {
                    // removes channel key and reddit URL from db
                    removeRedditFromKey(message, messageArguments, messageArguments[1]);
                } else {
                    message.reply(`!!deployreddit --stop <channelID>\nStops the execution of the reddit deployment in the specified channel.`);
                }
                return;
            case '--edit':
                messageArguments[0] = "guild.reddit.instances"
                if (messageArguments.length == 3) {
                    // appending the argument of "r/...." to make a URL
                    if (messageArguments[2].search("reddit.com/") == -1) {
                        if (messageArguments[2].search("/") == 0) {
                            messageArguments[2] = "https://www.reddit.com" + messageArguments[2];
                        } else {
                            messageArguments[2] = "https://www.reddit.com/" + messageArguments[2];
                        }
                    }
                    const last_char_of_URL = messageArguments[2].charAt(messageArguments[2].length - 1);
                    switch (last_char_of_URL) {
                        case '/':
                            messageArguments[2] += ".json"
                            break;
                        default:
                            messageArguments[2] += "/.json"
                            break;
                    }
                    console.log(messageArguments[2])


                    // catching broken link errors
                    var error_given;
                    await request(messageArguments[2], async (error, response, html) => {
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

                        console.log(messageArguments)
                        console.log("aa333aa")
                        setRedditFromKey(message, messageArguments, messageArguments[1], true);

                    });
                } else {
                    message.reply(`!!deployreddit --edit <channelID> <redditURL>\nChanges the given URL of a channel.`);
                }
                return;
            case '--status':
                messageArguments[0] = "guild.reddit.instances"
                if (messageArguments.length == 2) {
                    getValueOfReddit(message, messageArguments, messageArguments[1])
                } else {
                    message.reply(`!!deployreddit --status <channelID>\nGives information about the given channel with respect to reddit deployment.`);
                    let redditValue = message.guild.settings.get("guild.reddit.instances", null);
                    console.log(redditValue);
                }
                return;
            case '--removeall':
                delete_instances(message);
                let redditValue = message.guild.settings.get("guild.reddit.instances", null);
                console.log(redditValue);
                return;
            default:
                if (messageArguments.length == 2) {
                    // appending the argument of "r/...." to make a URL
                    if (messageArguments[1].search("reddit.com/") == -1) {
                        if (messageArguments[1].search("/") == 0) {
                            messageArguments[1] = "https://www.reddit.com" + messageArguments[1];
                        } else {
                            messageArguments[1] = "https://www.reddit.com/" + messageArguments[1];
                        }
                    }
                    const last_char_of_URL = messageArguments[1].charAt(messageArguments[1].length - 1);
                    switch (last_char_of_URL) {
                        case '/':
                            messageArguments[1] += ".json"
                            break;
                        default:
                            messageArguments[1] += "/.json"
                            break;
                    }
                    console.log(messageArguments[1])


                    // catching broken link errors
                    var error_given;
                    await request(messageArguments[1], async (error, response, html) => {
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

                        messageArguments = ["guild.reddit.instances", messageArguments[0], messageArguments[1]];


                        if (messageArguments[1] === undefined) {
                            messageArguments[1] = "id" + message.channel.id;
                        } else {
                            messageArguments[1] = "id" + messageArguments[1];
                        }

                        //checks whether the given channelID already exists
                        var key_value_exits = message.guild.settings.get(messageArguments[0], null);
                        key_value_exits = JSON.parse(key_value_exits)
                        if (key_value_exits !== null) {
                            for (var z in key_value_exits.instances) {
                                console.log(z)
                                if (key_value_exits.instances[z][messageArguments[1]] !== undefined) {
                                    message.reply(`${messageArguments[1]} was already found\nTry using "--edit"`);
                                    return;
                                }
                            }
                        }

                        if (getValueOfReddit(message, messageArguments, messageArguments[1], true) === undefined) {
                            var default_instance_object = {
                                "instances": [
                                ]
                            };
                            default_instance_object.instances.push({ [messageArguments[1]]: messageArguments[2] });
                            default_instance_object = JSON.stringify(default_instance_object);
                            message.guild.settings.set("guild.reddit.instances", default_instance_object);
                            initializeInstance(message, messageArguments);
                            console.log("Default created!")
                            message.reply(`First Reddit instance made!`);
                            return;
                        } else {
                            setRedditFromKey(message, messageArguments, messageArguments[1], false);
                            console.log("new instance added")
                            initializeInstance(message, messageArguments);
                        }
                        //if flag set for startup, put variables in here.
                        //initializeInstance(message, messageArguments);
                        return;
                    });
                } else {
                    message.reply(`!!deployreddit <channelID> <redditURL>\nAdds a reddit instance to a given channel.`);
                }
                break;
        }
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

function initializeInstance(message, messageArguments) {
    //console.log(message.channel.id) gets the ID of current text channel
    const daily_time = 'at 08:00am';
    const testing_time = 'every 20 seconds';
    const redditURL = messageArguments[2];
    var sched = later.parse.text(testing_time);
    later.date.localTime(); // time default is UTC | 4 hours ahead of FL
    //query_reddit(message, redditURL);
    //later.setInterval(function () { query_reddit(message, redditURL); }, sched);   / / interval_instance.clear() clears timer
}

function removeRedditFromKey(message, messageArguments, channelID) {
    var redditValue = message.guild.settings.get(messageArguments[0], null);
    if (redditValue == null) {
        message.reply(`${messageArguments[0]} was not found`);
        return undefined;
    }
    if (channelID === undefined) {
        channelID = "id" + message.channel.id;
    } else {
        channelID = "id" + channelID;
    }
    redditValue = JSON.parse(redditValue)
    console.log(redditValue.instances)
    for (key in redditValue.instances) {
        if (redditValue.instances[key][channelID] !== undefined) {
            redditValue.instances.splice(key, 1);
            redditValue = JSON.stringify(redditValue);
            if (typeof redditValue === 'string') {
                message.guild.settings.set(messageArguments[0], redditValue);
                message.reply(`${channelID} was removed from this guild`);
                return;
            }
            break;
        }
    }

    message.reply(`${channelID} was not found`);
    return undefined;
}

function setRedditFromKey(message, messageArguments, channelID, edit) {
    const [redditKey, tempChannelID, newSetting] = messageArguments;
    channelID = tempChannelID;
    status_of_value = getValueOfReddit(message, messageArguments, channelID, true);
    console.log(status_of_value)
    if (status_of_value === undefined && edit == true) {
        if (channelID === undefined) {
            channelID = "id" + message.channel.id;
        } else {
            channelID = "id" + channelID;
        }
        var default_instance_object = {
            "instances": [
            ]
        };
        default_instance_object.instances.push({ [channelID]: newSetting });
        default_instance_object = JSON.stringify(default_instance_object);
        message.guild.settings.set(redditKey, default_instance_object);
        console.log("Default created!")
        message.reply(`Reddit instances can now be made!`);
        return;
    } else if (status_of_value === null) {
        console.log("ID not found")
        //return;
    }

    if (channelID.search("id") == -1) {
        if (channelID === undefined) {
            channelID = "id" + message.channel.id;
        } else {
            channelID = "id" + channelID;
        }
    }

    var redditValue = message.guild.settings.get(redditKey, null);
    redditValue = JSON.parse(redditValue)
    for (key in redditValue.instances) {
        if (redditValue.instances[key][channelID] !== undefined) {
            //console.log("Matched!");
            redditValue.instances[key][channelID] = newSetting;
            redditValue = JSON.stringify(redditValue);
            if (typeof redditValue === 'string') {
                message.guild.settings.set(redditKey, redditValue);
                message.reply(`${redditKey} was assigned ${JSON.parse(redditValue).instances[key][channelID]}`);
                return redditValue;
            }
            break;
        }
    }

    // Adding a new ID and value
    var redditValue = message.guild.settings.get(redditKey, null);
    redditValue = JSON.parse(redditValue)
    //console.log("testing testing")
    redditValue.instances.push({ [channelID]: newSetting });
    //console.log(JSON.stringify(redditValue))
    redditValue = JSON.stringify(redditValue);
    message.guild.settings.set(redditKey, redditValue);

    message.reply(`${channelID} was assigned ${newSetting}`);
    return;
}

function getValueOfReddit(message, messageArguments, channelID, setting_default) {
    if (channelID.search("id") == -1) {
        if (channelID === undefined) {
            channelID = "id" + message.channel.id;
        } else {
            channelID = "id" + channelID;
        }
    }
    var redditValue = message.guild.settings.get(messageArguments[0], null);
    //console.log(redditValue)
    if (redditValue == null) {
        if (!setting_default) {
            message.reply(`${messageArguments[0]} was not found`);
            return undefined;
        } else {
            return undefined;
        }
    }
    redditValue = JSON.parse(redditValue)
    //console.log(redditValue)
    //console.log(channelID)
    for (key in redditValue.instances) {
        if (redditValue.instances[key][channelID] !== undefined) {
            //console.log("Matched!");
            redditValue = redditValue.instances[key][channelID];
            break;
        }
    }

    if (typeof redditValue !== 'string' && setting_default) {
        return null;
    } else if (typeof redditValue !== 'string') {
        message.reply(`The given ID for ${messageArguments[0]} was not found`);
        return null;
    }
    else {
        if (setting_default != true) {
            message.reply(`Value for ${channelID} is ${redditValue}`);
            return redditValue;
        } else {
            return redditValue;
        }
    }
}

function delete_instances(message) {
    console.log(message.guild.settings.remove('guild.reddit.instances', null))
}

async function query_reddit(message, redditURL) {
    await request(redditURL, (error, response, html) => {
        if (!error && response.statusCode == 200) {
            const json_data = JSON.parse(html);
            for (var counter = 0; counter < json_data.data.dist; counter++) {
                if (json_data.data.children[counter].data.post_hint == "image" || linksToImage(json_data.data.children[counter].data.url)) {
                    const message_to_embed = {
                        "image": {
                            "url": json_data.data.children[counter].data.url
                        }
                    };
                    message.embed(message_to_embed).then(async function (reply) {
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