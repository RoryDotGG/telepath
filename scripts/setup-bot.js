#!/usr/bin/env node

/**
 * Telepath Bot Setup Script
 * This script helps configure your Telegram bot with proper settings
 */

const { config } = require('../dist/config');
const { Telegraf } = require('telegraf');

async function setupBot() {
  console.log('🚀 Setting up Telepath Bot...\n');

  if (!config.botToken) {
    console.error('❌ Error: BOT_TOKEN environment variable is required');
    process.exit(1);
  }

  const bot = new Telegraf(config.botToken);

  try {
    // Get bot info
    const botInfo = await bot.telegram.getMe();
    console.log('🤖 Bot Information:');
    console.log(`   Username: @${botInfo.username}`);
    console.log(`   ID: ${botInfo.id}`);
    console.log(`   Name: ${botInfo.first_name}`);
    console.log('');

    // Set commands
    await bot.telegram.setMyCommands([
      { command: 'start', description: 'Start or restart the bot' },
      { command: 'help', description: 'Show help and usage instructions' },
      { command: 'about', description: 'About Telepath bot' },
      { command: 'links', description: 'View and manage your short links' },
      { command: 'settings', description: 'Configure your preferences' }
    ]);
    console.log('✅ Bot commands configured');

    // Set bot name and descriptions
    await bot.telegram.setMyName('Telepath - AI Short Links');
    await bot.telegram.setMyDescription('🚀 Telepath creates intelligent short links using AI! Simply send any URL and get a meaningful, memorable short link powered by Google Gemini and Dub.sh.\n\n✨ Features:\n• AI-powered slug generation\n• Custom domain support\n• Link analytics & management\n• Personalized preferences\n\nJust send me a URL to get started!');
    await bot.telegram.setMyShortDescription('AI-powered short link generator with intelligent slug creation');
    console.log('✅ Bot name and descriptions set');

    // Set menu button
    await bot.telegram.setChatMenuButton({
      menuButton: {
        type: 'commands'
      }
    });
    console.log('✅ Menu button configured');

    console.log('\n🎉 Bot setup completed successfully!');
    console.log('\n📋 Next steps:');
    console.log('   1. Make sure your Dub.sh API key is configured');
    console.log('   2. Set up your Google Gemini API key');
    console.log('   3. Start the bot with: pnpm start');
    console.log('   4. Test it by sending a URL to your bot');
    console.log('\n💡 Your bot is now ready to create intelligent short links!');

  } catch (error) {
    console.error('❌ Error setting up bot:', error.message);
    process.exit(1);
  }
}

setupBot();