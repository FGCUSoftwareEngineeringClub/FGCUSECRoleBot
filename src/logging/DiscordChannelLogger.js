//@ts-check
const BaseTransport = require('winston-transport');
const Discord = require('discord.js');
const Commando = require('discord.js-commando');
const Settings = require('../settings');
const { settingsKeys } = require('../settings/SettingsProvider');
const logger = require('./Logger');

/**
 * This is a custom transporter from the winston library to allow logging messages to a discord
 * server channel.
 * @extends BaseTransport
 */
class DiscordChannelTransport extends BaseTransport {
  /**
   * 
   * @param {{client: Commando.CommandoClient} & BaseTransport.TransportStreamOptions} options 
   */
  constructor(options) {
    super(options);
    /**
     * @type {Commando.CommandoClient}
     * @private
     */
    this.discordClient = options.client;
    logger.info('Discord Channel Logger Active!');
  }

  /**
   * 
   * @param {object} info 
   * @param {Commando.GuildExtension} info.server
   * @param {string} info.message
   * @param {Function} onFinished 
   */
  async log(info, onFinished) {
    if (!info.server) return; // Don't try to log to a server if a server isn't passed with this message.

    const server = info.server;
    const serverLoggingChannelId = server.settings.get(settingsKeys.DEFAULT_LOGGING_CHANNEL);

    if (serverLoggingChannelId) {
      const serverLoggingChannel = server.channels.get(serverLoggingChannelId);
      
      // If this message spans multiple lines, place it in a codeblock to try preserving formatting.
      // await this.loggingChannel.send(messageText, {code: messageText.includes('\n')});
      await serverLoggingChannel.send(info.message, {code: info.message.includes('\n')})
    }

    /*
     If a callback was passed in, then call it. Useful if you want to do something after a message
     has finished logging.
    */
    if (onFinished) onFinished(); 
  }
}

module.exports = DiscordChannelTransport;