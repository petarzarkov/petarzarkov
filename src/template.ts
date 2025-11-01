import type { GitHubStats } from './types.js';

export function injectStatsIntoReadme(readmeContent: string): string {
  const statsSection = `<!-- STATS:START -->
<p>
  <img src="generated/stats-overview.svg" alt="GitHub Stats" width="100%" />
</p>

<p>
  <img src="generated/languages-activity.svg" alt="Languages and Activity" width="100%" />
</p>
<!-- STATS:END -->`;

  // Add peepoHey after "Hi" in the title
  const updatedContent = readmeContent.replace(
    /(<h1[^>]*>Hi),\s*(I'm Petar Zarkov<\/h1>)/i,
    `$1 <img src="public/webp/peepoHey.webp" alt="Hi" width="30" height="30" />, $2`,
  );

  // Check if markers exist
  const startMarker = '<!-- STATS:START -->';
  const endMarker = '<!-- STATS:END -->';

  if (
    updatedContent.includes(startMarker) &&
    updatedContent.includes(endMarker)
  ) {
    // Replace content between markers
    const startIndex = updatedContent.indexOf(startMarker);
    const endIndex = updatedContent.indexOf(endMarker) + endMarker.length;

    return (
      updatedContent.substring(0, startIndex) +
      statsSection +
      updatedContent.substring(endIndex)
    );
  } else {
    // Find the stats section and add markers
    const statsHeaderRegex = /<h3[^>]*>.*GitHub Stats.*<\/h3>/i;
    const match = updatedContent.match(statsHeaderRegex);

    if (match) {
      const headerIndex = updatedContent.indexOf(match[0]);
      const headerEnd = headerIndex + match[0].length;

      // Find the next h3 tag or end of file
      const nextH3Index = updatedContent.indexOf('<h3', headerEnd);
      const sectionEnd = nextH3Index > 0 ? nextH3Index : updatedContent.length;

      return (
        updatedContent.substring(0, headerEnd) +
        '\n\n' +
        statsSection +
        '\n\n' +
        updatedContent.substring(sectionEnd)
      );
    }
  }

  return updatedContent;
}

export function generateIndexHTML(
  readmeContent: string,
  stats: GitHubStats,
): string {
  // Extract sections from README
  const titleMatch = readmeContent.match(/<h1[^>]*>(.*?)<\/h1>/);
  const title = titleMatch
    ? titleMatch[1].replace(/<[^>]*>/g, '').trim()
    : 'GitHub Profile';

  const aboutMatch = readmeContent.match(
    /<h3>⚡ About Me<\/h3>([\s\S]*?)(?=<h3|$)/,
  );
  const aboutContent = aboutMatch ? aboutMatch[1].trim() : '';

  const connectMatch = readmeContent.match(
    /<h3[^>]*>📬 Connect with Me:<\/h3>([\s\S]*?)(?=<h3|$)/,
  );
  const connectContent = connectMatch ? connectMatch[1].trim() : '';

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta name="description" content="GitHub profile and statistics for Petar Zarkov">
  <link rel="icon" type="image/x-icon" href="https://avatars.githubusercontent.com/u/${stats.userId}?v=4">
  <title>${title}</title>
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Noto Sans', Helvetica, Arial, sans-serif;
      background-color: #0d1117;
      color: #c9d1d9;
      line-height: 1.6;
      padding: 20px;
    }
    
    .container {
      max-width: 1200px;
      margin: 0 auto;
    }
    
    header {
      text-align: center;
      padding: 40px 0;
      border-bottom: 1px solid #30363d;
      margin-bottom: 40px;
    }
    
    h1 {
      font-size: 2.5em;
      margin-bottom: 10px;
      color: #58a6ff;
    }
    
    h2 {
      font-size: 1.8em;
      margin: 30px 0 20px 0;
      color: #c9d1d9;
    }
    
    h3 {
      font-size: 1.4em;
      margin: 25px 0 15px 0;
      color: #c9d1d9;
    }
    
    .subtitle {
      font-size: 1.2em;
      color: #8b949e;
    }
    
    .section {
      margin: 40px 0;
      padding: 30px;
      background-color: #161b22;
      border: 1px solid #30363d;
      border-radius: 6px;
    }
    
    .stats-container {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 20px;
      margin: 30px 0;
    }
    
    .stats-container img {
      width: 100%;
      max-width: 800px;
      border-radius: 6px;
    }
    
    .about ul {
      list-style: none;
      padding-left: 0;
    }
    
    .about li {
      padding: 10px 0;
      border-bottom: 1px solid #30363d;
    }
    
    .about li:last-child {
      border-bottom: none;
    }
    
    .connect {
      display: flex;
      justify-content: center;
      gap: 15px;
      flex-wrap: wrap;
      margin-top: 20px;
    }
    
    .connect a {
      display: inline-flex;
      align-items: center;
      transition: transform 0.2s;
    }
    
    .connect a:hover {
      transform: scale(1.1);
    }
    
    .connect img {
      height: 40px;
    }
    
    a {
      color: #58a6ff;
      text-decoration: none;
    }
    
    a:hover {
      text-decoration: underline;
    }
    
    footer {
      text-align: center;
      padding: 40px 0;
      margin-top: 60px;
      border-top: 1px solid #30363d;
      color: #8b949e;
      font-size: 0.9em;
    }
    
    .updated {
      text-align: center;
      color: #8b949e;
      font-size: 0.9em;
      margin: 20px 0;
    }
    
    @media (max-width: 768px) {
      h1 {
        font-size: 2em;
      }
      
      .section {
        padding: 20px;
      }
      
      .stats-container img {
        width: 100%;
      }
    }
  </style>
</head>
<body>
  <div class="container">
    <header>
      <h1>Hi <img src="public/webp/peepoHey.webp" alt="Hi" width="30" height="30" style="vertical-align: middle;" />, I'm Petar Zarkov</h1>
      <p class="subtitle">A passionate software developer from Bulgaria</p>
    </header>
    
    <main>
      ${
        aboutContent
          ? `
      <section class="section about">
        <h2>⚡ About Me</h2>
        ${aboutContent}
      </section>
      `
          : ''
      }
      
      ${
        connectContent
          ? `
      <section class="section">
        <h2>📬 Connect with Me</h2>
        <div class="connect">
          ${connectContent}
        </div>
      </section>
      `
          : ''
      }
      
      <section class="section">
        <h2>📊 GitHub Statistics</h2>
        <p class="updated">Last updated: ${new Date().toLocaleString('en-US', {
          dateStyle: 'long',
          timeStyle: 'short',
          timeZone: 'UTC',
        })} UTC</p>
        <div class="stats-container">
          <img src="generated/stats-overview.svg" alt="GitHub Statistics Overview" />
          <img src="generated/languages-activity.svg" alt="Top Languages and Contribution Activity" />
        </div>
      </section>
    </main>
    
    <footer>
      <p>© ${new Date().getFullYear()} Petar Zarkov. Auto-generated with ❤️ using TypeScript & GitHub Actions.</p>
    </footer>
  </div>
</body>
</html>`;
}
