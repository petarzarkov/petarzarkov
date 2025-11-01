import { Octokit } from '@octokit/rest';
import { graphql } from '@octokit/graphql';
import type {
  GitHubStats,
  LanguageStats,
  ContributionDay,
  StreakInfo,
  RepoInfo,
  UserContributions,
  GraphQLContributionsResponse,
  OctokitRepository,
  OctokitUser,
} from './types.js';

const LANGUAGE_COLORS: Record<string, string> = {
  TypeScript: '#3178c6',
  JavaScript: '#f1e05a',
  Python: '#3572A5',
  Go: '#00ADD8',
  Java: '#b07219',
  'C#': '#178600',
  C: '#555555',
  'C++': '#f34b7d',
  Rust: '#dea584',
  Ruby: '#701516',
  PHP: '#4F5D95',
  HTML: '#e34c26',
  CSS: '#563d7c',
  Shell: '#89e051',
  Dart: '#00B4AB',
};

export class GitHubAPIClient {
  private octokit: Octokit;
  private graphqlWithAuth: typeof graphql;
  private username: string;

  constructor(token: string, username: string) {
    this.octokit = new Octokit({ auth: token });
    this.graphqlWithAuth = graphql.defaults({
      headers: {
        authorization: `token ${token}`,
      },
    });
    this.username = username;
  }

  async fetchAllStats(): Promise<GitHubStats> {
    console.log('📊 Fetching GitHub stats...');

    const [userContributions, repos, user] = await Promise.all([
      this.fetchUserContributions(),
      this.fetchRepositories(),
      this.fetchUserInfo(),
    ]);

    const languages = this.calculateLanguageStats(repos);
    const contributionGraph = this.parseContributionGraph(userContributions);
    const streak = this.calculateStreak(contributionGraph);
    const topRepos = this.getTopRepositories(repos);

    return {
      username: this.username,
      userId: user.id,
      totalCommits: userContributions.totalCommitContributions,
      totalPRs: userContributions.totalPullRequestContributions,
      totalIssues: userContributions.totalIssueContributions,
      totalReviews: userContributions.totalPullRequestReviewContributions,
      totalRepos: user.public_repos + (user.total_private_repos || 0),
      totalStars: repos.reduce(
        (sum, repo) => sum + (repo.stargazers_count || 0),
        0,
      ),
      contributedTo: userContributions.totalRepositoriesWithContributedCommits,
      streak,
      languages,
      contributionGraph,
      topRepos,
    };
  }

  private async fetchUserContributions(): Promise<UserContributions> {
    console.log('  Fetching contributions (including private)...');

    // Calculate date range for last 365 days (matching GitHub's profile view)
    const today = new Date();
    const oneYearAgo = new Date(today);
    oneYearAgo.setDate(today.getDate() - 365); // Exactly 365 days ago

    // Format dates as ISO strings (GitHub expects YYYY-MM-DDTHH:MM:SSZ)
    const from = oneYearAgo.toISOString();
    const to = today.toISOString();

    console.log(
      `  📅 Querying contributions from ${from.split('T')[0]} to ${
        to.split('T')[0]
      }`,
    );

    const query = `
      query($username: String!, $from: DateTime!, $to: DateTime!) {
        user(login: $username) {
          contributionsCollection(from: $from, to: $to) {
            totalCommitContributions
            totalIssueContributions
            totalPullRequestContributions
            totalPullRequestReviewContributions
            totalRepositoryContributions
            totalRepositoriesWithContributedCommits
            restrictedContributionsCount
            contributionCalendar {
              totalContributions
              weeks {
                contributionDays {
                  date
                  contributionCount
                  contributionLevel
                }
              }
            }
          }
        }
      }
    `;

    const result = (await this.graphqlWithAuth(query, {
      username: this.username,
      from,
      to,
    })) as GraphQLContributionsResponse;

    const contributions = result.user.contributionsCollection;

    // Debug: Log contribution breakdown
    console.log(
      `  📊 Contribution breakdown (${from.split('T')[0]} to ${
        to.split('T')[0]
      }):`,
    );
    console.log(`     - Commits: ${contributions.totalCommitContributions}`);
    console.log(`     - PRs: ${contributions.totalPullRequestContributions}`);
    console.log(
      `     - Reviews: ${contributions.totalPullRequestReviewContributions}`,
    );
    console.log(`     - Issues: ${contributions.totalIssueContributions}`);
    console.log(`     - Repos: ${contributions.totalRepositoryContributions}`);
    console.log(
      `     - Restricted: ${contributions.restrictedContributionsCount}`,
    );
    console.log(
      `     - Calendar Total: ${contributions.contributionCalendar.totalContributions}`,
    );

    return contributions;
  }

  private async fetchRepositories() {
    console.log('  Fetching repositories...');

    const repos = await this.octokit.paginate(this.octokit.repos.listForUser, {
      username: this.username,
      per_page: 100,
      type: 'owner',
    });

    return repos;
  }

  private async fetchUserInfo(): Promise<OctokitUser> {
    console.log('  Fetching user info...');

    const { data } = await this.octokit.users.getByUsername({
      username: this.username,
    });

    return data as OctokitUser;
  }

  private calculateLanguageStats(repos: OctokitRepository[]): LanguageStats[] {
    const languageBytes: Record<string, number> = {};

    for (const repo of repos) {
      if (repo.language) {
        languageBytes[repo.language] =
          (languageBytes[repo.language] || 0) + (repo.size || 0);
      }
    }

    const totalBytes = Object.values(languageBytes).reduce(
      (sum, bytes) => sum + bytes,
      0,
    );

    const stats: LanguageStats[] = Object.entries(languageBytes)
      .map(([name, size]) => ({
        name,
        color: LANGUAGE_COLORS[name] || '#858585',
        percentage: (size / totalBytes) * 100,
        size,
      }))
      .sort((a, b) => b.percentage - a.percentage)
      .slice(0, 8); // Top 8 languages

    return stats;
  }

  private parseContributionGraph(
    contributions: UserContributions,
  ): ContributionDay[] {
    const days: ContributionDay[] = [];

    for (const week of contributions.contributionCalendar.weeks) {
      for (const day of week.contributionDays) {
        days.push({
          date: day.date,
          count: day.contributionCount,
          level: this.getContributionLevel(day.contributionCount),
        });
      }
    }

    return days;
  }

  private getContributionLevel(count: number): 0 | 1 | 2 | 3 | 4 {
    if (count === 0) return 0;
    if (count < 3) return 1;
    if (count < 6) return 2;
    if (count < 9) return 3;
    return 4;
  }

  private calculateStreak(contributions: ContributionDay[]): StreakInfo {
    let currentStreak = 0;
    let longestStreak = 0;
    let tempStreak = 0;

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Sort by date descending
    const sortedContributions = [...contributions].sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
    );

    // Calculate current streak
    let streakActive = true;
    for (const day of sortedContributions) {
      const dayDate = new Date(day.date);
      dayDate.setHours(0, 0, 0, 0);

      if (streakActive && day.count > 0) {
        currentStreak++;
      } else if (streakActive && day.count === 0) {
        const diffDays = Math.floor(
          (today.getTime() - dayDate.getTime()) / (1000 * 60 * 60 * 24),
        );
        if (diffDays > 1) {
          streakActive = false;
        }
      }
    }

    // Calculate longest streak
    for (const day of contributions) {
      if (day.count > 0) {
        tempStreak++;
        longestStreak = Math.max(longestStreak, tempStreak);
      } else {
        tempStreak = 0;
      }
    }

    const totalContributions = contributions.reduce(
      (sum, day) => sum + day.count,
      0,
    );

    return {
      currentStreak,
      longestStreak,
      totalContributions,
    };
  }

  private getTopRepositories(repos: OctokitRepository[]): RepoInfo[] {
    return repos
      .filter(repo => !repo.fork)
      .sort((a, b) => (b.stargazers_count ?? 0) - (a.stargazers_count ?? 0))
      .slice(0, 5)
      .map(repo => ({
        name: repo.name,
        stars: repo.stargazers_count ?? 0,
        forks: repo.forks_count ?? 0,
        description: repo.description ?? '',
        language: repo.language ?? 'Unknown',
      }));
  }
}
