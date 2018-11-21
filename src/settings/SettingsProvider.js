const Commando = require('discord.js-commando');
const sqlite = require('sqlite');
const path = require('path');

/**
 * Prepare the database for storing settings and attach it to the Discord client so we can access
 * it.
 * @param {Commando.CommandoClient} client
 */
async function setupSettingsProvider(client) {
  const databasePath = path.join(__dirname, 'serversettings.db');

  /** @type {sqlite.Database} */
  const db = await sqlite.open(databasePath);
  const settingsProvider = new Commando.SQLiteProvider(db);
  client.setProvider(settingsProvider);
}

const settingKeys = {
  DEFAULT_LOGGING_CHANNEL: 'guild.loggingChannel',
};

/** @type {string[]} */
const settingNames = Object.getOwnPropertyNames(settingKeys).map((key) => settingKeys[key]);


module.exports = {
  setupSettingsProvider,
  settingsKeys: settingKeys,
  settingNames: settingNames,
};
