#!/usr/bin/env npx ts-node

/**
 * Local test script for the stock checker
 * Run with: npx ts-node test-local.ts
 * 
 * Requires .env file with:
 * - TELEGRAM_BOT_TOKEN
 * - TELEGRAM_CHAT_ID
 * - DEFAULT_PINCODE
 * - FIRSTCRY_URL (at minimum)
 */

import * as dotenv from 'dotenv';
dotenv.config({ path: '.env' });

import { config } from './src/config';
import { checkAllPlatforms } from './src/platforms';
import { sendTelegramMessage, formatStockAlert, formatPeriodicSummary } from './src/notifiers/telegram';
import { loadStatus, saveStatus, updateStatus, getPreviousResults } from './src/storage/status';

async function test() {
  console.log('🧪 Testing Hot Wheels Stock Checker locally\n');
  
  // Override config from env if present
  if (process.env.TELEGRAM_BOT_TOKEN) {
    config.telegram.botToken = process.env.TELEGRAM_BOT_TOKEN;
    config.telegram.enabled = true;
  }
  if (process.env.TELEGRAM_CHAT_ID) {
    config.telegram.chatId = process.env.TELEGRAM_CHAT_ID;
  }
  if (process.env.DEFAULT_PINCODE) {
    config.defaultPincode = process.env.DEFAULT_PINCODE;
    config.products[0].pincode = process.env.DEFAULT_PINCODE;
  }
  if (process.env.FIRSTCRY_URL) {
    config.products[0].urls.firstcry = process.env.FIRSTCRY_URL;
  }
  if (process.env.BLINKIT_URL) {
    config.products[0].urls.blinkit = process.env.BLINKIT_URL;
  }
  if (process.env.ZEPTO_URL) {
    config.products[0].urls.zepto = process.env.ZEPTO_URL;
  }
  if (process.env.AMAZON_URL) {
    config.products[0].urls.amazon = process.env.AMAZON_URL;
  }

  console.log('📋 Configuration:');
  console.log(`   Product: ${config.products[0].name}`);
  console.log(`   Pincode: ${config.products[0].pincode}`);
  console.log(`   Telegram: ${config.telegram.enabled ? '✅ Enabled' : '❌ Disabled'}`);
  console.log(`   Platforms:`);
  for (const [platform, url] of Object.entries(config.products[0].urls)) {
    console.log(`     ${platform}: ${url ? '✅ Set' : '❌ Not set'}`);
  }
  console.log('');

  const statusStore = loadStatus();
  
  for (const product of config.products) {
    const configuredPlatforms = Object.entries(product.urls)
      .filter(([_, url]) => url)
      .map(([platform]) => platform);
    
    if (configuredPlatforms.length === 0) {
      console.log('⚠️ No platform URLs configured, skipping');
      continue;
    }

    console.log(`\n🔍 Checking: ${product.name}`);
    console.log(`   Platforms: ${configuredPlatforms.join(', ')}`);

    const results = await checkAllPlatforms(product);
    
    const previousResults = getPreviousResults(statusStore, product.id);
    
    // Show results
    for (const result of results) {
      const emoji = result.available ? '✅' : result.stockLevel === 'out_of_stock' ? '❌' : '⚠️';
      console.log(`   ${emoji} ${result.platform.toUpperCase()}: ${(result.stockLevel || 'unknown').toUpperCase()}`);
      if (result.price) console.log(`      Price: ₹${result.price}`);
      if (result.error) console.log(`      Error: ${result.error}`);
    }

    // Check for restock
    const inStock = results.filter(r => r.available);
    if (inStock.length > 0) {
      console.log(`\n🎉 IN STOCK on ${inStock.length} platform(s)!`);
    }

    // Test Telegram
    if (config.telegram.enabled) {
      console.log('\n📱 Sending test Telegram message...');
      const summary = formatPeriodicSummary(results, product.name);
      const sent = await sendTelegramMessage({
        chat_id: config.telegram.chatId,
        text: summary,
        parse_mode: 'HTML',
      });
      console.log(sent ? '✅ Telegram sent!' : '❌ Telegram failed');
    }

    // Update status
    const updatedStore = updateStatus(statusStore, product.id, product.name, results);
    Object.assign(statusStore, updatedStore);
  }

  saveStatus(statusStore);
  console.log('\n💾 Status saved to backend/storage/status.json');
  console.log('\n✅ Test complete!');
}

test().catch(console.error);