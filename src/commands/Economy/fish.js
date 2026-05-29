import { SlashCommandBuilder } from 'discord.js';
import { createEmbed, errorEmbed, successEmbed, infoEmbed, warningEmbed } from '../../utils/embeds.js';
import { getEconomyData, setEconomyData } from '../../utils/economy.js';
import { withErrorHandling, createError, ErrorTypes } from '../../utils/errorHandler.js';
import { MessageTemplates } from '../../utils/messageTemplates.js';
import { InteractionHelper } from '../../utils/interactionHelper.js';

const FISH_COOLDOWN = 45 * 60 * 1000; 
const BASE_MIN_REWARD = 300;
const BASE_MAX_REWARD = 900;
const FISHING_ROD_MULTIPLIER = 1.5;

const FISH_TYPES = [
    { name: 'Cá vược', emoji: '🐟', rarity: 'common' },
    { name: 'Cá hồi', emoji: '🐟', rarity: 'common' },
    { name: 'Cá hồi sông', emoji: '🐟', rarity: 'common' },
    { name: 'Cá ngừ', emoji: '🐟', rarity: 'uncommon' },
    { name: 'Cá kiếm', emoji: '🐟', rarity: 'uncommon' },
    { name: 'Bạch tuộc', emoji: '🐙', rarity: 'rare' },
    { name: 'Tôm hùm', emoji: '🦞', rarity: 'rare' },
    { name: 'Cá mập', emoji: '🦈', rarity: 'epic' },
    { name: 'Cá voi', emoji: '🐋', rarity: 'legendary' },
];

const CATCH_MESSAGES = [
    "Bạn thả dây câu xuống làn nước trong vắt...",
    "Bạn kiên nhẫn chờ đợi khi chiếc phao bập bềnh...",
    "Sau vài phút chờ đợi, bạn cảm thấy một cú giật mạnh...",
    "Mặt nước gợn sóng khi có thứ gì đó đớp mồi của bạn...",
    "Bạn kéo cần và thu dây với kỹ năng của một chuyên gia...",
];

const RARITY_TRANSLATIONS = {
    common: 'Thường',
    uncommon: 'Hiếm nhẹ',
    rare: 'Hiếm',
    epic: 'Sử thi',
    legendary: 'Huyền thoại'
};

export default {
    data: new SlashCommandBuilder()
        .setName('fish')
        .setDescription('Đi câu cá để bắt cá và kiếm tiền'),

    execute: withErrorHandling(async (interaction, config, client) => {
        const deferred = await InteractionHelper.safeDefer(interaction);
        if (!deferred) return;
            
        const userId = interaction.user.id;
        const guildId = interaction.guildId;
        const now = Date.now();

        const userData = await getEconomyData(client, guildId, userId);
        const lastFish = userData.lastFish || 0;
        const hasFishingRod = userData.inventory["fishing_rod"] || 0;

        if (now < lastFish + FISH_COOLDOWN) {
            const remaining = lastFish + FISH_COOLDOWN - now;
            const hours = Math.floor(remaining / (1000 * 60 * 60));
            const minutes = Math.floor(
                (remaining % (1000 * 60 * 60)) / (1000 * 60),
            );

            throw createError(
                "Fishing cooldown active",
                ErrorTypes.RATE_LIMIT,
                `Bạn đang quá mệt để tiếp tục câu cá. Hãy nghỉ ngơi trong **${hours} giờ ${minutes} phút** nữa nhé.`,
                { remaining, cooldownType: 'fish' }
            );
        }

        
        const rand = Math.random();
        let fishCaught;
        
        if (rand < 0.5) {
            fishCaught = FISH_TYPES.filter(f => f.rarity === 'common')[Math.floor(Math.random() * 3)];
        } else if (rand < 0.75) {
            fishCaught = FISH_TYPES.filter(f => f.rarity === 'uncommon')[Math.floor(Math.random() * 2)];
        } else if (rand < 0.9) {
            fishCaught = FISH_TYPES.filter(f => f.rarity === 'rare')[Math.floor(Math.random() * 2)];
        } else if (rand < 0.98) {
            fishCaught = FISH_TYPES.find(f => f.rarity === 'epic');
        } else {
            fishCaught = FISH_TYPES.find(f => f.rarity === 'legendary');
        }

        const baseEarned = Math.floor(
            Math.random() * (BASE_MAX_REWARD - BASE_MIN_REWARD + 1)
        ) + BASE_MIN_REWARD;

        let finalEarned = baseEarned;
        let multiplierMessage = "";

        if (hasFishingRod > 0) {
            finalEarned = Math.floor(baseEarned * FISHING_ROD_MULTIPLIER);
            multiplierMessage = `\n🎣 **Thưởng từ Cần Câu: +50%**`;
        }

        const catchMessage = CATCH_MESSAGES[Math.floor(Math.random() * CATCH_MESSAGES.length)];

        userData.wallet += finalEarned;
        userData.lastFish = now;

        await setEconomyData(client, guildId, userId, userData);

        const rarityColors = {
            common: '#95A5A6',
            uncommon: '#2ECC71',
            rare: '#3498DB',
            epic: '#9B59B6',
            legendary: '#F1C40F'
        };

        const embed = createEmbed({
            title: '🎣 Câu Cá Thành Công!',
            description: `${catchMessage}\n\nBạn đã câu được một chú **${fishCaught.emoji} ${fishCaught.name}**! Bạn bán nó và thu về **$${finalEarned.toLocaleString()}**!${multiplierMessage}`,
            color: rarityColors[fishCaught.rarity]
        })
            .addFields(
                {
                    name: "💵 Số dư ví hiện tại",
                    value: `$${userData.wallet.toLocaleString()}`,
                    inline: true,
                },
                {
                    name: "🐟 Độ hiếm",
                    value: RARITY_TRANSLATIONS[fishCaught.rarity],
                    inline: true,
                }
            )
            .setFooter({ text: `Bạn có thể tiếp tục đi câu sau 45 phút nữa.` });

        await InteractionHelper.safeEditReply(interaction, { embeds: [embed] });
    }, { command: 'fish' })
};
