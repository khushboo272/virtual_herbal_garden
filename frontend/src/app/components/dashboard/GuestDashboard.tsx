// ──────────────────────────────────────────────────────────
// Guest Dashboard — conversion-optimized landing (PRD §4.1)
// ──────────────────────────────────────────────────────────

import { Leaf, Sparkles, Map, Lock, BookOpen, Users, Star, ArrowRight } from 'lucide-react';
import { Card, CardContent } from '../ui/card';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';

interface GuestDashboardProps {
  onOpenSignIn: () => void;
}

export function GuestDashboard({ onOpenSignIn }: GuestDashboardProps) {
  const featureCards = [
    {
      icon: Map,
      title: '3D Virtual Garden',
      description: 'Explore an immersive 3D botanical world with interactive plant models.',
      locked: true,
      color: 'from-green-500 to-emerald-600',
    },
    {
      icon: Sparkles,
      title: 'AI Plant Scanner',
      description: 'Identify plants instantly using AI-powered image recognition.',
      locked: true,
      color: 'from-purple-500 to-indigo-600',
    },
    {
      icon: BookOpen,
      title: 'Browse Plants',
      description: 'Explore our extensive catalogue of medicinal herbs and plants.',
      locked: false,
      link: '/library',
      color: 'from-teal-500 to-cyan-600',
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-emerald-50/40 to-teal-50/30">
      <div className="max-w-5xl mx-auto px-6 py-16">
        {/* Welcome Banner (PRD §4.1.1) */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-green-500 to-emerald-600 rounded-3xl shadow-xl mb-6">
            <Leaf className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-4xl font-bold text-green-900 mb-3">
            Welcome to Virtual Herbal Garden
          </h1>
          <p className="text-lg text-green-700 max-w-xl mx-auto mb-6">
            Discover the healing power of nature. Explore medicinal plants, create your own 3D garden, and learn from centuries of botanical wisdom.
          </p>
          <div className="flex items-center justify-center gap-4">
            <Button
              size="lg"
              className="bg-green-600 hover:bg-green-700 shadow-lg"
              onClick={onOpenSignIn}
            >
              Get Started Free
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="border-green-300 text-green-700 hover:bg-green-50"
              onClick={() => window.location.href = '/library'}
            >
              Browse Plants
            </Button>
          </div>
        </div>

        {/* Feature Preview Cards (PRD §4.1.2) */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-16">
          {featureCards.map((card) => (
            <Card
              key={card.title}
              className="border-2 border-green-200/60 bg-white hover:shadow-xl transition-all duration-300 cursor-pointer group overflow-hidden relative"
              onClick={() => {
                if (card.locked) {
                  onOpenSignIn();
                } else if (card.link) {
                  window.location.href = card.link;
                }
              }}
            >
              <CardContent className="p-6 text-center">
                <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${card.color} flex items-center justify-center mx-auto mb-4 shadow-lg group-hover:scale-110 transition-transform`}>
                  <card.icon className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">{card.title}</h3>
                <p className="text-sm text-gray-600 mb-4">{card.description}</p>
                {card.locked ? (
                  <Badge className="bg-gray-100 text-gray-500 border-gray-300">
                    <Lock className="w-3 h-3 mr-1" />
                    Sign in to unlock
                  </Badge>
                ) : (
                  <Badge className="bg-green-100 text-green-700 border-green-300">
                    <BookOpen className="w-3 h-3 mr-1" />
                    Browse Free
                  </Badge>
                )}
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Social Proof Section (PRD §4.1.1) */}
        <div className="text-center">
          <div className="inline-flex items-center gap-3 bg-white/80 backdrop-blur-sm border-2 border-green-200/60 rounded-full px-6 py-3 shadow-sm">
            <div className="flex -space-x-2">
              {[1, 2, 3, 4].map((i) => (
                <div
                  key={i}
                  className="w-8 h-8 rounded-full bg-gradient-to-br from-green-400 to-emerald-500 border-2 border-white flex items-center justify-center"
                >
                  <Users className="w-3 h-3 text-white" />
                </div>
              ))}
            </div>
            <div className="flex items-center gap-1 text-sm text-green-700">
              <span className="font-semibold">Join 12,000+ botanists</span>
              <span className="text-gray-400">•</span>
              <div className="flex items-center gap-0.5">
                {[1, 2, 3, 4, 5].map((s) => (
                  <Star key={s} className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
                ))}
              </div>
              <span className="text-gray-500">Verified reviews</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
