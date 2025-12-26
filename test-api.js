// Test script to debug Mega Sena API sync
import { CaixaAPI } from './src/lib/caixa-api.js';

console.log('Testing Mega Sena API...');

async function test() {
    try {
        console.log('\n1. Checking API status...');
        const status = await CaixaAPI.checkAPIStatus();
        console.log('API Status:', status);

        console.log('\n2. Getting latest contest...');
        const latest = await CaixaAPI.getLatestContest();
        console.log('Latest contest:', latest);

        if (latest) {
            console.log('\n3. Converting to database format...');
            const dbFormat = CaixaAPI.convertToDatabaseFormat(latest);
            console.log('DB Format:', dbFormat);
        }
    } catch (error) {
        console.error('Error:', error);
    }
}

test();
