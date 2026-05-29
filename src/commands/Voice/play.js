import { SlashCommandBuilder } from 'discord.js';
import { createEmbed, errorEmbed, successEmbed } from '../../utils/embeds.js';

export default {
    data: new SlashCommandBuilder()
        .setName('play')
        .setDescription('Phát nhạc từ YouTube hoặc tên bài hát')
        .setDMPermission(false)
        .addStringOption(option =>
            option.setName('query')
                .setDescription('Tên bài hát hoặc link YouTube/Livestream')
                .setRequired(true)
        ),

    category: "Music",

    async execute(interaction, config, client) {
        await interaction.deferReply();
        const { member, options, channel } = interaction;
        const query = options.getString('query');
        const voiceChannel = member.voice.channel;

        if (!voiceChannel) {
            return await interaction.editReply({
                embeds: [errorEmbed('Lỗi', 'Bạn phải vào một phòng Voice trước!')]
            });
        }

        try {
            await client.distube.play(voiceChannel, query, {
                textChannel: channel,
                member: member
            });

            await interaction.editReply({
                embeds: [successEmbed('Thành công', `🔍 Đang tìm kiếm và phát: **${query}**`)]
            });
        } catch (error) {
            await interaction.editReply({
                embeds: [errorEmbed('Thất bại', 'Đã có lỗi xảy ra khi phát nhạc!')]
            });
        }
    },
};
