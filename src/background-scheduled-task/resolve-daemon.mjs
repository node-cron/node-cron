import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const daemonPath = `${__dirname}/daemon.js`;

export default daemonPath;