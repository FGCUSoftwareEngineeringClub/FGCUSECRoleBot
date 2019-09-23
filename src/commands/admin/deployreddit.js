const Discord = require('discord.js');
const Commando = require('discord.js-commando');
const Logger = require('../../logging/Logger');
const { redditKeys, redditNames } = require('../../settings/SettingsProvider');
const request = require('request');
var later = require('later');

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
        var messageArguments = args.split(' ');

        switch (messageArguments[0]) {
            case '--stop':
                if (messageArguments.length == 2) {
                    let instance_key = "guild.reddit.instances";
                    let channel_id = messageArguments[1];
                    delete_reddit_instance(message, instance_key, channel_id);
                } else {
                    message.reply(`!!deployreddit --stop <channelID>\nStops the execution of the reddit deployment in the specified channel.`);
                }
                return;
            case '--edit':
                if (messageArguments.length == 3) {
                    let instance_key = "guild.reddit.instances"
                    let channel_id = messageArguments[1];
                    let link = refactor_link(messageArguments[2]);
                    if (validated_link(link)) updateRedditFromKey(message, instance_key, link, channel_id);
                } else {
                    message.reply(`!!deployreddit --edit <channelID> <redditURL>\nChanges the given URL of a channel.`);
                }
                return;
            case '--status':
                if (messageArguments.length == 2) {
                    let instance_key = "guild.reddit.instances";
                    let channel_id = messageArguments[1];
                    getValueOfReddit(message, instance_key, channel_id);
                } else {
                    //debugging
                    let instance_key = "guild.reddit.instances";
                    let instances = message.guild.settings.get(instance_key, null);
                    console.log(instances);

                    message.reply(`!!deployreddit --status <channelID>\nGives information about the given channel with respect to reddit deployment.`);
                }
                return;
            case '--removeall':
                //debugging
                let instance_key = "guild.reddit.instances";
                let instances = message.guild.settings.get(instance_key, null);
                console.log(instances);

                delete_all_instances(message);
                return;
            default:
                if (messageArguments.length == 2) {
                    let instance_key = "guild.reddit.instances"
                    let channel_id = messageArguments[0];
                    let link = refactor_link(messageArguments[1]);

                    if (!validated_link(link)) return;

                    const channel_id = refactor_id(message, channel_id)

                    if (does_channel_exist(message, instance_key, channel_id)) return;

                    if (!is_first_instance(message, instance_key, channel_id, link)) {
                        setRedditFromKey(message, messageArguments, channel_id, false);
                        initializeInstance(message, link);
                        console.log(`${channel_id} : ${link} has been added to Reddit instances.`)
                    }
                    return;

                } else {
                    message.reply(`!!deployreddit <channelID> <redditURL>\nAdds a reddit instance to a given channel.`);
                }
                return;
        }
    }
}

const is_first_instance = (message, instance_key, channel_id, reddit_URL) => {
    if (getValueOfReddit(message, instance_key, channel_id, true) === undefined) {
        var default_instance_object = {
            "instances": [
            ]
        };
        default_instance_object.instances.push({ [channel_id]: reddit_URL });
        default_instance_object = JSON.stringify(default_instance_object);
        message.guild.settings.set(instance_key, default_instance_object);
        initializeInstance(message, reddit_URL);
        message.reply(`First Reddit instance made!`);
        return true;
    }
    return false;
}

const does_channel_exist = (message, instance_key, channel_id) => {
    var key_value_exits = message.guild.settings.get(instance_key, null);
    key_value_exits = JSON.parse(key_value_exits)
    if (key_value_exits !== null) {
        for (var z in key_value_exits.instances) {
            if (key_value_exits.instances[z][channel_id] !== undefined) {
                message.reply(`${channel_id} was already found\nTry using "--edit" or "--stop`);
                return true;
            }
        }
    }
    return false;
}

const refactor_link = (link) => {
    if (link.search("reddit.com/") == -1) {
        if (link.search("/") == 0) {
            link = "https://www.reddit.com" + link;
        } else {
            link = "https://www.reddit.com/" + link;
        }
    }
    const last_char_of_URL = link.charAt(link.length - 1);
    switch (last_char_of_URL) {
        case '/':
            link += ".json"
            break;
        default:
            link += "/.json"
            break;
    }
    return link;
}

const validated_link = async (link) => {
    var error_given;
    await request(link, async (error, response, html) => {
        var json_data;
        try {
            json_data = await JSON.parse(html)
        } catch (e) {
            message.say("Sorry, this link did not work.");
            return false;
        }
        error_given = json_data.error == '404' ? true : false;

        if (error) {
            message.say("Sorry, this link did not work.");
            return false;
        } else if (error_given == true) {
            message.say("Sorry, this link did not work.");
            return false;
        }
    });
    return true;
}

function initializeInstance(message, reddit_URL) {
    const daily_time = 'at 08:00am';
    const testing_time = 'every 20 seconds';
    var sched = later.parse.text(testing_time);
    later.date.localTime(); // time default is UTC | 4 hours ahead of FL
    //query_reddit(message, reddit_URL);
    //later.setInterval(function () { query_reddit(message, reddit_URL); }, sched);   / / interval_instance.clear() clears timer
}

function delete_reddit_instance(message, instance_key, channel_id) {
    channel_id = refactor_id(message, channel_id);

    var instances = message.guild.settings.get(instance_key, null);

    if (instances == null) {
        message.reply(`${instance_key} was not found.\nTry creating a new instance using "!!deployreddit <channelID> <redditURL>"`);
        return undefined;
    }

    instances = JSON.parse(instances)
    for (index in instances.instances) {
        if (instances.instances[index][channel_id] !== undefined) {
            instances.instances.splice(index, 1);
            const new_instances = JSON.stringify(instances);
            if (typeof new_instances === 'string') {
                message.guild.settings.set(instance_key, new_instances);
                message.reply(`${channel_id} was removed from this guild.`);
                return;
            }
            break;
        }
    }

    message.reply(`${channel_id} was not in instances.`);
    return undefined;
}

function updateRedditFromKey(message, instance_key, reddit_URL, channel_id) {
    channel_id = refactor_id(message, channel_id)

    // Altering old value
    var redditValue = message.guild.settings.get(instance_key, null);
    redditValue = JSON.parse(redditValue)
    for (index in redditValue.instances) {
        if (redditValue.instances[index][channel_id] !== undefined) {
            redditValue.instances[index][channel_id] = reddit_URL;
            redditValue = JSON.stringify(redditValue);
            if (typeof redditValue === 'string') {
                console.log("altering old val")
                message.guild.settings.set(instance_key, redditValue);
                message.reply(`${instance_key} was assigned ${reddit_URL}`);
                return redditValue;
            }
            break;
        }
    }
    return;
}

function setRedditFromKey(message, messageArguments, channelID, edit) {
    const [redditKey, tempChannelID, newSetting] = messageArguments;
    channelID = tempChannelID;

    // else if (status_of_value === null) {
    //     console.log("ID not found")
    // }

    channelID = refactor_id(message, channelID)
    //validate link

    var redditValue = message.guild.settings.get(redditKey, null);
    redditValue = JSON.parse(redditValue)
    redditValue.instances.push({ [channelID]: newSetting });
    redditValue = JSON.stringify(redditValue);
    message.guild.settings.set(redditKey, redditValue);

    message.reply(`${channelID} was assigned ${newSetting}`);
    return;
}

function getValueOfReddit(message, instance_key, channelID, setting_default) {
    if (channelID.search("id") == -1) {
        if (channelID === undefined) {
            channelID = "id" + message.channel.id;
        } else {
            channelID = "id" + channelID;
        }
    }
    var redditValue = message.guild.settings.get(instance_key, null);
    if (redditValue == null) {
        if (!setting_default) {
            message.reply(`${instance_key} was not found`);
            return undefined;
        } else {
            return undefined;
        }
    }
    redditValue = JSON.parse(redditValue)
    for (key in redditValue.instances) {
        if (redditValue.instances[key][channelID] !== undefined) {
            redditValue = redditValue.instances[key][channelID];
            break;
        }
    }

    if (typeof redditValue !== 'string' && setting_default) {
        return null;
    } else if (typeof redditValue !== 'string') {
        message.reply(`The given ID for ${instance_key} was not found`);
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

function delete_all_instances(message) {
    let instance_key = "guild.reddit.instances";
    message.guild.settings.remove(instance_key, null);
    console.log("All instances deleted.")
}

async function query_reddit(message, redditURL) {
    await request(redditURL, (error, response, html) => {
        if (!error && response.statusCode == 200) {

            const json_data = JSON.parse(html);
            for (var index = 0; index < json_data.data.dist; index++) {

                if (json_data.data.children[index].data.post_hint == "image" || links_to_image(json_data.data.children[index].data.url)) {
                    const image_to_embed = {
                        "image": {
                            "url": json_data.data.children[index].data.url
                        }
                    };
                    message.embed(image_to_embed).then(async function (reply) {
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
    console.log("Reddit post made:", new Date());
}

const links_to_image = (link) => {
    const IMG_EXTENSIONS = ['jpg', 'png', 'gif']
    const link_extension = link.substr(link.length - 3);
    if (IMG_EXTENSIONS.includes(link_extension)) {
        return true;
    }
    return false;
}

const refactor_id = (message, channel_id) => {
    if (channel_id === undefined) {
        channel_id = "id" + message.channel.id;
    } else {
        channel_id = "id" + channel_id;
    }
    return channel_id;
}

module.exports = DeployReddit;