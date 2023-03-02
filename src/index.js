require('dotenv').config();
const fs = require('node:fs');
const path = require('node:path');
const {Client, Events, Collection, GatewayIntentBits, REST, Routes} = require('discord.js');

const TOKEN = process.env.TOKEN;
const CLIENT_ID = process.env.CLIENT_ID;
const GUILD_ID = process.env.GUILD_ID;

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
    ]
});

// noinspection JSCheckFunctionSignatures,JSClosureCompilerSyntax
const rest = new REST({version: '10'}).setToken(TOKEN);
const commands = [];

client.commands = new Collection();

const commandsPath = path.join(__dirname, 'commands');
const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));

for (const file of commandFiles) {
    const filePath = path.join(commandsPath, file);
    const command = require(filePath);
    // Set a new item in the Collection with the key as the command name and the value as the exported module
    if ('data' in command && 'execute' in command) {
        client.commands.set(command.data.name, command);
        commands.push(command.data.toJSON());
        console.log(`[INFO] Loaded command ${command.data.name} from ${filePath}`);
    } else {
        console.log(`[WARNING] The command at ${filePath} is missing a required "data" or "execute" property.`);
    }
}

client.on(Events.InteractionCreate, async interaction => {
    if (!interaction.isChatInputCommand()) return;

    const command = interaction.client.commands.get(interaction.commandName);

    if (!command) {
        console.error('No command found');
        return;
    }

    try {
        await command.execute(interaction);
    } catch (error) {
        console.log(error);
        if (interaction.replied || interaction.deferred) {
            await interaction.followUp({content: 'There was an error while executing this command!', ephemeral: true});
        } else {
            await interaction.reply({content: 'There was an error while executing this command!', ephemeral: true});
        }
    }
});


async function main() {
    try {
        await client.login(TOKEN);
        console.log(`[INFO] Logged in as ${client.user.tag}!`);
        console.log(`[INFO] Registering ${commands.length} commands...`);
        await rest.put(
            Routes.applicationGuildCommands(CLIENT_ID, GUILD_ID),
            {body: commands},
        );
        console.log(`[INFO] Successfully registered ${commands.length} commands.`);
    } catch (error) {
        console.log(error);
    }
}

main().then(() => {
    console.log('Bot is ready!');
});