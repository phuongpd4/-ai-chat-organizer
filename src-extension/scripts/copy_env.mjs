import fs from 'fs';
import path from 'path';

const ENV_PATH = path.resolve(process.cwd(), '.env');
const EXAMPLE_ENV_PATH = path.resolve(process.cwd(), '.example.env');

if (!fs.existsSync(ENV_PATH)) {
    if (fs.existsSync(EXAMPLE_ENV_PATH)) {
        fs.copyFileSync(EXAMPLE_ENV_PATH, ENV_PATH);
        console.log('[CEB] Created .env from .example.env');
    } else {
        fs.writeFileSync(ENV_PATH, '');
        console.log('[CEB] Created empty .env file');
    }
} else {
    console.log('[CEB] .env file already exists');
}
