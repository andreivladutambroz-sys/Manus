/**
 * Embedded FlareSolverr Handler for Vercel
 * 
 * Provides Cloudflare bypass using axios + user-agent rotation
 * No external FlareSolverr needed!
 * 
 * Usage: POST /api/embedded-flaresolverr
 * Body: { cmd: "request.get", url: "https://...", maxTimeout: 30000 }
 */

import axios from 'axios';

// User agents for rotation
const USER_AGENTS = [
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:121.0) Gecko/20100101 Firefox/121.0',
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.1 Safari/605.1.15',
];

function getRandomUserAgent() {
  return USER_AGENTS[Math.floor(Math.random() * USER_AGENTS.length)];
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Bypass token
  const bypassToken = req.headers['x-bypass-token'];
  if (bypassToken !== 'swarm-bypass-token-2026') {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    const { cmd, url, maxTimeout = 30000 } = req.body;

    if (!cmd || !url) {
      return res.status(400).json({ error: 'Missing cmd or url' });
    }

    console.log(`[Embedded FlareSolverr] ${cmd} - ${url}`);

    // For request.get command
    if (cmd === 'request.get') {
      const response = await axios.get(url, {
        timeout: Math.min(maxTimeout, 30000),
        headers: {
          'User-Agent': getRandomUserAgent(),
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
          'Accept-Language': 'en-US,en;q=0.5',
          'Accept-Encoding': 'gzip, deflate',
          'DNT': '1',
          'Connection': 'keep-alive',
          'Upgrade-Insecure-Requests': '1',
        },
        validateStatus: () => true, // Accept all status codes
      });

      return res.status(200).json({
        success: true,
        solution: {
          url: response.config.url,
          status: response.status,
          response: response.data,
          headers: response.headers,
        },
      });
    }

    // For other commands
    return res.status(400).json({
      success: false,
      error: `Command '${cmd}' not supported in embedded mode`,
    });

  } catch (error) {
    console.error('[Embedded FlareSolverr] Error:', error.message);

    return res.status(500).json({
      success: false,
      error: error.message,
      solution: {
        url: req.body.url,
        status: 0,
        response: '',
      },
    });
  }
}
