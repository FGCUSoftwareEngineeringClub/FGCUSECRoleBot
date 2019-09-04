const logger = require('./Logger');
const Discord = require('discord.js');
const DiscordChannelLogger = require('./DiscordChannelLogger');

/**
 * A function to add a logging transport to send messages to a channel in a Discord server.
 * Since the client takes time to login, we don't call this method until the client is ready, but
 * we can't add it in immediately since there will be no channel to log to if the client
 * isn't ready.
 *
 * @param {Discord.Client} discordClient
 */
function addDiscordChannelLogger(discordClient) {
  logger.add(new DiscordChannelLogger({
    level: 'info',
    client: discordClient,
  }));
}

module.exports = addDiscordChannelLogger;
