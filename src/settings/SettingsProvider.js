const Commando = require('discord.js-commando');
const sqlite = require('sqlite');
const path = require('path');

/**
 * 
 * @param {Commando.CommandoClient} client 
 */
async function setupSettingsProvider(client) {
  const databasePath = path.join(__dirname, "serversettings.db");

  /** @type {sqlite.Database} */
  const db = await sqlite.open(databasePath);
  const settingsProvider = new Commando.SQLiteProvider(db);
  client.setProvider(settingsProvider);
}

module.exports = setupSettingsProvider;