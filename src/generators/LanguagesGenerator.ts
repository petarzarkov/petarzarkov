import type { GitHubStats, LanguageStats } from '../types.js';
import { SVGGenerator } from './SVGGenerator.js';
import { formatLinesOfCode, escapeXml } from '../utils/FormatUtils.js';

/**
 * Generates the languages SVG card
 */
export class LanguagesGenerator extends SVGGenerator {
  readonly #barHeight = 20;
  readonly #barSpacing = 30;
  readonly #maxBarWidth = 680;
  readonly #headerHeight = 75;
  readonly #bottomPadding = 25;
  #stats: GitHubStats;

  constructor(stats: GitHubStats) {
    super(800, 0); // Height will be calculated dynamically
    this.#stats = stats;
  }

  generate(): string {
    // Filter languages: keep those with >= 100 lines, combine others
    const mainLanguages: LanguageStats[] = [];
    const otherLanguageNames: string[] = [];
    let otherTotalSize = 0;
    let otherTotalPercentage = 0;

    this.#stats.languages.forEach(lang => {
      const linesOfCode = Math.round(lang.size / 70);
      if (linesOfCode >= 100) {
        mainLanguages.push(lang);
      } else {
        otherLanguageNames.push(lang.name);
        otherTotalSize += lang.size;
        otherTotalPercentage += lang.percentage;
      }
    });

    // Add "Other" entry if there are languages under 100 lines
    const languagesToDisplay = [...mainLanguages];
    if (otherTotalSize > 0) {
      // Format "Other" name with language list
      const prefix = 'Other (';
      const suffix = ')';
      const maxLangChars = 50; // Max chars for language list itself
      const langList = otherLanguageNames.join(', ');

      let otherName: string;
      if (langList.length <= maxLangChars) {
        otherName = `${prefix}${langList}${suffix}`;
      } else {
        // Truncate to fit, trying to break at a comma
        const truncated: string[] = [];
        let currentLength = 0;
        for (const lang of otherLanguageNames) {
          const addition = truncated.length > 0 ? `, ${lang}` : lang;
          const testLength = currentLength + addition.length;

          if (testLength > maxLangChars) {
            break;
          }
          truncated.push(lang);
          currentLength = testLength;
        }

        const remainingCount = otherLanguageNames.length - truncated.length;
        const truncatedList = truncated.join(', ');
        const moreText = remainingCount > 0 ? `, +${remainingCount} more` : '';
        otherName = `${prefix}${truncatedList}${moreText}${suffix}`;
      }

      languagesToDisplay.push({
        name: otherName,
        color: '#858585',
        percentage: otherTotalPercentage,
        size: otherTotalSize,
      });
    }

    // Calculate dynamic height based on number of languages
    this.height =
      this.#headerHeight +
      languagesToDisplay.length * this.#barSpacing +
      this.#bottomPadding;

    let languagesSVG = '';
    let styleRules = '';
    let yOffset = this.#headerHeight;

    languagesToDisplay.forEach((lang, index) => {
      const barWidth = ((lang.percentage / 100) * this.#maxBarWidth).toFixed(2);
      const delay = 0.2 + index * 0.16;
      const linesOfCode = formatLinesOfCode(lang.size);

      // For "Other" entry, don't show line count since we show language names
      const isOther = lang.name.startsWith('Other (');
      const displayText = isOther
        ? lang.name
        : `${lang.name} (${linesOfCode} lines)`;

      // Create unique animation for each bar with pixel values
      styleRules += `
    @keyframes grow-bar-${index} {
      from { width: 0px; }
      to { width: ${barWidth}px; }
    }
    .bar-${index} {
      animation: grow-bar-${index} 2s ease-out ${delay}s forwards;
      width: 0;
    }`;

      languagesSVG += `
    <g transform="translate(50, ${yOffset})">
      <!-- Background bar -->
      <rect y="0" width="${this.#maxBarWidth}" height="${this.#barHeight}" rx="10" fill="${this.theme.border}" opacity="0.3"/>
      
      <!-- Progress bar -->
      <rect y="0" width="${barWidth}" height="${this.#barHeight}" rx="10" fill="${lang.color}" class="bar-${index}"/>
      
      <!-- Text labels positioned on top of bars -->
      <text y="15" x="10" class="lang-name">${escapeXml(displayText)}</text>
      <text y="15" x="${this.#maxBarWidth}" text-anchor="end" class="lang-percent">${lang.percentage.toFixed(1)}%</text>
    </g>`;

      yOffset += this.#barSpacing;
    });

    const styles = `
    .header { font: 600 20px 'Segoe UI', Ubuntu, Sans-Serif; fill: ${this.theme.text}; }
    .lang-name { font: 500 15px 'Segoe UI', Ubuntu, Sans-Serif; fill: ${this.theme.text}; }
    .lang-percent { font: 600 14px 'Segoe UI', Ubuntu, Sans-Serif; fill: ${this.theme.textSecondary}; }
    
    .fade-in { animation: fadeIn 1.6s ease-out; }
    
    @keyframes fadeIn {
      from { opacity: 0; }
      to { opacity: 1; }
    }
    
    ${styleRules}
    `;

    const content = `
  <g class="fade-in">
    ${this.createHeader('💻 Top Languages')}
  </g>
  
  ${languagesSVG}
    `;

    return this.createSVGWrapper(content, styles);
  }
}
