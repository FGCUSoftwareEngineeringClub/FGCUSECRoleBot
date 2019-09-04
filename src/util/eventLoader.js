// @ts-check
const Commando = require('discord.js-commando');
const Settings = require('../GlobalSettings');
const Logger = require('../logging/Logger');
const path = require('path');
const fs = require('fs').promises;

const eventsDirectory = path.join(Settings.ROOT_DIRECTORY, 'events');

/**
 * Loads events by searching the events directory and adding files with the proper metadata or
 * recursively searching inner folders for more events.
 * @param {Commando.CommandoClient} discordClient
 */
async function loadEvents(discordClient) {
  try {
    /**
     * Load all files in the given directory then add the command to the client for it to listen to.
     */
    const files = await fs.readdir(eventsDirectory);
    for (const file of files) {
      if (!file.endsWith('.js')) return; // Skip the file if it isn't a javascript file.

      /** @type {{event: string, run: Function}} */
      const event = require(path.join(Settings.ROOT_DIRECTORY, 'events', file));
      const eventName = event.event;

      // Pass the event and function to run when the event happens into the client.
      discordClient.on(eventName, event.run);

      // Remove any cached copies of the file.
      delete require.cache[require.resolve(`../events/${file}`)];
    }
  } catch (error) {
    Logger.error({
      server: null,
      message: error,
    });
    throw error;
  }

  Logger.info({
    server: null,
    message: `All client events loaded from events directory.`,
  });
}

module.exports = loadEvents;


