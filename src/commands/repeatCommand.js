const {SlashCommandBuilder, EmbedBuilder} = require('discord.js');
const {XMLParser} = require('fast-xml-parser');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('to-embed')
        .setDescription('Converts a message to an embed.')
        .addAttachmentOption(
            option => option.setName('message').setDescription('The message to convert.').setRequired(true)
        ),
    async execute(interaction) {
        const attachment = interaction.options.getAttachment('message');

        let messageContent = await (await fetch(attachment.attachment)).text();

        messageContent = parseXml(messageContent)
        const embed = await makeEmbed(messageContent);
        await interaction.channel.send({
            embeds: [embed]
        });
        await interaction.reply({
            content: "Done!"
        })
    }
}


async function makeEmbed(content) {
    content = content.embed;
    const builder = new EmbedBuilder()
    if (content.color)
        builder.setColor(content.color)
    if (content.title)
        builder.setTitle(content.title)
    if (content.url)
        builder.setURL(content.url)
    if (content.author)
        builder.setAuthor({
            name: content.author.name ?? "",
            iconURL: content.author.icon ?? "",
            url: content.author.url ?? ""
        })
    if (content.description)
        builder.setDescription(content.description)
    if (content.thumbnail)
        builder.setThumbnail(content.thumbnail)
    if (content.image)
        builder.setImage(content.image)
    if (content.timestamp) {
        if (content.timestamp.toLowerCase() === "now")
            builder.setTimestamp(Date.now())
        else
            builder.setTimestamp(Date.parse(content.timestamp))
    }
    if (content.footer)
        builder.setFooter({
            text: content.footer.text ?? "",
            iconURL: content.footer.icon ?? "",
            inline: content.footer.inline ?? false
        });
    if (content.fields) {
        for (const field of content.fields.field) {
            builder.addFields({
                name: field.name ?? "",
                value: field.value ?? "",
                inline: field.inline ?? false
            })
        }
    }
    return builder;
}

function parseXml(xml) {
    const parser = new XMLParser({
        allowBooleanAttributes: true,
    });
    return parser.parse(xml);
}
