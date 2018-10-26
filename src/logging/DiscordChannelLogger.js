//@ts-check
const BaseTransport = require('winston-transport');
const Discord = require('discord.js');
const Settings = require('../settings');
const logger = require('./Logger');

/**
 * This is a custom transporter from the winston library to allow logging messages to a discord
 * server channel.
 * @extends BaseTransport
 */
class DiscordChannelTransport extends BaseTransport {
  /**
   * 
   * @param {{client: Discord.Client} & BaseTransport.TransportStreamOptions} options 
   */
  constructor(options) {
    super(options);
    /**
     * @type {Discord.Client}
     * @private
     */
    this.discordClient = options.client;

    /** Sets a boolean for whether or not any logging text channel is set in settings. */
    this.loggingChannelExists = Settings.LOGGING_TEXT_CHANNEL ? true : false;
    if (this.loggingChannelExists) {
      const primaryServer = this.discordClient.guilds.get(Settings.PRIMARY_SERVER_ID);

      this.loggingChannel = primaryServer.channels.get(Settings.LOGGING_TEXT_CHANNEL);
    }

    logger.info('Discord Channel Logger Active!');
  }

  async log(message, onFinished) {
    if (this.loggingChannelExists) {
      /**
       * If the message argument is an object with a message property, message will be set to that,
       * otherwise it will be set to the message itself.
       */
      const messageText = message.message || message;

      // If this message spans multiple lines, place it in a codeblock to try preserving formatting.
      // await this.loggingChannel.send(messageText, {code: messageText.includes('\n')});
      this.loggingChannel.send(messageText, {code: messageText.includes('\n')});
    }
    
    /*
     If a callback was passed in, then call it. Useful if you want to do something after a message
     has finished logging.
    */
    if (onFinished) onFinished(); 
  }
}

module.exports = DiscordChannelTransport;