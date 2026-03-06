/**
 * EXPANDED SOURCE LIST - 35 NEW SOURCES
 * 
 * Categories:
 * - Automotive Forums (15)
 * - Reddit Subreddits (6)
 * - OBD/DTC Databases (8)
 * - Automotive Tech Blogs (5)
 * - YouTube Channels (1)
 */

export interface SourceConfig {
  domain: string;
  category: 'forum' | 'reddit' | 'obd' | 'blog' | 'youtube';
  urls: string[];
  priority: 'P0' | 'P1' | 'P2';
  rate_limit_ms: number;
  parse_strategy: 'html' | 'json' | 'api';
}

export const EXPANDED_SOURCES: SourceConfig[] = [
  // AUTOMOTIVE FORUMS (15)
  {
    domain: 'bimmerfest.com',
    category: 'forum',
    urls: [
      'https://www.bimmerfest.com/forums/forumdisplay.php?f=1',
      'https://www.bimmerfest.com/forums/forumdisplay.php?f=2',
      'https://www.bimmerfest.com/forums/forumdisplay.php?f=3'
    ],
    priority: 'P0',
    rate_limit_ms: 3000,
    parse_strategy: 'html'
  },
  {
    domain: 'e90post.com',
    category: 'forum',
    urls: [
      'https://www.e90post.com/forums/forumdisplay.php?f=1',
      'https://www.e90post.com/forums/forumdisplay.php?f=2'
    ],
    priority: 'P0',
    rate_limit_ms: 3000,
    parse_strategy: 'html'
  },
  {
    domain: 'e46fanatics.com',
    category: 'forum',
    urls: [
      'https://www.e46fanatics.com/forum/forumdisplay.php?f=1',
      'https://www.e46fanatics.com/forum/forumdisplay.php?f=2'
    ],
    priority: 'P0',
    rate_limit_ms: 3000,
    parse_strategy: 'html'
  },
  {
    domain: 'audizine.com',
    category: 'forum',
    urls: [
      'https://www.audizine.com/forum/forumdisplay.php?f=1',
      'https://www.audizine.com/forum/forumdisplay.php?f=2'
    ],
    priority: 'P0',
    rate_limit_ms: 3000,
    parse_strategy: 'html'
  },
  {
    domain: 'vwvortex.com',
    category: 'forum',
    urls: [
      'https://www.vwvortex.com/forum/forumdisplay.php?f=1',
      'https://www.vwvortex.com/forum/forumdisplay.php?f=2'
    ],
    priority: 'P0',
    rate_limit_ms: 3000,
    parse_strategy: 'html'
  },
  {
    domain: 'clublexus.com',
    category: 'forum',
    urls: [
      'https://www.clublexus.com/forums/lexus-models-1-5-generation/topics/',
      'https://www.clublexus.com/forums/lexus-models-2-3-generation/topics/'
    ],
    priority: 'P1',
    rate_limit_ms: 3000,
    parse_strategy: 'html'
  },
  {
    domain: 'mbworld.org',
    category: 'forum',
    urls: [
      'https://mbworld.org/forums/c-class-w204/',
      'https://mbworld.org/forums/e-class-w212/'
    ],
    priority: 'P1',
    rate_limit_ms: 3000,
    parse_strategy: 'html'
  },
  {
    domain: 'benzworld.org',
    category: 'forum',
    urls: [
      'https://benzworld.org/forums/c-class/',
      'https://benzworld.org/forums/e-class/'
    ],
    priority: 'P1',
    rate_limit_ms: 3000,
    parse_strategy: 'html'
  },
  {
    domain: 'toyotanation.com',
    category: 'forum',
    urls: [
      'https://www.toyotanation.com/forum/forums/camry-solara-forum.7/',
      'https://www.toyotanation.com/forum/forums/corolla-matrix-forum.5/'
    ],
    priority: 'P1',
    rate_limit_ms: 3000,
    parse_strategy: 'html'
  },
  {
    domain: 'honda-tech.com',
    category: 'forum',
    urls: [
      'https://www.honda-tech.com/forums/civic-forum-1/',
      'https://www.honda-tech.com/forums/accord-forum-2/'
    ],
    priority: 'P1',
    rate_limit_ms: 3000,
    parse_strategy: 'html'
  },
  {
    domain: 'focusfanatics.com',
    category: 'forum',
    urls: [
      'https://www.focusfanatics.com/forum/ford-focus-general-discussion/',
      'https://www.focusfanatics.com/forum/ford-focus-mk3-2012-2018/'
    ],
    priority: 'P1',
    rate_limit_ms: 3000,
    parse_strategy: 'html'
  },
  {
    domain: 'f150forum.com',
    category: 'forum',
    urls: [
      'https://www.f150forum.com/f118/general-f-150-discussion/',
      'https://www.f150forum.com/f119/13th-generation-f-150-2015-2020/'
    ],
    priority: 'P2',
    rate_limit_ms: 3000,
    parse_strategy: 'html'
  },
  {
    domain: 'subaruforester.org',
    category: 'forum',
    urls: [
      'https://subaruforester.org/vbulletin/forumdisplay.php?f=1',
      'https://subaruforester.org/vbulletin/forumdisplay.php?f=2'
    ],
    priority: 'P2',
    rate_limit_ms: 3000,
    parse_strategy: 'html'
  },
  {
    domain: 'wrxforums.com',
    category: 'forum',
    urls: [
      'https://www.wrxforums.com/forums/general-discussion/',
      'https://www.wrxforums.com/forums/sti-discussion/'
    ],
    priority: 'P2',
    rate_limit_ms: 3000,
    parse_strategy: 'html'
  },
  {
    domain: 'teslamotorsclub.com',
    category: 'forum',
    urls: [
      'https://teslamotorsclub.com/tmc-forums/forums/model-3.41/',
      'https://teslamotorsclub.com/tmc-forums/forums/model-y.57/'
    ],
    priority: 'P2',
    rate_limit_ms: 3000,
    parse_strategy: 'html'
  },

  // REDDIT SUBREDDITS (6)
  {
    domain: 'reddit.com/r/MechanicAdvice',
    category: 'reddit',
    urls: ['https://www.reddit.com/r/MechanicAdvice/'],
    priority: 'P0',
    rate_limit_ms: 2000,
    parse_strategy: 'json'
  },
  {
    domain: 'reddit.com/r/Cartalk',
    category: 'reddit',
    urls: ['https://www.reddit.com/r/Cartalk/'],
    priority: 'P0',
    rate_limit_ms: 2000,
    parse_strategy: 'json'
  },
  {
    domain: 'reddit.com/r/AskMechanics',
    category: 'reddit',
    urls: ['https://www.reddit.com/r/AskMechanics/'],
    priority: 'P1',
    rate_limit_ms: 2000,
    parse_strategy: 'json'
  },
  {
    domain: 'reddit.com/r/Justrolledintotheshop',
    category: 'reddit',
    urls: ['https://www.reddit.com/r/Justrolledintotheshop/'],
    priority: 'P1',
    rate_limit_ms: 2000,
    parse_strategy: 'json'
  },
  {
    domain: 'reddit.com/r/CarRepair',
    category: 'reddit',
    urls: ['https://www.reddit.com/r/CarRepair/'],
    priority: 'P1',
    rate_limit_ms: 2000,
    parse_strategy: 'json'
  },
  {
    domain: 'reddit.com/r/AutoMechanics',
    category: 'reddit',
    urls: ['https://www.reddit.com/r/AutoMechanics/'],
    priority: 'P2',
    rate_limit_ms: 2000,
    parse_strategy: 'json'
  },

  // OBD / DTC DATABASES (8)
  {
    domain: 'youcanic.com',
    category: 'obd',
    urls: [
      'https://www.youcanic.com/guides',
      'https://www.youcanic.com/article'
    ],
    priority: 'P0',
    rate_limit_ms: 3000,
    parse_strategy: 'html'
  },
  {
    domain: 'repairpal.com',
    category: 'obd',
    urls: [
      'https://www.repairpal.com/estimator',
      'https://www.repairpal.com/guides'
    ],
    priority: 'P0',
    rate_limit_ms: 3000,
    parse_strategy: 'html'
  },
  {
    domain: 'autozone.com',
    category: 'obd',
    urls: [
      'https://www.autozone.com/repairguide/search',
      'https://www.autozone.com/diy'
    ],
    priority: 'P0',
    rate_limit_ms: 3000,
    parse_strategy: 'html'
  },
  {
    domain: 'obd-codes.com',
    category: 'obd',
    urls: [
      'https://www.obd-codes.com/trouble_codes',
      'https://www.obd-codes.com/p0xxx'
    ],
    priority: 'P1',
    rate_limit_ms: 3000,
    parse_strategy: 'html'
  },
  {
    domain: 'engine-codes.com',
    category: 'obd',
    urls: [
      'https://www.engine-codes.com/p0xxx',
      'https://www.engine-codes.com/u0xxx'
    ],
    priority: 'P1',
    rate_limit_ms: 3000,
    parse_strategy: 'html'
  },
  {
    domain: 'troublecodes.net',
    category: 'obd',
    urls: [
      'https://troublecodes.net/p0xxx',
      'https://troublecodes.net/u0xxx'
    ],
    priority: 'P1',
    rate_limit_ms: 3000,
    parse_strategy: 'html'
  },
  {
    domain: 'dtcdecode.com',
    category: 'obd',
    urls: [
      'https://www.dtcdecode.com/p0xxx',
      'https://www.dtcdecode.com/b0xxx'
    ],
    priority: 'P2',
    rate_limit_ms: 3000,
    parse_strategy: 'html'
  },
  {
    domain: 'obd2codes.net',
    category: 'obd',
    urls: [
      'https://www.obd2codes.net/trouble-codes',
      'https://www.obd2codes.net/dtc'
    ],
    priority: 'P2',
    rate_limit_ms: 3000,
    parse_strategy: 'html'
  },

  // AUTOMOTIVE TECH BLOGS (5)
  {
    domain: 'ericthecarguy.com',
    category: 'blog',
    urls: [
      'https://www.ericthecarguy.com/videos',
      'https://www.ericthecarguy.com/blog'
    ],
    priority: 'P1',
    rate_limit_ms: 3000,
    parse_strategy: 'html'
  },
  {
    domain: 'humblemechanic.com',
    category: 'blog',
    urls: [
      'https://www.humblemechanic.com/blog',
      'https://www.humblemechanic.com/videos'
    ],
    priority: 'P1',
    rate_limit_ms: 3000,
    parse_strategy: 'html'
  },
  {
    domain: 'carcarekiosk.com',
    category: 'blog',
    urls: [
      'https://www.carcarekiosk.com/blog',
      'https://www.carcarekiosk.com/guides'
    ],
    priority: 'P1',
    rate_limit_ms: 3000,
    parse_strategy: 'html'
  },
  {
    domain: 'haynes.com/blog',
    category: 'blog',
    urls: [
      'https://www.haynes.com/en-US/blog',
      'https://www.haynes.com/en-US/diy-guides'
    ],
    priority: 'P1',
    rate_limit_ms: 3000,
    parse_strategy: 'html'
  },
  {
    domain: 'youcanic.com/blog',
    category: 'blog',
    urls: [
      'https://www.youcanic.com/blog',
      'https://www.youcanic.com/article'
    ],
    priority: 'P0',
    rate_limit_ms: 3000,
    parse_strategy: 'html'
  }
];

/**
 * Get sources by priority
 */
export function getSourcesByPriority(priority: 'P0' | 'P1' | 'P2'): SourceConfig[] {
  return EXPANDED_SOURCES.filter(s => s.priority === priority);
}

/**
 * Get sources by category
 */
export function getSourcesByCategory(category: string): SourceConfig[] {
  return EXPANDED_SOURCES.filter(s => s.category === category);
}

/**
 * Get all P0 + P1 sources (high priority)
 */
export function getHighPrioritySources(): SourceConfig[] {
  return EXPANDED_SOURCES.filter(s => s.priority === 'P0' || s.priority === 'P1');
}

/**
 * Statistics
 */
export function getSourceStats() {
  return {
    total: EXPANDED_SOURCES.length,
    by_category: {
      forum: EXPANDED_SOURCES.filter(s => s.category === 'forum').length,
      reddit: EXPANDED_SOURCES.filter(s => s.category === 'reddit').length,
      obd: EXPANDED_SOURCES.filter(s => s.category === 'obd').length,
      blog: EXPANDED_SOURCES.filter(s => s.category === 'blog').length
    },
    by_priority: {
      P0: EXPANDED_SOURCES.filter(s => s.priority === 'P0').length,
      P1: EXPANDED_SOURCES.filter(s => s.priority === 'P1').length,
      P2: EXPANDED_SOURCES.filter(s => s.priority === 'P2').length
    }
  };
}

export default EXPANDED_SOURCES;
