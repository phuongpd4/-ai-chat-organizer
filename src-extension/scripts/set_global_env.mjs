import fs from 'fs';
import path from 'path';

const ENV_PATH = path.resolve(process.cwd(), '.env');

// Default values
let CLI_CEB_DEV = 'false';
let CLI_CEB_FIREFOX = 'false';
const extraCliValues = [];

// Parse arguments
const args = process.argv.slice(2);
for (const arg of args) {
    const [key, value] = arg.split('=');

    if (key === 'CLI_CEB_DEV') {
        CLI_CEB_DEV = value;
    } else if (key === 'CLI_CEB_FIREFOX') {
        CLI_CEB_FIREFOX = value;
    } else if (key.startsWith('CLI_CEB_')) {
        extraCliValues.push(`${key}=${value}`);
    }
}

let existingEnvContent = '';
if (fs.existsSync(ENV_PATH)) {
    const content = fs.readFileSync(ENV_PATH, 'utf-8');
    // Keep only lines starting with CEB_
    existingEnvContent = content.split('\n')
        .filter(line => line.trim().startsWith('CEB_'))
        .join('\n');
} else {
    // Try to copy from .example.env if .env doesn't exist
    const exampleEnvPath = path.resolve(process.cwd(), '.example.env');
    if (fs.existsSync(exampleEnvPath)) {
        const content = fs.readFileSync(exampleEnvPath, 'utf-8');
        existingEnvContent = content.split('\n')
            .filter(line => line.trim().startsWith('CEB_'))
            .join('\n');
    }
}

const newContent = `# THOSE VALUES ARE EDITABLE ONLY VIA CLI
CLI_CEB_DEV=${CLI_CEB_DEV}
CLI_CEB_FIREFOX=${CLI_CEB_FIREFOX}
${extraCliValues.join('\n')}

# THOSE VALUES ARE EDITABLE
${existingEnvContent}
`;

fs.writeFileSync(ENV_PATH, newContent);
console.log('[CEB] Environment setup complete.');
