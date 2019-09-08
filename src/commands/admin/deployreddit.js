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
        args.redditURL = "https://www.reddit.com/" + args.redditURL;
        const last_char_of_URL = args.redditURL.charAt(args.redditURL.length - 1);
        switch (last_char_of_URL) {
            case '/':
                args.redditURL += ".json"
                break;
            default:
                args.redditURL += "/.json"
                break;
        }
        console.log(args.redditURL)


        // catching broken link errors
        var error_given;
        await request(args.redditURL, async (error, response, html) => {
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

            // time default is UTC | 4 hours ahead of FL
            const daily_time = 'at 08:00am';
            const testing_time = 'every 10 seconds';
            var sched = later.parse.text(testing_time);
            //console.log(message.channel.id) gets the ID of current text channel
            later.date.localTime();
            var interval_instance = later.setInterval(function () { query_reddit(message, args.redditURL, interval_instance) }, sched);   // interval_instance.clear() clears timer
        });
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
