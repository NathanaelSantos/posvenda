import { cp, mkdir, rm, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const raiz = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const origem = path.join(raiz, 'public');
const destino = path.join(raiz, 'dist');

await rm(destino, { recursive: true, force: true });
await mkdir(destino, { recursive: true });
await cp(origem, destino, { recursive: true });
await writeFile(path.join(destino, '.nojekyll'), '');

console.log(`GitHub Pages pronto em ${path.relative(raiz, destino)}`);
