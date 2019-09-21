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

async function initializeInstance(message, messageArguments, discordClient) {
    if (discordClient !== undefined) {
        const daily_time = 'at 08:00am';
        const testing_time = 'every 20 seconds';
        var sched = later.parse.text(daily_time);
        // time default is UTC | 4 hours ahead of FL
        later.date.localTime();
        var redditValue = await discordClient.guilds.get("619024772415881240").settings.get("guild.reddit.instances")
        redditValue = await JSON.parse(redditValue)
        for (var counter = 0; counter < redditValue.instances.length; counter++) {
            for (x in redditValue.instances[counter]) {
                channelID = x;
                redditURL = redditValue.instances[counter][x];
                await query_reddit(redditValue.instances[counter][x], discordClient, x);
                await later.setInterval(function () { query_reddit(redditURL, discordClient, channelID) }, sched);
                console.log(1)
            }
        }
    }
}

async function query_reddit(redditURL, discordClient, channelID) {
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