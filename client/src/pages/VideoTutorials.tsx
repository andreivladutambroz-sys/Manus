import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Play, Clock, ThumbsUp, Eye, Search } from 'lucide-react';

interface Tutorial {
  id: string;
  title: string;
  channel: string;
  duration: number;
  views: number;
  likes: number;
  youtubeId: string;
  thumbnail: string;
  errorCodes: string[];
  repairType: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  uploadedAt: Date;
  description: string;
}

const MOCK_TUTORIALS: Tutorial[] = [
  {
    id: '1',
    title: 'How to Fix P0171 Code - Fuel System Too Lean',
    channel: 'ChrisFix',
    duration: 18,
    views: 245000,
    likes: 8900,
    youtubeId: 'dQw4w9WgXcQ',
    thumbnail: 'https://img.youtube.com/vi/dQw4w9WgXcQ/maxresdefault.jpg',
    errorCodes: ['P0171'],
    repairType: 'Fuel System',
    difficulty: 'intermediate',
    uploadedAt: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000),
    description: 'Complete guide to diagnosing and fixing the P0171 error code'
  },
  {
    id: '2',
    title: 'P0300 Random Misfire - Complete Diagnosis',
    channel: 'Auto Repair Guys',
    duration: 22,
    views: 189000,
    likes: 6200,
    youtubeId: 'jNQXAC9IVRw',
    thumbnail: 'https://img.youtube.com/vi/jNQXAC9IVRw/maxresdefault.jpg',
    errorCodes: ['P0300'],
    repairType: 'Engine Diagnostics',
    difficulty: 'advanced',
    uploadedAt: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000),
    description: 'Step-by-step guide to diagnosing P0300 misfire codes'
  },
  {
    id: '3',
    title: 'Oxygen Sensor Replacement - P0420 Fix',
    channel: 'Scotty Kilmer',
    duration: 15,
    views: 567000,
    likes: 12400,
    youtubeId: '9bZkp7q19f0',
    thumbnail: 'https://img.youtube.com/vi/9bZkp7q19f0/maxresdefault.jpg',
    errorCodes: ['P0420', 'P0430'],
    repairType: 'Emissions System',
    difficulty: 'beginner',
    uploadedAt: new Date(Date.now() - 45 * 24 * 60 * 60 * 1000),
    description: 'How to replace oxygen sensors and fix P0420 codes'
  },
  {
    id: '4',
    title: 'Spark Plug Replacement Guide',
    channel: 'ChrisFix',
    duration: 20,
    views: 432000,
    likes: 9800,
    youtubeId: 'FDJzJ1Vvs-s',
    thumbnail: 'https://img.youtube.com/vi/FDJzJ1Vvs-s/maxresdefault.jpg',
    errorCodes: ['P0300', 'P0301', 'P0302'],
    repairType: 'Engine Maintenance',
    difficulty: 'beginner',
    uploadedAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
    description: 'Complete guide to replacing spark plugs on any vehicle'
  }
];

export function VideoTutorials() {
  const [tutorials] = useState<Tutorial[]>(MOCK_TUTORIALS);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDifficulty, setSelectedDifficulty] = useState<'all' | 'beginner' | 'intermediate' | 'advanced'>('all');
  const [selectedTutorial, setSelectedTutorial] = useState<Tutorial | null>(null);

  const filteredTutorials = tutorials.filter(t => {
    const matchesSearch = t.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         t.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         t.errorCodes.some(code => code.includes(searchQuery.toUpperCase()));
    const matchesDifficulty = selectedDifficulty === 'all' || t.difficulty === selectedDifficulty;
    return matchesSearch && matchesDifficulty;
  });

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'beginner':
        return 'bg-green-500';
      case 'intermediate':
        return 'bg-yellow-500';
      case 'advanced':
        return 'bg-red-500';
      default:
        return 'bg-gray-500';
    }
  };

  return (
    <div className="min-h-screen bg-background p-4 space-y-6">
      {/* Header */}
      <div className="space-y-4">
        <div className="space-y-2">
          <h1 className="text-3xl font-bold text-foreground">Video Tutorials</h1>
          <p className="text-muted-foreground">Learn repair techniques from expert mechanics</p>
        </div>

        {/* Search */}
        <div className="flex gap-2">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search tutorials or error codes..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        {/* Difficulty Filter */}
        <div className="flex gap-2 overflow-x-auto pb-2">
          <button
            onClick={() => setSelectedDifficulty('all')}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              selectedDifficulty === 'all'
                ? 'bg-blue-500 text-white'
                : 'bg-muted text-foreground hover:bg-muted/80'
            }`}
          >
            All Levels
          </button>
          <button
            onClick={() => setSelectedDifficulty('beginner')}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              selectedDifficulty === 'beginner'
                ? 'bg-green-500 text-white'
                : 'bg-muted text-foreground hover:bg-muted/80'
            }`}
          >
            Beginner
          </button>
          <button
            onClick={() => setSelectedDifficulty('intermediate')}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              selectedDifficulty === 'intermediate'
                ? 'bg-yellow-500 text-white'
                : 'bg-muted text-foreground hover:bg-muted/80'
            }`}
          >
            Intermediate
          </button>
          <button
            onClick={() => setSelectedDifficulty('advanced')}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              selectedDifficulty === 'advanced'
                ? 'bg-red-500 text-white'
                : 'bg-muted text-foreground hover:bg-muted/80'
            }`}
          >
            Advanced
          </button>
        </div>
      </div>

      {/* Tutorials Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filteredTutorials.map(tutorial => (
          <Card
            key={tutorial.id}
            className="overflow-hidden hover:shadow-lg transition-shadow cursor-pointer"
            onClick={() => setSelectedTutorial(tutorial)}
          >
            {/* Thumbnail */}
            <div className="relative h-48 bg-black group">
              <img
                src={tutorial.thumbnail}
                alt={tutorial.title}
                className="w-full h-full object-cover group-hover:opacity-80 transition-opacity"
              />
              <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/50">
                <Play className="h-12 w-12 text-white" />
              </div>
              <div className="absolute bottom-2 right-2 bg-black/80 px-2 py-1 rounded text-xs text-white flex items-center gap-1">
                <Clock className="h-3 w-3" />
                {tutorial.duration}m
              </div>
            </div>

            {/* Content */}
            <div className="p-4 space-y-3">
              <div>
                <h3 className="font-semibold text-foreground line-clamp-2">{tutorial.title}</h3>
                <p className="text-sm text-muted-foreground mt-1">{tutorial.channel}</p>
              </div>

              {/* Error Codes */}
              <div className="flex gap-2 flex-wrap">
                {tutorial.errorCodes.map(code => (
                  <Badge key={code} variant="secondary" className="text-xs">
                    {code}
                  </Badge>
                ))}
              </div>

              {/* Difficulty & Type */}
              <div className="flex items-center justify-between">
                <Badge className={`${getDifficultyColor(tutorial.difficulty)} text-white`}>
                  {tutorial.difficulty}
                </Badge>
                <Badge variant="outline" className="text-xs">
                  {tutorial.repairType}
                </Badge>
              </div>

              {/* Stats */}
              <div className="flex gap-4 text-xs text-muted-foreground">
                <div className="flex items-center gap-1">
                  <Eye className="h-3 w-3" />
                  {(tutorial.views / 1000).toFixed(0)}K
                </div>
                <div className="flex items-center gap-1">
                  <ThumbsUp className="h-3 w-3" />
                  {(tutorial.likes / 1000).toFixed(1)}K
                </div>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Video Player Modal */}
      {selectedTutorial && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50">
          <Card className="w-full max-w-4xl overflow-hidden">
            {/* Video */}
            <div className="aspect-video bg-black">
              <iframe
                width="100%"
                height="100%"
                src={`https://www.youtube.com/embed/${selectedTutorial.youtubeId}`}
                title={selectedTutorial.title}
                frameBorder="0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            </div>

            {/* Info */}
            <div className="p-6 space-y-4">
              <div>
                <h2 className="text-2xl font-bold text-foreground">{selectedTutorial.title}</h2>
                <p className="text-muted-foreground mt-1">{selectedTutorial.channel}</p>
              </div>

              <p className="text-foreground">{selectedTutorial.description}</p>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Duration</p>
                  <p className="font-semibold text-foreground">{selectedTutorial.duration} minutes</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Views</p>
                  <p className="font-semibold text-foreground">{(selectedTutorial.views / 1000).toFixed(0)}K</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Likes</p>
                  <p className="font-semibold text-foreground">{(selectedTutorial.likes / 1000).toFixed(1)}K</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Difficulty</p>
                  <p className="font-semibold text-foreground capitalize">{selectedTutorial.difficulty}</p>
                </div>
              </div>

              <div className="flex gap-2 flex-wrap">
                {selectedTutorial.errorCodes.map(code => (
                  <Badge key={code} variant="secondary">
                    {code}
                  </Badge>
                ))}
              </div>

              <button
                onClick={() => setSelectedTutorial(null)}
                className="w-full px-4 py-2 bg-muted text-foreground rounded-md hover:bg-muted/80 transition-colors"
              >
                Close
              </button>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
