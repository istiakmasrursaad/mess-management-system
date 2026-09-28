import { networkInterfaces } from 'os';
import { spawn } from 'child_process';

const nets = networkInterfaces();
let localIp = '0.0.0.0'; // Fallback to 0.0.0.0 if not found

for (const name of Object.keys(nets)) {
    // Ignore WSL, Virtual, and loopback adapters
    if (
        name.toLowerCase().includes('wsl') || 
        name.toLowerCase().includes('virtual') || 
        name.toLowerCase().includes('loopback')
    ) {
        continue;
    }
    
    for (const net of nets[name]) {
        // Find IPv4 and non-internal address
        if (net.family === 'IPv4' && !net.internal) {
            localIp = net.address;
            break;
        }
    }
    
    // Stop if we found a valid IP
    if (localIp !== '0.0.0.0') break;
}

console.log(`\n==============================================`);
console.log(`🚀 Starting Next.js server on Network IP: ${localIp}`);
console.log(`📱 Phone URL: http://${localIp}:3000`);
console.log(`==============================================\n`);

const child = spawn('npx', ['next', 'dev', '-H', localIp], { stdio: 'inherit', shell: true });

child.on('close', (code) => {
  process.exit(code);
});
