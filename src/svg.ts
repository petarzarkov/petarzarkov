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

const ANIMATION = `
  @keyframes fadeIn {
    from { opacity: 0; }
    to { opacity: 1; }
  }
  
  @keyframes slideIn {
    from { transform: translateX(-10px); opacity: 0; }
    to { transform: translateX(0); opacity: 1; }
  }
  
  @keyframes growBar {
    from { width: 0; }
  }
  
  .fade-in { animation: fadeIn 0.6s ease-out; }
  .slide-in { animation: slideIn 0.6s ease-out; }
  .grow-bar { animation: growBar 1s ease-out; }
`;

export function generateStatsOverviewCard(stats: GitHubStats): string {
  const width = 495;
  const height = 210;

  return `
<svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" fill="none" xmlns="http://www.w3.org/2000/svg">
  <style>
    .header { font: 600 18px 'Segoe UI', Ubuntu, Sans-Serif; fill: ${
      THEME.text
    }; }
    .stat-label { font: 400 14px 'Segoe UI', Ubuntu, Sans-Serif; fill: ${
      THEME.textSecondary
    }; }
    .stat-value { font: 600 16px 'Segoe UI', Ubuntu, Sans-Serif; fill: ${
      THEME.text
    }; }
    .icon { fill: ${THEME.accent}; }
    ${ANIMATION}
  </style>
  
  <rect x="0.5" y="0.5" width="${width - 1}" height="${
    height - 1
  }" rx="4.5" fill="${THEME.bg}" stroke="${THEME.border}"/>
  
  <g class="fade-in">
    <text x="25" y="35" class="header">📊 GitHub Statistics</text>
    <text x="25" y="52" class="stat-label">Period: ${new Date(stats.periodStart).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })} - ${new Date(stats.periodEnd).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</text>
    
    <!-- Total Contributions -->
    <g transform="translate(25, 75)" class="slide-in">
      <text y="0" class="stat-label">Total Contributions</text>
      <text y="22" class="stat-value">${stats.streak.totalContributions.toLocaleString()}</text>
    </g>
    
    <!-- Total Commits -->
    <g transform="translate(185, 75)" class="slide-in" style="animation-delay: 0.1s;">
      <text y="0" class="stat-label">Total Commits</text>
      <text y="22" class="stat-value">${stats.totalCommits.toLocaleString()}</text>
    </g>
    
    <!-- Total PRs -->
    <g transform="translate(345, 75)" class="slide-in" style="animation-delay: 0.2s;">
      <text y="0" class="stat-label">Pull Requests</text>
      <text y="22" class="stat-value">${stats.totalPRs.toLocaleString()}</text>
    </g>
    
    <!-- Total Reviews -->
    <g transform="translate(25, 130)" class="slide-in" style="animation-delay: 0.3s;">
      <text y="0" class="stat-label">Code Reviews</text>
      <text y="22" class="stat-value">${stats.totalReviews.toLocaleString()}</text>
    </g>
    
    <!-- Total Issues -->
    <g transform="translate(185, 130)" class="slide-in" style="animation-delay: 0.4s;">
      <text y="0" class="stat-label">Issues</text>
      <text y="22" class="stat-value">${stats.totalIssues.toLocaleString()}</text>
    </g>
    
    <!-- Total Repos -->
    <g transform="translate(345, 130)" class="slide-in" style="animation-delay: 0.5s;">
      <text y="0" class="stat-label">Repositories</text>
      <text y="22" class="stat-value">${stats.totalRepos}</text>
    </g>
    
    <!-- Streak Info -->
    <g transform="translate(25, 180)">
      <text y="0" class="stat-label">
        🔥 Current Streak: <tspan class="stat-value" fill="${THEME.accent}">${
          stats.streak.currentStreak
        } days</tspan>
        <tspan dx="15">📈 Longest: <tspan class="stat-value">${
          stats.streak.longestStreak
        } days</tspan></tspan>
      </text>
    </g>
  </g>
</svg>`.trim();
}

export function generateLanguagesAndActivityCard(stats: GitHubStats): string {
  const width = 495;
  const height = 500;
  const languages = stats.languages.slice(0, 8);

  // Generate contribution heatmap for last 12 weeks
  const last12Weeks = stats.contributionGraph.slice(-84); // 12 weeks * 7 days
  const weeks: ContributionDay[][] = [];

  for (let i = 0; i < last12Weeks.length; i += 7) {
    weeks.push(last12Weeks.slice(i, i + 7));
  }

  const cellSize = 10;
  const cellGap = 3;
  const heatmapStartY = 340;

  return `
<svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" fill="none" xmlns="http://www.w3.org/2000/svg">
  <style>
    .header { font: 600 18px 'Segoe UI', Ubuntu, Sans-Serif; fill: ${
      THEME.text
    }; }
    .lang-name { font: 400 14px 'Segoe UI', Ubuntu, Sans-Serif; fill: ${
      THEME.text
    }; }
    .lang-percent { font: 600 12px 'Segoe UI', Ubuntu, Sans-Serif; fill: ${
      THEME.textSecondary
    }; }
    .heatmap-label { font: 400 12px 'Segoe UI', Ubuntu, Sans-Serif; fill: ${
      THEME.textSecondary
    }; }
    ${ANIMATION}
  </style>
  
  <rect x="0.5" y="0.5" width="${width - 1}" height="${
    height - 1
  }" rx="4.5" fill="${THEME.bg}" stroke="${THEME.border}"/>
  
  <g class="fade-in">
    <text x="25" y="35" class="header">💻 Top Languages</text>
    
    ${languages
      .map((lang, idx) => {
        const y = 70 + idx * 30;
        const barMaxWidth = 370;
        const barWidth = (lang.percentage / 100) * barMaxWidth;

        return `
      <g transform="translate(25, ${y})" class="slide-in" style="animation-delay: ${
        idx * 0.1
      }s;">
        <circle cx="5" cy="-5" r="5" fill="${lang.color}"/>
        <text x="18" y="0" class="lang-name">${lang.name}</text>
        <text x="445" y="0" class="lang-percent" text-anchor="end">${lang.percentage.toFixed(
          1,
        )}%</text>
        <rect x="18" y="5" width="${barMaxWidth}" height="4" rx="2" fill="${
          THEME.border
        }"/>
        <rect x="18" y="5" width="${barWidth}" height="4" rx="2" fill="${
          lang.color
        }" class="grow-bar" style="animation-delay: ${idx * 0.1}s;"/>
      </g>`;
      })
      .join('')}
    
    <!-- Contribution Activity -->
    <text x="25" y="${
      heatmapStartY - 10
    }" class="header">📈 Contribution Activity (Last 12 Weeks)</text>
    
    <g transform="translate(25, ${heatmapStartY + 10})">
      ${weeks
        .map((week, weekIdx) => {
          return week
            .map((day, dayIdx) => {
              const x = weekIdx * (cellSize + cellGap);
              const y = dayIdx * (cellSize + cellGap);
              const color = THEME.contribution[`level${day.level}`];

              return `<rect x="${x}" y="${y}" width="${cellSize}" height="${cellSize}" rx="2" fill="${color}" class="fade-in" style="animation-delay: ${
                (weekIdx * 7 + dayIdx) * 0.01
              }s;">
            <title>${day.date}: ${day.count} contributions</title>
          </rect>`;
            })
            .join('');
        })
        .join('')}
      
      <!-- Legend -->
      <g transform="translate(0, ${8 * (cellSize + cellGap) + 10})">
        <text x="0" y="10" class="heatmap-label">Less</text>
        ${[0, 1, 2, 3, 4]
          .map((level, idx) => {
            const color =
              THEME.contribution[
                `level${level}` as keyof typeof THEME.contribution
              ];
            return `<rect x="${
              40 + idx * (cellSize + cellGap)
            }" y="0" width="${cellSize}" height="${cellSize}" rx="2" fill="${color}"/>`;
          })
          .join('')}
        <text x="${
          40 + 5 * (cellSize + cellGap) + 5
        }" y="10" class="heatmap-label">More</text>
      </g>
    </g>
  </g>
</svg>`.trim();
}

export function generateCombinedStatsCard(stats: GitHubStats): string {
  const width = 800;
  const height = 400;

  return `
<svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" fill="none" xmlns="http://www.w3.org/2000/svg">
  <style>
    .title { font: 600 20px 'Segoe UI', Ubuntu, Sans-Serif; fill: ${
      THEME.text
    }; }
    .header { font: 600 16px 'Segoe UI', Ubuntu, Sans-Serif; fill: ${
      THEME.text
    }; }
    .stat-label { font: 400 13px 'Segoe UI', Ubuntu, Sans-Serif; fill: ${
      THEME.textSecondary
    }; }
    .stat-value { font: 600 18px 'Segoe UI', Ubuntu, Sans-Serif; fill: ${
      THEME.text
    }; }
    .lang-name { font: 400 13px 'Segoe UI', Ubuntu, Sans-Serif; fill: ${
      THEME.text
    }; }
    .lang-percent { font: 600 12px 'Segoe UI', Ubuntu, Sans-Serif; fill: ${
      THEME.textSecondary
    }; }
    ${ANIMATION}
  </style>
  
  <rect x="0.5" y="0.5" width="${width - 1}" height="${
    height - 1
  }" rx="4.5" fill="${THEME.bg}" stroke="${THEME.border}"/>
  
  <g class="fade-in">
    <!-- Title -->
    <text x="25" y="35" class="title">📊 GitHub Statistics & Activity</text>
    
    <!-- Stats Grid -->
    <g transform="translate(25, 70)">
      <!-- Row 1 -->
      <g class="slide-in">
        <text y="0" class="stat-label">Total Contributions</text>
        <text y="25" class="stat-value">${stats.streak.totalContributions.toLocaleString()}</text>
      </g>
      
      <g transform="translate(180, 0)" class="slide-in" style="animation-delay: 0.1s;">
        <text y="0" class="stat-label">Total Commits</text>
        <text y="25" class="stat-value">${stats.totalCommits.toLocaleString()}</text>
      </g>
      
      <g transform="translate(360, 0)" class="slide-in" style="animation-delay: 0.2s;">
        <text y="0" class="stat-label">Pull Requests</text>
        <text y="25" class="stat-value">${stats.totalPRs.toLocaleString()}</text>
      </g>
      
      <g transform="translate(540, 0)" class="slide-in" style="animation-delay: 0.3s;">
        <text y="0" class="stat-label">Code Reviews</text>
        <text y="25" class="stat-value">${stats.totalReviews.toLocaleString()}</text>
      </g>
      
      <!-- Row 2 -->
      <g transform="translate(0, 70)" class="slide-in" style="animation-delay: 0.4s;">
        <text y="0" class="stat-label">Issues</text>
        <text y="25" class="stat-value">${stats.totalIssues.toLocaleString()}</text>
      </g>
      
      <g transform="translate(180, 70)" class="slide-in" style="animation-delay: 0.5s;">
        <text y="0" class="stat-label">Repositories</text>
        <text y="25" class="stat-value">${stats.totalRepos}</text>
      </g>
      
      <g transform="translate(360, 70)" class="slide-in" style="animation-delay: 0.6s;">
        <text y="0" class="stat-label">Current Streak</text>
        <text y="25" class="stat-value" fill="${THEME.accent}">${
          stats.streak.currentStreak
        } days</text>
      </g>
      
      <g transform="translate(540, 70)" class="slide-in" style="animation-delay: 0.7s;">
        <text y="0" class="stat-label">Longest Streak</text>
        <text y="25" class="stat-value">${
          stats.streak.longestStreak
        } days</text>
      </g>
    </g>
    
    <!-- Divider -->
    <line x1="25" y1="225" x2="${width - 25}" y2="225" stroke="${
      THEME.border
    }" stroke-width="1"/>
    
    <!-- Languages Section -->
    <text x="25" y="255" class="header">💻 Top Languages</text>
    
    ${stats.languages
      .slice(0, 5)
      .map((lang, idx) => {
        const y = 280 + idx * 22;
        const barMaxWidth = 700;
        const barWidth = (lang.percentage / 100) * barMaxWidth;

        return `
      <g transform="translate(45, ${y})" class="slide-in" style="animation-delay: ${
        0.8 + idx * 0.1
      }s;">
        <circle cx="0" cy="-3" r="4" fill="${lang.color}"/>
        <text x="12" y="0" class="lang-name">${lang.name}</text>
        <text x="730" y="0" class="lang-percent" text-anchor="end">${lang.percentage.toFixed(
          1,
        )}%</text>
        <rect x="12" y="4" width="${barMaxWidth}" height="3" rx="1.5" fill="${
          THEME.border
        }"/>
        <rect x="12" y="4" width="${barWidth}" height="3" rx="1.5" fill="${
          lang.color
        }" class="grow-bar" style="animation-delay: ${0.8 + idx * 0.1}s;"/>
      </g>`;
      })
      .join('')}
  </g>
</svg>`.trim();
}
