import type { GitHubStats, ContributionDay } from './types.js';

// GitHub dark theme colors
const THEME = {
  bg: '#0d1117',
  border: '#30363d',
  text: '#c9d1d9',
  textSecondary: '#8b949e',
  accent: '#58a6ff',
  success: '#3fb950',
  warning: '#d29922',
  danger: '#f85149',
  contribution: {
    level0: '#161b22',
    level1: '#0e4429',
    level2: '#006d32',
    level3: '#26a641',
    level4: '#39d353',
  },
};

const ENHANCED_ANIMATIONS = `
  @keyframes fadeIn {
    from { opacity: 0; }
    to { opacity: 1; }
  }
  
  @keyframes slideInLeft {
    from { transform: translateX(-20px); opacity: 0; }
    to { transform: translateX(0); opacity: 1; }
  }
  
  @keyframes slideInUp {
    from { transform: translateY(20px); opacity: 0; }
    to { transform: translateY(0); opacity: 1; }
  }
  
  @keyframes growBar {
    from { transform: scaleX(0); transform-origin: left; }
    to { transform: scaleX(1); transform-origin: left; }
  }
  
  @keyframes pulse {
    0%, 100% { opacity: 1; }
    50% { opacity: 0.7; }
  }
  
  @keyframes popIn {
    0% { transform: scale(0); opacity: 0; }
    80% { transform: scale(1.1); }
    100% { transform: scale(1); opacity: 1; }
  }
  
  .fade-in { animation: fadeIn 1.6s ease-out; }
  .slide-in-left { animation: slideInLeft 1.6s ease-out; }
  .slide-in-up { animation: slideInUp 1.6s ease-out; }
  .grow-bar { animation: growBar 2.4s cubic-bezier(0.4, 0, 0.2, 1); }
  .pulse { animation: pulse 3s ease-in-out infinite; }
  .pop-in { animation: popIn 1.2s cubic-bezier(0.68, -0.55, 0.265, 1.55); }
`;

export function generateStatsOverviewCard(stats: GitHubStats): string {
  const width = 800;
  const height = 480;

  // Get last 12 weeks of contributions for heatmap
  const last12Weeks = stats.contributionGraph.slice(-84); // 12 weeks * 7 days
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
        THEME.contribution[
          `level${day.level}` as keyof typeof THEME.contribution
        ];

      heatmapSVG += `
    <rect x="${x}" y="${y}" width="${cellSize}" height="${cellSize}" 
          rx="2" fill="${color}" class="pop-in" 
          style="animation-delay: ${animationDelay}s;">
      <title>${day.date}: ${day.count} contributions</title>
    </rect>`;
      animationDelay += 0.01;
    });
  });

  return `
<svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" fill="none" xmlns="http://www.w3.org/2000/svg">
  <style>
    .header { font: 600 20px 'Segoe UI', Ubuntu, Sans-Serif; fill: ${THEME.text}; }
    .subheader { font: 400 13px 'Segoe UI', Ubuntu, Sans-Serif; fill: ${THEME.textSecondary}; }
    .stat-label { font: 400 13px 'Segoe UI', Ubuntu, Sans-Serif; fill: ${THEME.textSecondary}; }
    .stat-value { font: 600 20px 'Segoe UI', Ubuntu, Sans-Serif; fill: ${THEME.text}; }
    .stat-value-small { font: 600 16px 'Segoe UI', Ubuntu, Sans-Serif; fill: ${THEME.text}; }
    .icon { fill: ${THEME.accent}; }
    
    ${ENHANCED_ANIMATIONS}
  </style>
  
  <rect x="0.5" y="0.5" width="${width - 1}" height="${height - 1}" rx="4.5" fill="${THEME.bg}" stroke="${THEME.border}"/>
  
  <g class="fade-in">
    <text x="25" y="35" class="header">📊 GitHub Stats</text>
    <text x="25" y="54" class="subheader">Period: ${new Date(stats.periodStart).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })} - ${new Date(stats.periodEnd).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</text>
  </g>
  
  <!-- Stats Grid -->
  <g class="slide-in-left">
    <!-- Row 1 -->
    <g transform="translate(25, 85)">
      <text y="0" class="stat-label">Total Contributions</text>
      <text y="24" class="stat-value">${stats.streak.totalContributions.toLocaleString()}</text>
    </g>
    
    <g transform="translate(200, 85)" class="slide-in-left" style="animation-delay: 0.2s;">
      <text y="0" class="stat-label">Commits</text>
      <text y="24" class="stat-value">${stats.totalCommits.toLocaleString()}</text>
      <text y="42" class="stat-label">${stats.contributionPercentages.commits}% of activity</text>
    </g>
    
    <g transform="translate(370, 85)" class="slide-in-left" style="animation-delay: 0.3s;">
      <text y="0" class="stat-label">Pull Requests</text>
      <text y="24" class="stat-value">${stats.totalPRs.toLocaleString()}</text>
      <text y="42" class="stat-label">${stats.contributionPercentages.prs}% of activity</text>
    </g>
    
    <g transform="translate(540, 85)" class="slide-in-left" style="animation-delay: 0.4s;">
      <text y="0" class="stat-label">Code Reviews</text>
      <text y="24" class="stat-value">${stats.totalReviews.toLocaleString()}</text>
      <text y="42" class="stat-label">${stats.contributionPercentages.reviews}% of activity</text>
    </g>
    
    <!-- Row 2 -->
    <g transform="translate(25, 160)" class="slide-in-left" style="animation-delay: 0.5s;">
      <text y="0" class="stat-label">Issues</text>
      <text y="24" class="stat-value">${stats.totalIssues.toLocaleString()}</text>
      <text y="42" class="stat-label">${stats.contributionPercentages.issues}% of activity</text>
    </g>
    
    <g transform="translate(200, 160)" class="slide-in-left" style="animation-delay: 0.6s;">
      <text y="0" class="stat-label">Repositories</text>
      <text y="24" class="stat-value">${stats.totalRepos}</text>
    </g>
    
    <g transform="translate(370, 160)" class="slide-in-left" style="animation-delay: 0.7s;">
      <text y="0" class="stat-label">Total Stars</text>
      <text y="24" class="stat-value">${stats.totalStars.toLocaleString()}</text>
    </g>
    
    <g transform="translate(540, 160)" class="slide-in-left" style="animation-delay: 0.8s;">
      <text y="0" class="stat-label">Total Forks</text>
      <text y="24" class="stat-value">${stats.totalForks.toLocaleString()}</text>
    </g>
  </g>
  
  <!-- Streak Info -->
  <g transform="translate(25, 230)" class="slide-in-up" style="animation-delay: 1s;">
    <text y="0" class="stat-label">
      🔥 Current Streak: <tspan class="stat-value-small pulse" fill="${THEME.warning}">${stats.streak.currentStreak} days</tspan>
      <tspan dx="20">📈 Longest: <tspan class="stat-value-small" fill="${THEME.success}">${stats.streak.longestStreak} days</tspan></tspan>
      <tspan dx="20">📊 Avg: <tspan class="stat-value-small">${stats.avgCommitsPerDay} commits/day</tspan></tspan>
    </text>
  </g>
  
  <!-- Contribution Heatmap -->
  <g class="fade-in" style="animation-delay: 1.2s;">
    <text x="25" y="${heatmapStartY - 10}" class="stat-label">Last 12 Weeks Activity</text>
    ${heatmapSVG}
    
    <!-- Legend -->
    <g transform="translate(25, ${heatmapStartY + 105})">
      <text x="0" y="12" class="stat-label">Less</text>
      <rect x="35" y="4" width="10" height="10" rx="2" fill="${THEME.contribution.level0}"/>
      <rect x="50" y="4" width="10" height="10" rx="2" fill="${THEME.contribution.level1}"/>
      <rect x="65" y="4" width="10" height="10" rx="2" fill="${THEME.contribution.level2}"/>
      <rect x="80" y="4" width="10" height="10" rx="2" fill="${THEME.contribution.level3}"/>
      <rect x="95" y="4" width="10" height="10" rx="2" fill="${THEME.contribution.level4}"/>
      <text x="110" y="12" class="stat-label">More</text>
    </g>
  </g>
  
  <!-- Footer Stats -->
  <g transform="translate(520, ${heatmapStartY + 50})" class="slide-in-up" style="animation-delay: 1.4s;">
    <text y="0" class="stat-label">Contributed to</text>
    <text y="20" class="stat-value-small">${stats.contributedTo} repositories</text>
    
    <text y="45" class="stat-label">Network</text>
    <text y="65" class="stat-value-small">${stats.followers.toLocaleString()} followers · ${stats.following.toLocaleString()} following</text>
  </g>
</svg>`.trim();
}

export function generateLanguagesCard(stats: GitHubStats): string {
  const width = 800;
  const height = 320;
  const maxBars = 8;
  const topLanguages = stats.languages.slice(0, maxBars);

  let languagesSVG = '';
  let styleRules = '';
  let yOffset = 75;
  const barHeight = 20;
  const barSpacing = 30;
  const maxBarWidth = 680;

  topLanguages.forEach((lang, index) => {
    const barWidth = ((lang.percentage / 100) * maxBarWidth).toFixed(2);
    const delay = 0.2 + index * 0.16;

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
      <rect y="0" width="${maxBarWidth}" height="${barHeight}" rx="10" fill="${THEME.border}" opacity="0.3"/>
      
      <!-- Progress bar -->
      <rect y="0" width="${barWidth}" height="${barHeight}" rx="10" fill="${lang.color}" class="bar-${index}"/>
      
      <!-- Text labels positioned on top of bars -->
      <text y="15" x="10" class="lang-name">${lang.name}</text>
      <text y="15" x="${maxBarWidth}" text-anchor="end" class="lang-percent">${lang.percentage.toFixed(1)}%</text>
    </g>`;

    yOffset += barSpacing;
  });

  return `
<svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" fill="none" xmlns="http://www.w3.org/2000/svg">
  <style>
    .header { font: 600 20px 'Segoe UI', Ubuntu, Sans-Serif; fill: ${THEME.text}; }
    .lang-name { font: 500 15px 'Segoe UI', Ubuntu, Sans-Serif; fill: ${THEME.text}; }
    .lang-percent { font: 600 14px 'Segoe UI', Ubuntu, Sans-Serif; fill: ${THEME.textSecondary}; }
    
    .fade-in { animation: fadeIn 1.6s ease-out; }
    
    @keyframes fadeIn {
      from { opacity: 0; }
      to { opacity: 1; }
    }
    
    ${styleRules}
  </style>
  
  <rect x="0.5" y="0.5" width="${width - 1}" height="${height - 1}" rx="4.5" fill="${THEME.bg}" stroke="${THEME.border}"/>
  
  <g class="fade-in">
    <text x="25" y="35" class="header">💻 Top Languages</text>
  </g>
  
  ${languagesSVG}
</svg>`.trim();
}
