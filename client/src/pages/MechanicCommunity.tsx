import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { ThumbsUp, MessageCircle, Share2, Plus, Search, TrendingUp } from 'lucide-react';

interface Post {
  id: string;
  author: string;
  avatar: string;
  title: string;
  content: string;
  category: string;
  votes: number;
  replies: number;
  views: number;
  timestamp: Date;
  userVoted: boolean;
}

interface Reply {
  id: string;
  postId: string;
  author: string;
  avatar: string;
  content: string;
  votes: number;
  timestamp: Date;
  userVoted: boolean;
}

const CATEGORIES = [
  'Diagnostics',
  'Engine Repair',
  'Transmission',
  'Electrical',
  'Suspension',
  'Tools & Equipment',
  'Tips & Tricks',
  'General Discussion'
];

const MOCK_POSTS: Post[] = [
  {
    id: '1',
    author: 'John Mechanic',
    avatar: 'JM',
    title: 'P0171 System Too Lean - Best Fix?',
    content: 'I\'ve been seeing a lot of P0171 codes lately. What\'s the most common cause you\'ve found? Fuel pressure sensor or MAF sensor?',
    category: 'Diagnostics',
    votes: 24,
    replies: 8,
    views: 156,
    timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000),
    userVoted: false
  },
  {
    id: '2',
    author: 'Sarah Auto Tech',
    avatar: 'SA',
    title: 'New Diagnostic Tool Recommendations',
    content: 'Looking for recommendations on affordable but reliable OBD-II scanners. Currently using a basic one but need something with more features.',
    category: 'Tools & Equipment',
    votes: 18,
    replies: 12,
    views: 203,
    timestamp: new Date(Date.now() - 4 * 60 * 60 * 1000),
    userVoted: false
  },
  {
    id: '3',
    author: 'Mike Diesel',
    avatar: 'MD',
    title: 'Transmission Fluid Change Intervals',
    content: 'What\'s your experience with transmission fluid change intervals? Some manufacturers say 100k miles, others say never. What do you recommend?',
    category: 'Transmission',
    votes: 31,
    replies: 15,
    views: 287,
    timestamp: new Date(Date.now() - 6 * 60 * 60 * 1000),
    userVoted: false
  }
];

export function MechanicCommunity() {
  const [posts, setPosts] = useState<Post[]>(MOCK_POSTS);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [isNewPostOpen, setIsNewPostOpen] = useState(false);
  const [selectedPost, setSelectedPost] = useState<Post | null>(null);
  const [newPostData, setNewPostData] = useState({
    title: '',
    content: '',
    category: 'General Discussion'
  });

  const handleVotePost = (postId: string) => {
    setPosts(posts.map(p => {
      if (p.id === postId) {
        return {
          ...p,
          votes: p.userVoted ? p.votes - 1 : p.votes + 1,
          userVoted: !p.userVoted
        };
      }
      return p;
    }));
  };

  const handleCreatePost = () => {
    if (!newPostData.title || !newPostData.content) return;

    const post: Post = {
      id: Date.now().toString(),
      author: 'You',
      avatar: 'YO',
      title: newPostData.title,
      content: newPostData.content,
      category: newPostData.category,
      votes: 0,
      replies: 0,
      views: 0,
      timestamp: new Date(),
      userVoted: false
    };

    setPosts([post, ...posts]);
    setNewPostData({ title: '', content: '', category: 'General Discussion' });
    setIsNewPostOpen(false);
  };

  const filteredPosts = posts.filter(post => {
    const matchesSearch = post.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         post.content.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'All' || post.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const sortedPosts = [...filteredPosts].sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());

  return (
    <div className="min-h-screen bg-background p-4 space-y-6">
      {/* Header */}
      <div className="space-y-4">
        <div className="space-y-2">
          <h1 className="text-3xl font-bold text-foreground">Mechanic Community</h1>
          <p className="text-muted-foreground">Share tips, ask questions, and learn from other mechanics</p>
        </div>

        <div className="flex gap-2">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search discussions..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          <Dialog open={isNewPostOpen} onOpenChange={setIsNewPostOpen}>
            <DialogTrigger asChild>
              <Button size="lg">
                <Plus className="h-4 w-4 mr-2" />
                New Post
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>Create New Post</DialogTitle>
              </DialogHeader>

              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-foreground mb-2 block">
                    Title
                  </label>
                  <Input
                    placeholder="What's your question or tip?"
                    value={newPostData.title}
                    onChange={(e) => setNewPostData({ ...newPostData, title: e.target.value })}
                  />
                </div>

                <div>
                  <label className="text-sm font-medium text-foreground mb-2 block">
                    Category
                  </label>
                  <select
                    value={newPostData.category}
                    onChange={(e) => setNewPostData({ ...newPostData, category: e.target.value })}
                    className="w-full p-2 border border-border rounded-md bg-background text-foreground text-sm"
                  >
                    {CATEGORIES.map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-sm font-medium text-foreground mb-2 block">
                    Description
                  </label>
                  <textarea
                    placeholder="Share your question, tip, or experience..."
                    value={newPostData.content}
                    onChange={(e) => setNewPostData({ ...newPostData, content: e.target.value })}
                    className="w-full p-2 border border-border rounded-md bg-background text-foreground text-sm"
                    rows={5}
                  />
                </div>

                <Button onClick={handleCreatePost} className="w-full">
                  Post
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Categories */}
      <div className="flex gap-2 overflow-x-auto pb-2">
        <Button
          variant={selectedCategory === 'All' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setSelectedCategory('All')}
        >
          All
        </Button>
        {CATEGORIES.map(cat => (
          <Button
            key={cat}
            variant={selectedCategory === cat ? 'default' : 'outline'}
            size="sm"
            onClick={() => setSelectedCategory(cat)}
          >
            {cat}
          </Button>
        ))}
      </div>

      {/* Posts List */}
      <div className="space-y-3">
        {sortedPosts.length === 0 ? (
          <Card className="p-6 text-center">
            <MessageCircle className="h-12 w-12 text-muted-foreground mx-auto mb-3 opacity-50" />
            <p className="text-muted-foreground">No posts found</p>
          </Card>
        ) : (
          sortedPosts.map(post => (
            <Card
              key={post.id}
              className="p-4 hover:bg-muted/50 cursor-pointer transition-colors"
              onClick={() => setSelectedPost(post)}
            >
              <div className="space-y-3">
                {/* Header */}
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-3 flex-1">
                    <Avatar className="h-10 w-10">
                      <AvatarFallback className="text-xs">{post.avatar}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground">{post.author}</p>
                      <p className="text-xs text-muted-foreground">
                        {Math.round((Date.now() - post.timestamp.getTime()) / (60 * 60 * 1000))}h ago
                      </p>
                    </div>
                  </div>
                  <Badge variant="secondary" className="text-xs">
                    {post.category}
                  </Badge>
                </div>

                {/* Title & Content */}
                <div>
                  <h3 className="font-semibold text-foreground line-clamp-2">{post.title}</h3>
                  <p className="text-sm text-muted-foreground line-clamp-2 mt-1">{post.content}</p>
                </div>

                {/* Stats & Actions */}
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <div className="flex gap-4">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleVotePost(post.id);
                      }}
                      className={`flex items-center gap-1 hover:text-foreground transition-colors ${
                        post.userVoted ? 'text-blue-500' : ''
                      }`}
                    >
                      <ThumbsUp className="h-4 w-4" />
                      {post.votes}
                    </button>
                    <div className="flex items-center gap-1">
                      <MessageCircle className="h-4 w-4" />
                      {post.replies}
                    </div>
                    <div className="flex items-center gap-1">
                      <TrendingUp className="h-4 w-4" />
                      {post.views}
                    </div>
                  </div>
                  <button className="hover:text-foreground transition-colors">
                    <Share2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </Card>
          ))
        )}
      </div>

      {/* Post Detail Modal */}
      {selectedPost && (
        <Dialog open={!!selectedPost} onOpenChange={() => setSelectedPost(null)}>
          <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{selectedPost.title}</DialogTitle>
            </DialogHeader>

            <div className="space-y-4">
              {/* Original Post */}
              <Card className="p-4 bg-muted/50">
                <div className="flex items-center gap-3 mb-3">
                  <Avatar>
                    <AvatarFallback>{selectedPost.avatar}</AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-medium text-foreground">{selectedPost.author}</p>
                    <p className="text-xs text-muted-foreground">
                      {selectedPost.timestamp.toLocaleDateString()}
                    </p>
                  </div>
                </div>
                <p className="text-foreground">{selectedPost.content}</p>
                <div className="flex gap-3 mt-4 text-sm">
                  <button
                    onClick={() => handleVotePost(selectedPost.id)}
                    className={`flex items-center gap-1 hover:text-blue-500 transition-colors ${
                      selectedPost.userVoted ? 'text-blue-500' : 'text-muted-foreground'
                    }`}
                  >
                    <ThumbsUp className="h-4 w-4" />
                    {selectedPost.votes}
                  </button>
                  <div className="flex items-center gap-1 text-muted-foreground">
                    <MessageCircle className="h-4 w-4" />
                    {selectedPost.replies}
                  </div>
                </div>
              </Card>

              {/* Replies Section */}
              <div className="space-y-3">
                <h3 className="font-semibold text-foreground">Replies ({selectedPost.replies})</h3>
                <Card className="p-4">
                  <textarea
                    placeholder="Share your response..."
                    className="w-full p-2 border border-border rounded-md bg-background text-foreground text-sm"
                    rows={3}
                  />
                  <Button className="mt-2 w-full">Post Reply</Button>
                </Card>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
