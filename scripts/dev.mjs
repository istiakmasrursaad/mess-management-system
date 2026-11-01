import { networkInterfaces } from 'os';
import { spawn } from 'child_process';
import net from 'net';

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

const isHttps = process.argv.includes('--https');
const protocol = isHttps ? 'https' : 'http';

function checkPort(port, host) {
    return new Promise((resolve) => {
        const server = net.createServer();
        server.once('error', () => resolve(false));
        server.once('listening', () => {
            server.close(() => resolve(true));
        });
        server.listen(port, host);
    });
}

async function findAvailablePort(startPort, host) {
    const portArgIdx = process.argv.indexOf('-p') !== -1 ? process.argv.indexOf('-p') : process.argv.indexOf('--port');
    if (portArgIdx !== -1 && process.argv[portArgIdx + 1]) {
        return parseInt(process.argv[portArgIdx + 1], 10);
    }
    if (process.env.PORT) {
        return parseInt(process.env.PORT, 10);
    }

    let port = startPort;
    while (port < startPort + 200) {
        const available = await checkPort(port, host);
        if (available) {
            return port;
        }
        port++;
    }
    return startPort;
}

const activePort = await findAvailablePort(3000, localIp);

console.log(`\n==============================================`);
console.log(`🚀 Starting Next.js server on Network IP: ${localIp}`);
if (activePort !== 3000) {
    console.log(`⚠️  Port 3000 is reserved/blocked by Windows (EACCES). Automatically using port: ${activePort}`);
}
console.log(`💻 Local URL: ${protocol}://localhost:${activePort}`);
console.log(`📱 Phone URL: ${protocol}://${localIp}:${activePort}`);
if (isHttps) {
    console.log(`🔒 HTTPS Mode Enabled: Native Web Share API for Mobile is active!`);
}
console.log(`==============================================\n`);

const nextArgs = ['next', 'dev', '-H', localIp, '-p', String(activePort)];
if (isHttps) {
    nextArgs.push('--experimental-https');
}

const child = spawn('npx', nextArgs, { stdio: 'inherit', shell: true });

child.on('close', (code) => {
  process.exit(code);
});
