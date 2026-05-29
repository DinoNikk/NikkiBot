import { SlashCommandBuilder } from 'discord.js';
import { successEmbed, errorEmbed } from '../../utils/embeds.js';

export default {
    data: new SlashCommandBuilder()
        .setName('stop')
        .setDescription('Dừng nhạc và bắt bot rời phòng voice'),

    category: "Music",

    async execute(interaction, config, client) {
        const queue = client.distube.getQueue(interaction.guildId);
        const botVoice = interaction.guild.members.me.voice.channel;

        if (!queue) {
            if (botVoice) {
                // Nếu bot đang treo một mình không có nhạc, ép nó out phòng
                await interaction.guild.members.me.voice.disconnect();
                return await interaction.reply({ embeds: [successEmbed('Xong', 'Đã bắt bot rời phòng voice!')] });
            }
            return await interaction.reply({ embeds: [errorEmbed('Lỗi', 'Hiện tại bot không ở trong phòng voice!')] });
        }

        await queue.stop();
        await interaction.guild.members.me.voice.disconnect();

        await interaction.reply({
            embeds: [successEmbed('Đã dừng', 'Đã xóa hàng chờ và đưa bot rời phòng voice!')]
        });
    },
};
