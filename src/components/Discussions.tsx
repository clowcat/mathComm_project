"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";

interface Discussion {
  id: string;
  title: string;
  author: string;
  authorAvatar?: string;
  content: string;
  replies: number;
  likes: number;
  tags: string[];
  timestamp: string;
  isLiked?: boolean;
}

const mockDiscussions: Discussion[] = [
  {
    id: "1",
    title: "Best strategies for solving quadratic equations?",
    author: "MathWizard",
    content: "I've been struggling with factoring quadratics. What are your favorite methods?",
    replies: 12,
    likes: 8,
    tags: ["algebra", "quadratic", "help"],
    timestamp: "2 hours ago",
    isLiked: false
  },
  {
    id: "2", 
    title: "Calculus integration techniques",
    author: "CalcMaster",
    content: "Just learned integration by parts! It's so satisfying when it clicks.",
    replies: 5,
    likes: 15,
    tags: ["calculus", "integration", "tips"],
    timestamp: "4 hours ago",
    isLiked: true
  },
  {
    id: "3",
    title: "Geometry proof help needed",
    author: "GeoStudent",
    content: "Can someone explain the proof for the Pythagorean theorem? I'm stuck on step 3.",
    replies: 8,
    likes: 3,
    tags: ["geometry", "proof", "pythagorean"],
    timestamp: "6 hours ago",
    isLiked: false
  },
  {
    id: "4",
    title: "Statistics vs Probability - what's the difference?",
    author: "StatsNewbie",
    content: "I keep getting confused between these two. Can someone clarify?",
    replies: 15,
    likes: 12,
    tags: ["statistics", "probability", "concepts"],
    timestamp: "1 day ago",
    isLiked: false
  }
];

export default function Discussions() {
  const handleLike = (id: string) => {
    // In a real app, this would make an API call
    console.log(`Liked discussion ${id}`);
  };

  const handleReply = (id: string) => {
    // In a real app, this would open a reply form
    console.log(`Replying to discussion ${id}`);
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          💬 Discussions
        </CardTitle>
        <div className="flex gap-2">
          <Input placeholder="Search discussions..." className="flex-1" />
          <Button>New Post</Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {mockDiscussions.map((discussion, index) => (
            <div key={discussion.id}>
              <div className="p-4 rounded-lg border bg-card hover:bg-accent/50 transition-colors">
                <div className="flex items-start gap-3">
                  <Avatar className="w-10 h-10">
                    <AvatarImage src={discussion.authorAvatar} />
                    <AvatarFallback>
                      {discussion.author.charAt(0)}
                    </AvatarFallback>
                  </Avatar>
                  
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="font-semibold text-lg">{discussion.title}</h3>
                      <Badge variant="outline" className="text-xs">
                        {discussion.timestamp}
                      </Badge>
                    </div>
                    
                    <p className="text-muted-foreground mb-3">
                      by {discussion.author}
                    </p>
                    
                    <p className="text-sm mb-3">{discussion.content}</p>
                    
                    <div className="flex items-center gap-4 mb-3">
                      <div className="flex items-center gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleLike(discussion.id)}
                          className={discussion.isLiked ? "text-red-500" : ""}
                        >
                          ❤️ {discussion.likes}
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleReply(discussion.id)}
                        >
                          💬 {discussion.replies}
                        </Button>
                      </div>
                    </div>
                    
                    <div className="flex flex-wrap gap-1">
                      {discussion.tags.map((tag) => (
                        <Badge key={tag} variant="secondary" className="text-xs">
                          #{tag}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
              {index < mockDiscussions.length - 1 && <Separator className="my-4" />}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
