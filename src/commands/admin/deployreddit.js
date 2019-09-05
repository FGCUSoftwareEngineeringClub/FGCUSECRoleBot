const Discord = require('discord.js');
const Commando = require('discord.js-commando');
const Logger = require('../../logging/Logger');
const cheerio = require('cheerio');
const request = require('request');

class DeployNews extends Commando.Command {
    /** @param {Commando.CommandoClient} client */
    constructor(client) {
        super(client, {
            name: 'deployreddit',
            description: 'Deploys the top news story in any subreddit every 24hrs',
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

    async run(message, { redditURL }) {
        request(redditURL, (error, response, html) => {
            if (!error && response.statusCode == 200) {
                const $ = cheerio.load(html);
                var picture_not_found = true;
                var img_index = 0
                while (picture_not_found) {
                    //console.log($(html).find('img').eq(img_index).attr('src'))
                    if ($(html).find('img').eq(img_index).attr('src') == undefined) {
                        return
                    }
                    if ($(html).find('img').eq(img_index).attr('src').substring(8, 9) == 'i' || $(html).find('img').eq(img_index).attr('src').substring(8, 9) == 'p') {
                        picture_not_found = false;
                        return message.reply($(html).find('img').eq(img_index).attr('src'));
                    } else {
                        img_index++;
                    }
                }
            }
        });
    }
}

module.exports = DeployNews;
