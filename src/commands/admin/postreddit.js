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
            description: 'Deploys the top img in any subreddit every 24hrs',
            guildOnly: true,
            group: 'admin',
            memberName: 'deployreddit',
        });
    }
}

function initializeInstance(message, messageArguments, discordClient) {
    if (discordClient !== undefined) {
        var redditValue = discordClient.guilds.get("619024772415881240").settings.get("guild.reddit.instances")
        redditValue = JSON.parse(redditValue)
        for (var counter = 0; counter < redditValue.instances.length; counter++) {
            for (x in redditValue.instances[counter]) {
                /**
                 * 
                 * Loop through all of the instances and instatiate them using the startup
                 * 
                 * work normally otherwise
                 * 
                 */
                console.log(x)
                redditValue.instances[counter][x] // URL
                query_reddit(message, redditValue.instances[counter][x], discordClient, x);
            }
        }
    }
}

async function query_reddit(message, redditURL, discordClient, channelID) {
    //console.log(redditURL)
    await request(redditURL, (error, response, html) => {
        if (!error && response.statusCode == 200) {
            const json_data = JSON.parse(html);
            for (var counter = 0; counter < json_data.data.dist; counter++) {
                //console.log(json_data.data.children[counter].data.post_hint)
                if (json_data.data.children[counter].data.post_hint == "image" || linksToImage(json_data.data.children[counter].data.url)) {
                    if (discordClient !== null) {
                        const message_to_embed = new Discord.RichEmbed().setImage('https://preview.redd.it/d3b8tswrbxn31.jpg?width=640&crop=smart&auto=webp&s=8133c0e5fae51db9bd9eaa583c1989a4d79e0ee7')
                        discordClient.channels.get("619024772898095115").send(message_to_embed).then(async function (reply) {
                            //console.log(reply.id)
                            reply.channel.fetchMessage(reply.id).then(async function (message_retrieved) {
                                await message_retrieved.react('👍');
                                await message_retrieved.react('👎');
                            });
                        });
                        return;
                    } else {
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
                        return;
                    }
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

module.exports = { initializeInstance: initializeInstance };