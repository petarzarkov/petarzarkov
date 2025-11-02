import { writeFile, mkdir } from 'fs/promises';
import { existsSync } from 'fs';
import { join } from 'path';
import { GitHubAPIClient } from './api.js';
import { generateStatsOverviewCard, generateLanguagesCard } from './svg.js';
import { generateReadme, generateIndexHTML } from './templates/index.js';

const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
const GITHUB_USERNAME = process.env.GITHUB_USERNAME || 'petarzarkov';
const GENERATED_DIR = 'generated';
const README_PATH = 'README.md';
const INDEX_PATH = 'index.html';

async function main() {
  console.log('🚀 Starting GitHub Stats Factory...\n');

  // Validate environment
  if (!GITHUB_TOKEN) {
    console.error('❌ Error: GITHUB_TOKEN is not set in environment variables');
    console.error(
      '   Please create a .env file with your GitHub Personal Access Token',
    );
    console.error('   Example: GITHUB_TOKEN=ghp_xxxxxxxxxxxx');
    process.exit(1);
  }

  try {
    // Step 1: Fetch all GitHub stats
    console.log('📡 Step 1: Fetching GitHub data...');
    const apiClient = new GitHubAPIClient(GITHUB_TOKEN, GITHUB_USERNAME);
    const stats = await apiClient.fetchAllStats();
    console.log('✅ Data fetched successfully\n');

    // Step 2: Generate SVG files
    console.log('🎨 Step 2: Generating SVG cards...');

    // Ensure generated directory exists
    if (!existsSync(GENERATED_DIR)) {
      await mkdir(GENERATED_DIR, { recursive: true });
    }

    const statsOverview = generateStatsOverviewCard(stats);
    const languagesCard = generateLanguagesCard(stats);

    await writeFile(
      join(GENERATED_DIR, 'stats-overview.svg'),
      statsOverview,
      'utf-8',
    );
    await writeFile(
      join(GENERATED_DIR, 'languages.svg'),
      languagesCard,
      'utf-8',
    );

    console.log('  ✓ Generated stats-overview.svg');
    console.log('  ✓ Generated languages.svg');
    console.log('✅ SVG cards generated\n');

    // Step 3: Generate README.md
    console.log('📝 Step 3: Generating README.md...');

    const readmeContent = generateReadme();
    await writeFile(README_PATH, readmeContent, 'utf-8');
    console.log('✅ README.md generated\n');

    // Step 4: Generate index.html
    console.log('🌐 Step 4: Generating index.html...');

    const indexHTML = generateIndexHTML(stats);
    await writeFile(INDEX_PATH, indexHTML, 'utf-8');
    console.log('✅ index.html generated\n');

    // Step 5: Summary
    console.log('🎉 GitHub Stats Factory completed successfully!\n');
    console.log('📊 Summary:');
    console.log(
      `   • Total Contributions: ${stats.streak.totalContributions.toLocaleString()}`,
    );
    console.log(`   • Total Commits: ${stats.totalCommits.toLocaleString()}`);
    console.log(`   • Total PRs: ${stats.totalPRs.toLocaleString()}`);
    console.log(`   • Total Reviews: ${stats.totalReviews.toLocaleString()}`);
    console.log(`   • Total Issues: ${stats.totalIssues.toLocaleString()}`);
    console.log(`   • Total Repos: ${stats.totalRepos}`);
    console.log(`   • Total Stars: ${stats.totalStars.toLocaleString()}`);
    console.log(`   • Total Forks: ${stats.totalForks.toLocaleString()}`);
    console.log(`   • Followers: ${stats.followers.toLocaleString()}`);
    console.log(`   • Current Streak: ${stats.streak.currentStreak} days`);
    console.log(`   • Avg Commits/Day: ${stats.avgCommitsPerDay}`);
    console.log(
      `   • Top Language: ${
        stats.languages[0]?.name || 'N/A'
      } (${stats.languages[0]?.percentage.toFixed(1)}%)`,
    );
    console.log('\n✨ Your stats are now up to date!');
  } catch (error) {
    console.error('\n❌ Error generating stats:');
    if (error instanceof Error) {
      console.error(`   ${error.message}`);
      if (error.stack) {
        console.error('\n Stack trace:');
        console.error(error.stack);
      }
    } else {
      console.error(error);
    }
    process.exit(1);
  }
}

// Run the script
main();
