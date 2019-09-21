const Discord = require('discord.js');
const Commando = require('discord.js-commando');
const Logger = require('../../logging/Logger');
const request = require('request');
var later = require('later');

class PostReddit extends Commando.Command {
    /** @param {Commando.CommandoClient} client */
    constructor(client) {
        super(client, {
            description: 'Deploys the top img in any subreddit on startup',
            guildOnly: true,
            group: 'admin',
        });
    }
}

async function initializeInstance(discordClient) {
    if (discordClient !== undefined) {
        const daily_time = 'at 08:00am';
        const testing_time = 'every 20 seconds';
        var sched = later.parse.text(testing_time);
        later.date.localTime(); // time default is UTC | 4 hours ahead of FL
        var guild = discordClient.guilds.keyArray()[0];
        var redditValue = await discordClient.guilds.get(guild).settings.get("guild.reddit.instances")
        redditValue = await JSON.parse(redditValue)
        for (var counter = 0; counter < redditValue.instances.length; counter++) {
            for (x in redditValue.instances[counter]) {
                channelID = x;
                redditURL = redditValue.instances[counter][x];
                await query_reddit(redditValue.instances[counter][x], discordClient, x);
                //await later.setInterval(function () { query_reddit(redditURL, discordClient, channelID) }, sched);
            }
        }
    }
}

async function query_reddit(redditURL, discordClient, channelID) {
    await request(redditURL, (error, response, html) => {
        if (!error && response.statusCode == 200) {
            const json_data = JSON.parse(html);
            for (var counter = 0; counter < json_data.data.dist; counter++) {
                if (json_data.data.children[counter].data.post_hint == "image" || linksToImage(json_data.data.children[counter].data.url)) {
                    if (discordClient !== null) {
                        console.log(redditURL)
                        const message_to_embed = new Discord.RichEmbed().setImage(json_data.data.children[counter].data.url)
                        discordClient.channels.get("619024772898095115").send(message_to_embed).then(async function (reply) {
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