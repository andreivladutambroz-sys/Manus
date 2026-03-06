import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { Award, Trophy, Star, Zap, Target, TrendingUp } from 'lucide-react';

interface UserCertification {
  userId: string;
  username: string;
  avatar: string;
  level: 'Apprentice' | 'Technician' | 'Master' | 'Expert';
  points: number;
  badges: Badge[];
  repairsLogged: number;
  communityPosts: number;
  helpfulVotes: number;
  rank: number;
}

interface Badge {
  id: string;
  name: string;
  description: string;
  icon: string;
  earnedAt: Date;
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
}

const LEVELS = {
  Apprentice: { minPoints: 0, maxPoints: 500, color: 'bg-gray-500' },
  Technician: { minPoints: 500, maxPoints: 2000, color: 'bg-blue-500' },
  Master: { minPoints: 2000, maxPoints: 5000, color: 'bg-purple-500' },
  Expert: { minPoints: 5000, maxPoints: 10000, color: 'bg-gold-500' }
};

const AVAILABLE_BADGES = [
  {
    id: 'first-repair',
    name: 'First Repair',
    description: 'Log your first repair',
    icon: '🔧',
    rarity: 'common' as const
  },
  {
    id: 'diagnostic-master',
    name: 'Diagnostic Master',
    description: 'Complete 50 diagnostic searches',
    icon: '🔍',
    rarity: 'rare' as const
  },
  {
    id: 'community-helper',
    name: 'Community Helper',
    description: 'Get 100 helpful votes on posts',
    icon: '🤝',
    rarity: 'epic' as const
  },
  {
    id: 'speed-demon',
    name: 'Speed Demon',
    description: 'Complete 10 repairs in one day',
    icon: '⚡',
    rarity: 'epic' as const
  },
  {
    id: 'knowledge-seeker',
    name: 'Knowledge Seeker',
    description: 'Create 50 community posts',
    icon: '📚',
    rarity: 'rare' as const
  },
  {
    id: 'master-mechanic',
    name: 'Master Mechanic',
    description: 'Reach Master level',
    icon: '👑',
    rarity: 'legendary' as const
  }
];

const MOCK_USER: UserCertification = {
  userId: 'user-1',
  username: 'John Mechanic',
  avatar: 'JM',
  level: 'Technician',
  points: 1250,
  badges: [
    {
      id: 'first-repair',
      name: 'First Repair',
      description: 'Log your first repair',
      icon: '🔧',
      earnedAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
      rarity: 'common'
    },
    {
      id: 'diagnostic-master',
      name: 'Diagnostic Master',
      description: 'Complete 50 diagnostic searches',
      icon: '🔍',
      earnedAt: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000),
      rarity: 'rare'
    }
  ],
  repairsLogged: 47,
  communityPosts: 12,
  helpfulVotes: 89,
  rank: 5
};

const MOCK_LEADERBOARD: UserCertification[] = [
  {
    userId: 'user-2',
    username: 'Sarah Expert',
    avatar: 'SE',
    level: 'Expert',
    points: 8750,
    badges: [],
    repairsLogged: 342,
    communityPosts: 156,
    helpfulVotes: 2341,
    rank: 1
  },
  {
    userId: 'user-3',
    username: 'Mike Master',
    avatar: 'MM',
    level: 'Master',
    points: 4200,
    badges: [],
    repairsLogged: 189,
    communityPosts: 78,
    helpfulVotes: 1203,
    rank: 2
  },
  {
    userId: 'user-4',
    username: 'Lisa Tech',
    avatar: 'LT',
    level: 'Technician',
    points: 1890,
    badges: [],
    repairsLogged: 92,
    communityPosts: 34,
    helpfulVotes: 456,
    rank: 3
  },
  {
    userId: 'user-1',
    username: 'John Mechanic',
    avatar: 'JM',
    level: 'Technician',
    points: 1250,
    badges: [],
    repairsLogged: 47,
    communityPosts: 12,
    helpfulVotes: 89,
    rank: 5
  }
];

const getRarityColor = (rarity: string) => {
  switch (rarity) {
    case 'common':
      return 'bg-gray-500';
    case 'rare':
      return 'bg-blue-500';
    case 'epic':
      return 'bg-purple-500';
    case 'legendary':
      return 'bg-yellow-500';
    default:
      return 'bg-gray-500';
  }
};

export function CertificationProgram() {
  const [user] = useState<UserCertification>(MOCK_USER);
  const [leaderboard] = useState<UserCertification[]>(MOCK_LEADERBOARD);

  const levelProgress = {
    Apprentice: 100,
    Technician: (user.points - LEVELS.Technician.minPoints) / (LEVELS.Technician.maxPoints - LEVELS.Technician.minPoints) * 100,
    Master: 0,
    Expert: 0
  };

  const currentLevelProgress = levelProgress[user.level];
  const nextLevelPoints = LEVELS[user.level].maxPoints;
  const pointsToNextLevel = nextLevelPoints - user.points;

  return (
    <div className="min-h-screen bg-background p-4 space-y-6">
      {/* Header */}
      <div className="space-y-2">
        <h1 className="text-3xl font-bold text-foreground">Certification Program</h1>
        <p className="text-muted-foreground">Earn badges, climb the leaderboard, and become a certified mechanic</p>
      </div>

      {/* User Profile Card */}
      <Card className="p-6 bg-gradient-to-r from-blue-500/10 to-purple-500/10 border-blue-500/20">
        <div className="space-y-4">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-full bg-blue-500 flex items-center justify-center text-white font-bold text-xl">
                {user.avatar}
              </div>
              <div>
                <h2 className="text-2xl font-bold text-foreground">{user.username}</h2>
                <p className="text-lg text-muted-foreground">{user.level}</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-sm text-muted-foreground">Rank</p>
              <p className="text-3xl font-bold text-foreground">#{user.rank}</p>
            </div>
          </div>

          {/* Points & Level Progress */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium text-foreground">{user.points} / {nextLevelPoints} points</p>
              <p className="text-sm text-muted-foreground">{pointsToNextLevel} to next level</p>
            </div>
            <Progress value={currentLevelProgress} className="h-3" />
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-4">
            <div className="text-center">
              <p className="text-2xl font-bold text-foreground">{user.repairsLogged}</p>
              <p className="text-xs text-muted-foreground">Repairs Logged</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-foreground">{user.communityPosts}</p>
              <p className="text-xs text-muted-foreground">Posts Created</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-foreground">{user.helpfulVotes}</p>
              <p className="text-xs text-muted-foreground">Helpful Votes</p>
            </div>
          </div>
        </div>
      </Card>

      {/* Tabs */}
      <Tabs defaultValue="badges" className="space-y-4">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="badges">Badges ({user.badges.length})</TabsTrigger>
          <TabsTrigger value="available">Available</TabsTrigger>
          <TabsTrigger value="leaderboard">Leaderboard</TabsTrigger>
        </TabsList>

        {/* Earned Badges */}
        <TabsContent value="badges" className="space-y-3">
          {user.badges.length === 0 ? (
            <Card className="p-6 text-center">
              <Award className="h-12 w-12 text-muted-foreground mx-auto mb-3 opacity-50" />
              <p className="text-muted-foreground">No badges earned yet. Start logging repairs!</p>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {user.badges.map(badge => (
                <Card key={badge.id} className="p-4">
                  <div className="flex items-start gap-3">
                    <div className="text-4xl">{badge.icon}</div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-foreground">{badge.name}</h3>
                      <p className="text-sm text-muted-foreground">{badge.description}</p>
                      <div className="flex items-center justify-between mt-2">
                        <Badge className={getRarityColor(badge.rarity)}>
                          {badge.rarity}
                        </Badge>
                        <p className="text-xs text-muted-foreground">
                          {badge.earnedAt.toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        {/* Available Badges */}
        <TabsContent value="available" className="space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {AVAILABLE_BADGES.map(badge => {
              const earned = user.badges.some(b => b.id === badge.id);
              return (
                <Card key={badge.id} className={`p-4 ${earned ? 'opacity-50' : ''}`}>
                  <div className="flex items-start gap-3">
                    <div className="text-4xl">{badge.icon}</div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-foreground">{badge.name}</h3>
                      <p className="text-sm text-muted-foreground">{badge.description}</p>
                      <div className="flex items-center justify-between mt-2">
                        <Badge className={getRarityColor(badge.rarity)}>
                          {badge.rarity}
                        </Badge>
                        {earned && (
                          <Badge variant="secondary">Earned</Badge>
                        )}
                      </div>
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        </TabsContent>

        {/* Leaderboard */}
        <TabsContent value="leaderboard" className="space-y-3">
          {leaderboard.map((player, index) => (
            <Card
              key={player.userId}
              className={`p-4 ${player.userId === user.userId ? 'border-blue-500/50 bg-blue-500/5' : ''}`}
            >
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-3 flex-1">
                  <div className="w-12 h-12 rounded-full bg-gray-500 flex items-center justify-center text-white font-bold">
                    {player.avatar}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="font-semibold text-foreground">{player.username}</p>
                      {index === 0 && <Trophy className="h-4 w-4 text-yellow-500" />}
                      {index === 1 && <Trophy className="h-4 w-4 text-gray-400" />}
                      {index === 2 && <Trophy className="h-4 w-4 text-orange-400" />}
                    </div>
                    <p className="text-sm text-muted-foreground">{player.level}</p>
                  </div>
                </div>

                <div className="text-right">
                  <p className="text-lg font-bold text-foreground">#{player.rank}</p>
                  <p className="text-sm text-muted-foreground">{player.points} pts</p>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2 mt-3 text-xs text-muted-foreground">
                <div className="flex items-center gap-1">
                  <Zap className="h-3 w-3" />
                  {player.repairsLogged} repairs
                </div>
                <div className="flex items-center gap-1">
                  <Star className="h-3 w-3" />
                  {player.communityPosts} posts
                </div>
                <div className="flex items-center gap-1">
                  <TrendingUp className="h-3 w-3" />
                  {player.helpfulVotes} votes
                </div>
              </div>
            </Card>
          ))}
        </TabsContent>
      </Tabs>
    </div>
  );
}
