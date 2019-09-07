const Discord = require('discord.js');
const Commando = require('discord.js-commando');
const Logger = require('../../logging/Logger');
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

            args: [
                {
                    key: 'redditURL',
                    prompt: 'What subreddit URL would you like to follow?',
                    type: 'string',

                },
            ],
        });
    }

    run(message, { redditURL }) {
        // time default is UTC | 4 hours ahead of FL
        var sched = later.parse.text('at 09:28pm every day');
        later.date.localTime();
        var t = later.setInterval(function () { query_reddit(message, redditURL) }, sched);   // t.clear() clears timer
    }
}

async function query_reddit(message, redditURL) {
    request(redditURL, (error, response, html) => {
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
