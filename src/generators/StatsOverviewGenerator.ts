import type { GitHubStats, ContributionDay } from '../types.js';
import { SVGGenerator } from './SVGGenerator.js';
import { formatDate, escapeXml } from '../utils/FormatUtils.js';

/**
 * Generates the stats overview SVG card
 */
export class StatsOverviewGenerator extends SVGGenerator {
  #stats: GitHubStats;

  constructor(stats: GitHubStats) {
    super(800, 480);
    this.#stats = stats;
  }

  generate(): string {
    // Get last 12 weeks of contributions for heatmap
    const last12Weeks = this.#stats.contributionGraph.slice(-84); // 12 weeks * 7 days
    const weeks: ContributionDay[][] = [];
    for (let i = 0; i < last12Weeks.length; i += 7) {
      weeks.push(last12Weeks.slice(i, i + 7));
    }

    // Generate heatmap
    const cellSize = 11;
    const cellGap = 3;
    const heatmapStartY = 270;
    const heatmapStartX = 25;

    let heatmapSVG = '';
    let animationDelay = 0;

    weeks.forEach((week, weekIndex) => {
      week.forEach((day, dayIndex) => {
        const x = heatmapStartX + weekIndex * (cellSize + cellGap);
        const y = heatmapStartY + dayIndex * (cellSize + cellGap);
        const color =
          this.theme.contribution[
            `level${day.level}` as keyof typeof this.theme.contribution
          ];

        heatmapSVG += `
    <rect x="${x}" y="${y}" width="${cellSize}" height="${cellSize}" 
          rx="2" fill="${color}" class="pop-in" 
          style="animation-delay: ${animationDelay}s;">
      <title>${escapeXml(day.date)}: ${day.count} contributions</title>
    </rect>`;
        animationDelay += 0.01;
      });
    });

    const styles = `
    .header { font: 600 20px 'Segoe UI', Ubuntu, Sans-Serif; fill: ${this.theme.text}; }
    .subheader { font: 400 13px 'Segoe UI', Ubuntu, Sans-Serif; fill: ${this.theme.textSecondary}; }
    .stat-label { font: 400 13px 'Segoe UI', Ubuntu, Sans-Serif; fill: ${this.theme.textSecondary}; }
    .stat-value { font: 600 20px 'Segoe UI', Ubuntu, Sans-Serif; fill: ${this.theme.text}; }
    .stat-value-small { font: 600 16px 'Segoe UI', Ubuntu, Sans-Serif; fill: ${this.theme.text}; }
    .icon { fill: ${this.theme.accent}; }
    `;

    const content = `
  <g class="fade-in">
    ${this.createHeader('📊 GitHub Stats')}
    ${this.createSubheader(
      `Period: ${formatDate(this.#stats.periodStart, {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      })} - ${formatDate(this.#stats.periodEnd, {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      })}`,
    )}
  </g>
  
  <!-- Stats Grid -->
  <g class="slide-in-left">
    <!-- Row 1 -->
    <g transform="translate(25, 85)">
      <text y="0" class="stat-label">Total Contributions</text>
      <text y="24" class="stat-value">${this.#stats.streak.totalContributions.toLocaleString()}</text>
    </g>
    
    <g transform="translate(200, 85)" class="slide-in-left" style="animation-delay: 0.2s;">
      <text y="0" class="stat-label">Commits</text>
      <text y="24" class="stat-value">${this.#stats.totalCommits.toLocaleString()}</text>
      <text y="42" class="stat-label">${this.#stats.contributionPercentages.commits}% of activity</text>
    </g>
    
    <g transform="translate(370, 85)" class="slide-in-left" style="animation-delay: 0.3s;">
      <text y="0" class="stat-label">Pull Requests</text>
      <text y="24" class="stat-value">${this.#stats.totalPRs.toLocaleString()}</text>
      <text y="42" class="stat-label">${this.#stats.contributionPercentages.prs}% of activity</text>
    </g>
    
    <g transform="translate(540, 85)" class="slide-in-left" style="animation-delay: 0.4s;">
      <text y="0" class="stat-label">Code Reviews</text>
      <text y="24" class="stat-value">${this.#stats.totalReviews.toLocaleString()}</text>
      <text y="42" class="stat-label">${this.#stats.contributionPercentages.reviews}% of activity</text>
    </g>
    
    <!-- Row 2 -->
    <g transform="translate(25, 160)" class="slide-in-left" style="animation-delay: 0.5s;">
      <text y="0" class="stat-label">Issues</text>
      <text y="24" class="stat-value">${this.#stats.totalIssues.toLocaleString()}</text>
      <text y="42" class="stat-label">${this.#stats.contributionPercentages.issues}% of activity</text>
    </g>
    
    <g transform="translate(200, 160)" class="slide-in-left" style="animation-delay: 0.6s;">
      <text y="0" class="stat-label">Repositories</text>
      <text y="24" class="stat-value">${this.#stats.totalRepos}</text>
    </g>
    
    <g transform="translate(370, 160)" class="slide-in-left" style="animation-delay: 0.7s;">
      <text y="0" class="stat-label">Total Stars</text>
      <text y="24" class="stat-value">${this.#stats.totalStars.toLocaleString()}</text>
    </g>
    
    <g transform="translate(540, 160)" class="slide-in-left" style="animation-delay: 0.8s;">
      <text y="0" class="stat-label">Total Forks</text>
      <text y="24" class="stat-value">${this.#stats.totalForks.toLocaleString()}</text>
    </g>
  </g>
  
  <!-- Streak Info -->
  <g transform="translate(25, 230)" class="slide-in-up" style="animation-delay: 1s;">
    <text y="0" class="stat-label">
      🔥 Current Streak: <tspan class="stat-value-small pulse" fill="${this.theme.warning}">${this.#stats.streak.currentStreak} days</tspan>
      <tspan dx="20">📈 Longest: <tspan class="stat-value-small" fill="${this.theme.success}">${this.#stats.streak.longestStreak} days</tspan></tspan>
      <tspan dx="20">📊 Avg: <tspan class="stat-value-small">${this.#stats.avgCommitsPerDay} commits/day</tspan></tspan>
    </text>
  </g>
  
  <!-- Contribution Heatmap -->
  <g class="fade-in" style="animation-delay: 1.2s;">
    <text x="25" y="${heatmapStartY - 10}" class="stat-label">Last 12 Weeks Activity</text>
    ${heatmapSVG}
    
    <!-- Legend -->
    <g transform="translate(25, ${heatmapStartY + 105})">
      <text x="0" y="12" class="stat-label">Less</text>
      <rect x="35" y="4" width="10" height="10" rx="2" fill="${this.theme.contribution.level0}"/>
      <rect x="50" y="4" width="10" height="10" rx="2" fill="${this.theme.contribution.level1}"/>
      <rect x="65" y="4" width="10" height="10" rx="2" fill="${this.theme.contribution.level2}"/>
      <rect x="80" y="4" width="10" height="10" rx="2" fill="${this.theme.contribution.level3}"/>
      <rect x="95" y="4" width="10" height="10" rx="2" fill="${this.theme.contribution.level4}"/>
      <text x="110" y="12" class="stat-label">More</text>
    </g>
  </g>
  
  <!-- Footer Stats -->
  <g transform="translate(520, ${heatmapStartY + 50})" class="slide-in-up" style="animation-delay: 1.4s;">
    <text y="0" class="stat-label">Contributed to</text>
    <text y="20" class="stat-value-small">${this.#stats.contributedTo} repositories</text>
    
    <text y="45" class="stat-label">Network</text>
    <text y="65" class="stat-value-small">${this.#stats.followers.toLocaleString()} followers · ${this.#stats.following.toLocaleString()} following</text>
  </g>
    `;

    return this.createSVGWrapper(content, styles);
  }
}
