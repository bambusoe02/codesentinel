import { Octokit } from '@octokit/rest';
import { graphql } from '@octokit/graphql';

// Types
export interface GitHubRepository {
  id: number;
  name: string;
  full_name: string;
  owner: {
    login: string;
    avatar_url: string;
  };
  description: string | null;
  html_url: string;
  language: string | null;
  stargazers_count: number;
  forks_count: number;
  open_issues_count: number;
  private: boolean;
  updated_at: string | null;
  created_at: string | null;
}

export interface GitHubFile {
  name: string;
  path: string;
  type: 'file' | 'dir';
  size: number;
  download_url: string | null;
  content?: string;
}

export interface GitHubCommit {
  sha: string;
  commit: {
    message: string;
    author: {
      name?: string;
      email?: string;
      date?: string;
    } | null;
  };
  author: {
    login: string;
    avatar_url: string;
  } | null;
}

export interface GitHubLanguageStats {
  [language: string]: number;
}

export interface GitHubRepoStats {
  linesOfCode: number;
  filesCount: number;
  languages: GitHubLanguageStats;
  contributors: number;
  lastCommit: string;
  commitFrequency: number;
}

// GitHub API Client Class
export class GitHubClient {
  private octokit: Octokit;
  private graphqlClient: typeof graphql;

  constructor(accessToken?: string) {
    const token = accessToken || process.env.GITHUB_TOKEN;

    if (!token) {
      throw new Error('GitHub token is required');
    }

    this.octokit = new Octokit({
      auth: token,
      userAgent: 'CodeSentinel/1.0.0',
    });

    this.graphqlClient = graphql.defaults({
      headers: {
        authorization: `token ${token}`,
      },
    });
  }

  // Get user repositories
  async getUserRepositories(username?: string): Promise<GitHubRepository[]> {
    try {
      const response = await this.octokit.repos.listForAuthenticatedUser({
        sort: 'updated',
        per_page: 100,
        type: 'owner',
      });

      return response.data as GitHubRepository[];
    } catch (error) {
      console.error('Error fetching repositories:', error);
      throw new Error('Failed to fetch repositories');
    }
  }

  // Get repository details
  async getRepository(owner: string, repo: string): Promise<GitHubRepository> {
    try {
      const response = await this.octokit.repos.get({
        owner,
        repo,
      });

      return response.data;
    } catch (error) {
      console.error('Error fetching repository:', error);
      throw new Error('Failed to fetch repository details');
    }
  }

  // Get repository contents
  async getRepositoryContents(
    owner: string,
    repo: string,
    path = ''
  ): Promise<GitHubFile[]> {
    try {
      const response = await this.octokit.repos.getContent({
        owner,
        repo,
        path,
      });

      // Handle both single file and directory responses
      const data = Array.isArray(response.data) ? response.data : [response.data];

      return data.map((item: any) => ({
        name: item.name,
        path: item.path,
        type: item.type,
        size: item.size,
        download_url: item.download_url,
        content: item.content ? Buffer.from(item.content, 'base64').toString() : undefined,
      }));
    } catch (error) {
      console.error('Error fetching repository contents:', error);
      throw new Error('Failed to fetch repository contents');
    }
  }

  // Get repository commits
  async getRepositoryCommits(
    owner: string,
    repo: string,
    since?: string,
    until?: string,
    perPage = 100
  ): Promise<GitHubCommit[]> {
    try {
      const response = await this.octokit.repos.listCommits({
        owner,
        repo,
        since,
        until,
        per_page: perPage,
      });

      return response.data as GitHubCommit[];
    } catch (error) {
      console.error('Error fetching commits:', error);
      throw new Error('Failed to fetch repository commits');
    }
  }

  // Get repository languages
  async getRepositoryLanguages(owner: string, repo: string): Promise<GitHubLanguageStats> {
    try {
      const response = await this.octokit.repos.listLanguages({
        owner,
        repo,
      });

      return response.data;
    } catch (error) {
      console.error('Error fetching languages:', error);
      throw new Error('Failed to fetch repository languages');
    }
  }

  // Get repository contributors
  async getRepositoryContributors(owner: string, repo: string): Promise<any[]> {
    try {
      const response = await this.octokit.repos.listContributors({
        owner,
        repo,
        per_page: 100,
      });

      return response.data;
    } catch (error) {
      console.error('Error fetching contributors:', error);
      throw new Error('Failed to fetch repository contributors');
    }
  }

  // Calculate repository statistics
  async getRepositoryStats(owner: string, repo: string): Promise<GitHubRepoStats> {
    try {
      const [contents, commits, languages, contributors] = await Promise.all([
        this.getRepositoryContents(owner, repo),
        this.getRepositoryCommits(owner, repo, undefined, undefined, 30), // Last 30 commits
        this.getRepositoryLanguages(owner, repo),
        this.getRepositoryContributors(owner, repo),
      ]);

      // Calculate lines of code (rough estimate from file sizes)
      const linesOfCode = contents
        .filter(file => file.type === 'file' && file.size > 0)
        .reduce((total, file) => total + (file.size / 50), 0); // Rough estimation

      // Calculate commit frequency (commits per week over last 30 commits)
      const commitFrequency = commits.length > 0
        ? Math.round((commits.length / 4) * 7) // Assuming 4 weeks of history
        : 0;

      const lastCommit = commits[0]?.commit?.author?.date || new Date().toISOString();

      return {
        linesOfCode: Math.round(linesOfCode),
        filesCount: contents.filter(file => file.type === 'file').length,
        languages,
        contributors: contributors.length,
        lastCommit,
        commitFrequency,
      };
    } catch (error) {
      console.error('Error calculating repository stats:', error);
      throw new Error('Failed to calculate repository statistics');
    }
  }

  // Search repositories
  async searchRepositories(query: string, sort: 'stars' | 'forks' | 'updated' = 'updated'): Promise<GitHubRepository[]> {
    try {
      const response = await this.octokit.search.repos({
        q: query,
        sort,
        per_page: 50,
      });

      return response.data.items as GitHubRepository[];
    } catch (error) {
      console.error('Error searching repositories:', error);
      throw new Error('Failed to search repositories');
    }
  }

  // GraphQL query for advanced repository data
  async getRepositoryAdvanced(owner: string, repo: string) {
    const query = `
      query($owner: String!, $repo: String!) {
        repository(owner: $owner, name: $repo) {
          id
          name
          description
          primaryLanguage {
            name
          }
          languages(first: 10) {
            edges {
              node {
                name
                color
              }
              size
            }
          }
          defaultBranchRef {
            target {
              ... on Commit {
                history(first: 30) {
                  edges {
                    node {
                      committedDate
                      author {
                        user {
                          login
                        }
                      }
                    }
                  }
                }
              }
            }
          }
          issues(states: OPEN) {
            totalCount
          }
          pullRequests(states: OPEN) {
            totalCount
          }
          stargazers {
            totalCount
          }
          forks {
            totalCount
          }
        }
      }
    `;

    try {
      const response = await this.graphqlClient(query, {
        owner,
        repo,
      }) as any;

      return response.repository;
    } catch (error) {
      console.error('Error fetching advanced repository data:', error);
      throw new Error('Failed to fetch advanced repository data');
    }
  }
}

// Export singleton instance for server-side usage
export const githubClient = new GitHubClient();

// Factory function for client-side usage with user tokens
export const createGitHubClient = (accessToken: string) => {
  return new GitHubClient(accessToken);
};
