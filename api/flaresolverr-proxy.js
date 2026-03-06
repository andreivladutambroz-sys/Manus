/**
 * Vercel API Route: FlareSolverr Proxy
 * 
 * Forwards requests to FlareSolverr running on Vercel
 * Bypasses Cloudflare for real data collection
 * 
 * Usage: POST /api/flaresolverr-proxy
 * Body: { cmd, url, maxTimeout, ... }
 */

import axios from 'axios';

// FlareSolverr endpoint (can be external or self-hosted)
const FLARESOLVERR_URL = process.env.FLARESOLVERR_URL || 'http://localhost:8191/v1';

export default async function handler(req, res) {
  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { cmd, url, maxTimeout = 60000 } = req.body;

    // Validate input
    if (!cmd || !url) {
      return res.status(400).json({ error: 'Missing cmd or url parameter' });
    }

    console.log(`[FlareSolverr Proxy] ${cmd} - ${url}`);

    // Forward to FlareSolverr
    const response = await axios.post(FLARESOLVERR_URL, {
      cmd,
      url,
      maxTimeout,
      ...req.body
    }, {
      timeout: maxTimeout + 5000,
      headers: {
        'Content-Type': 'application/json'
      }
    });

    // Return result
    return res.status(200).json(response.data);

  } catch (error) {
    console.error('[FlareSolverr Proxy] Error:', error.message);

    return res.status(500).json({
      success: false,
      error: error.message,
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
}
