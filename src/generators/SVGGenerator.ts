import { THEME, ENHANCED_ANIMATIONS } from '../utils/Theme.js';
import { escapeXml } from '../utils/FormatUtils.js';

/**
 * Base SVG generator class with common SVG structure, theme, and animations
 */
export abstract class SVGGenerator {
  protected readonly theme = THEME;
  protected readonly width: number;
  protected height: number;

  constructor(width: number, height: number) {
    this.width = width;
    this.height = height;
  }

  /**
   * Generate the SVG content
   */
  abstract generate(): string;

  /**
   * Create SVG wrapper with styles
   */
  protected createSVGWrapper(content: string, styles: string = ''): string {
    return `
<svg width="${this.width}" height="${this.height}" viewBox="0 0 ${this.width} ${this.height}" fill="none" xmlns="http://www.w3.org/2000/svg">
  <style>
    ${styles}
    ${ENHANCED_ANIMATIONS}
  </style>
  
  <rect x="0.5" y="0.5" width="${this.width - 1}" height="${this.height - 1}" rx="4.5" fill="${this.theme.bg}" stroke="${this.theme.border}"/>
  
  ${content}
</svg>`.trim();
  }

  /**
   * Create header text
   */
  protected createHeader(text: string, x = 25, y = 35): string {
    return `<text x="${x}" y="${y}" class="header">${escapeXml(text)}</text>`;
  }

  /**
   * Create subheader text
   */
  protected createSubheader(text: string, x = 25, y = 54): string {
    return `<text x="${x}" y="${y}" class="subheader">${escapeXml(text)}</text>`;
  }
}
