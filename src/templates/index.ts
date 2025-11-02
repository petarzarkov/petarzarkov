import { generateHeader } from './readme/header.js';
import { generateConnect } from './readme/connect.js';
import { generateStatsSection } from './readme/stats.js';
import { generateLanguagesAndTools } from './readme/languages-tools.js';
import { generateIndexHTML } from './html/index.js';

export function generateReadme(): string {
  return `${generateHeader()}

${generateConnect()}

${generateStatsSection()}

${generateLanguagesAndTools()}
`;
}

export { generateIndexHTML };
export * from './readme/connect.js';
