import { Octokit } from '@octokit/rest';
import { graphql } from '@octokit/graphql';
import type {
  OctokitRepository,
  GraphQLDetailedContributionsResponse,
} from './types.js';

export interface DetailedRepoContribution {
  repo: string;
  owner: string;
  isPrivate: boolean;
  isOrg: boolean;
  commits: number;
  additions: number;
  deletions: number;
}

export interface DetailedContributionStats {
  totalCommitsAllRepos: number;
  privateRepoCommits: number;
  orgRepoCommits: number;
  publicRepoCommits: number;
  repoBreakdown: DetailedRepoContribution[];
}

export class RepoContributionsClient {
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

  async fetchDetailedContributions(
    daysBack: number = 365,
  ): Promise<DetailedContributionStats> {
    console.log(
      '\n🔍 Fetching detailed repository contributions (including private orgs)...',
    );

    // Check token scopes
    try {
      const { headers } = await this.octokit.request('GET /user');
      const scopes = headers['x-oauth-scopes'];
      console.log(`   🔑 Token scopes: ${scopes || 'none'}`);

      if (!scopes?.includes('read:org')) {
        console.log(
          "   ⚠️  WARNING: Token missing 'read:org' scope - cannot see private org memberships",
        );
      }
    } catch {
      console.log('   ⚠️  Could not verify token scopes');
    }

    const since = new Date();
    since.setDate(since.getDate() - daysBack);
    const sinceISO = since.toISOString();

    console.log(`   Analyzing commits since: ${sinceISO.split('T')[0]}`);

    // Get all repos user has access to
    const repos = await this.fetchAllAccessibleRepos();
    console.log(`   Found ${repos.length} accessible repositories`);

    const repoBreakdown: DetailedRepoContribution[] = [];
    let totalCommits = 0;
    let privateRepoCommits = 0;
    let orgRepoCommits = 0;
    let publicRepoCommits = 0;

    // Analyze each repo
    for (const repo of repos) {
      try {
        const commits = await this.getCommitCountForRepo(
          repo.owner.login,
          repo.name,
          sinceISO,
        );

        if (commits > 0) {
          const isOrg = repo.owner.type === 'Organization';
          const isPrivate = repo.private;

          const contribution: DetailedRepoContribution = {
            repo: repo.name,
            owner: repo.owner.login,
            isPrivate,
            isOrg,
            commits,
            additions: 0, // Could fetch via detailed API if needed
            deletions: 0,
          };

          repoBreakdown.push(contribution);
          totalCommits += commits;

          if (isPrivate) privateRepoCommits += commits;
          if (isOrg) orgRepoCommits += commits;
          if (!isPrivate) publicRepoCommits += commits;

          const repoType = isPrivate ? '🔒 Private' : '🌐 Public';
          const ownerType = isOrg ? 'Org' : 'User';
          console.log(
            `   ${repoType} [${ownerType}] ${repo.owner.login}/${repo.name}: ${commits} commits`,
          );
        }
      } catch (error) {
        // Skip repos we can't access or analyze
        if (error instanceof Error && !error.message.includes('404')) {
          console.log(`   ⚠️  Could not analyze ${repo.full_name}`);
        }
      }
    }

    console.log(`\n   📊 Detailed Breakdown:`);
    console.log(`      Total Commits: ${totalCommits}`);
    console.log(`      Private Repos: ${privateRepoCommits}`);
    console.log(`      Org Repos: ${orgRepoCommits}`);
    console.log(`      Public Repos: ${publicRepoCommits}`);
    console.log(`      Repos with activity: ${repoBreakdown.length}\n`);

    return {
      totalCommitsAllRepos: totalCommits,
      privateRepoCommits,
      orgRepoCommits,
      publicRepoCommits,
      repoBreakdown: repoBreakdown.sort((a, b) => b.commits - a.commits),
    };
  }

  private async fetchAllAccessibleRepos(): Promise<OctokitRepository[]> {
    const allRepos: OctokitRepository[] = [];

    try {
      // 1. Get user's own repos (public + private)
      console.log('   Fetching user repos...');
      const userRepos = await this.octokit.paginate(
        this.octokit.repos.listForAuthenticatedUser,
        {
          per_page: 100,
          affiliation: 'owner,collaborator,organization_member',
          sort: 'updated',
        },
      );
      allRepos.push(...userRepos);
      console.log(`   - User repos: ${userRepos.length}`);

      // 2. Get organization repos (use authenticated endpoint to see private orgs)
      console.log(
        '   Fetching organization memberships (including private)...',
      );
      const orgs = await this.octokit.paginate(
        this.octokit.orgs.listForAuthenticatedUser,
        {
          per_page: 100,
        },
      );

      console.log(
        `   - Member of ${orgs.length} organizations (including private)`,
      );

      for (const org of orgs) {
        try {
          const orgRepos = await this.octokit.paginate(
            this.octokit.repos.listForOrg,
            {
              org: org.login,
              per_page: 100,
              type: 'all', // Include private repos
            },
          );
          console.log(`   - ${org.login}: ${orgRepos.length} repos`);
          allRepos.push(...orgRepos);
        } catch {
          // Might not have access to list all org repos
          console.log(`   - ${org.login}: Access limited`);
        }
      }
    } catch (err) {
      console.error('   Error fetching repos:', err);
    }

    // Deduplicate by full_name
    const uniqueRepos = Array.from(
      new Map(allRepos.map(repo => [repo.full_name, repo])).values(),
    );

    return uniqueRepos;
  }

  private async getCommitCountForRepo(
    owner: string,
    repo: string,
    since: string,
  ): Promise<number> {
    try {
      // Try to get commits by the user since the date
      const commits = await this.octokit.rest.repos.listCommits({
        owner,
        repo,
        author: this.username,
        since,
        per_page: 100,
      });

      // If there are 100 commits, there might be more - use pagination
      if (commits.data.length === 100) {
        const allCommits = await this.octokit.paginate(
          this.octokit.rest.repos.listCommits,
          {
            owner,
            repo,
            author: this.username,
            since,
            per_page: 100,
          },
        );
        return allCommits.length;
      }

      return commits.data.length;
    } catch {
      // Repo might be inaccessible or deleted
      return 0;
    }
  }

  async debugContributionSources(): Promise<void> {
    console.log('\n🔬 DEBUG: Analyzing contribution sources...\n');

    // Get current year contributions via GraphQL
    const today = new Date();
    const oneYearAgo = new Date(today);
    oneYearAgo.setDate(today.getDate() - 365);

    const query = `
      query($username: String!, $from: DateTime!, $to: DateTime!) {
        user(login: $username) {
          contributionsCollection(from: $from, to: $to) {
            totalCommitContributions
            totalIssueContributions
            totalPullRequestContributions
            totalPullRequestReviewContributions
            totalRepositoryContributions
            restrictedContributionsCount
            
            commitContributionsByRepository(maxRepositories: 100) {
              repository {
                name
                owner {
                  login
                }
                isPrivate
              }
              contributions {
                totalCount
              }
            }
            
            issueContributionsByRepository(maxRepositories: 100) {
              repository {
                name
                owner {
                  login
                }
                isPrivate
              }
              contributions {
                totalCount
              }
            }
            
            pullRequestContributionsByRepository(maxRepositories: 100) {
              repository {
                name
                owner {
                  login
                }
                isPrivate
              }
              contributions {
                totalCount
              }
            }
          }
        }
      }
    `;

    try {
      const result = (await this.graphqlWithAuth(query, {
        username: this.username,
        from: oneYearAgo.toISOString(),
        to: today.toISOString(),
      })) as GraphQLDetailedContributionsResponse;

      const collection = result.user.contributionsCollection;

      console.log('📊 GraphQL Contribution Collection:');
      console.log(
        `   Total Commit Contributions: ${collection.totalCommitContributions}`,
      );
      console.log(`   Total Issues: ${collection.totalIssueContributions}`);
      console.log(`   Total PRs: ${collection.totalPullRequestContributions}`);
      console.log(
        `   Total Reviews: ${collection.totalPullRequestReviewContributions}`,
      );
      console.log(
        `   Restricted (Private Org): ${collection.restrictedContributionsCount}`,
      );

      console.log('\n📦 Commits by Repository:');
      for (const item of collection.commitContributionsByRepository) {
        const privacy = item.repository.isPrivate ? '🔒 Private' : '🌐 Public';
        console.log(
          `   ${privacy} ${item.repository.owner.login}/${item.repository.name}: ${item.contributions.totalCount} commits`,
        );
      }

      if (collection.issueContributionsByRepository.length > 0) {
        console.log('\n🐛 Issues by Repository:');
        for (const item of collection.issueContributionsByRepository) {
          const privacy = item.repository.isPrivate
            ? '🔒 Private'
            : '🌐 Public';
          console.log(
            `   ${privacy} ${item.repository.owner.login}/${item.repository.name}: ${item.contributions.totalCount} issues`,
          );
        }
      }

      if (collection.pullRequestContributionsByRepository.length > 0) {
        console.log('\n🔀 Pull Requests by Repository:');
        for (const item of collection.pullRequestContributionsByRepository) {
          const privacy = item.repository.isPrivate
            ? '🔒 Private'
            : '🌐 Public';
          console.log(
            `   ${privacy} ${item.repository.owner.login}/${item.repository.name}: ${item.contributions.totalCount} PRs`,
          );
        }
      }

      // Calculate total from breakdown
      const totalFromBreakdown =
        collection.commitContributionsByRepository.reduce(
          (sum, item) => sum + item.contributions.totalCount,
          0,
        ) +
        collection.issueContributionsByRepository.reduce(
          (sum, item) => sum + item.contributions.totalCount,
          0,
        ) +
        collection.pullRequestContributionsByRepository.reduce(
          (sum, item) => sum + item.contributions.totalCount,
          0,
        ) +
        collection.restrictedContributionsCount;

      console.log(`\n🧮 Total from breakdown: ${totalFromBreakdown}`);
      console.log(
        `📈 Note: Restricted contributions (${collection.restrictedContributionsCount}) are from private org repos`,
      );
    } catch (err) {
      console.error('Error in debug query:', err);
    }
  }
}
