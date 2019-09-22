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
        const DAILY_POST_TIME = 'at 08:00am';
        const TESTING_POST_TIME = 'every 20 seconds';
        var sched = later.parse.text(TESTING_POST_TIME);

        later.date.localTime(); // time default is UTC | 4 hours ahead of FL

        var guild = discordClient.guilds.keyArray()[0];
        var redditValue = await discordClient.guilds.get(guild).settings.get("guild.reddit.instances")
        redditValue = await JSON.parse(redditValue)
        for (var index = 0; index < redditValue.instances.length; index++) {
            for (x in redditValue.instances[index]) {
                var channel_id = x;
                var redditURL = redditValue.instances[index][x];
                await query_reddit(redditURL, discordClient, x);
                //await later.setInterval(function () { query_reddit(redditURL, discordClient, channel_id) }, sched);
            }
        }
    }
}

async function query_reddit(redditURL, discordClient, channel_id) {
    await request(redditURL, (error, response, html) => {
        if (!error && response.statusCode == 200) {

            const json_data = JSON.parse(html);
            for (var index = 0; index < json_data.data.dist; index++) {

                if (json_data.data.children[index].data.post_hint == "image" || links_to_image(json_data.data.children[index].data.url)) {
                    if (discordClient !== null) {
                        const message_to_embed = new Discord.RichEmbed().setImage(json_data.data.children[index].data.url)
                        discordClient.channels.get("619024772898095115").send(message_to_embed).then(async function (reply) {
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

module.exports = { initializeInstance: initializeInstance };