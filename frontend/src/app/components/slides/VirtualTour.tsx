import { MapPin, Play, CheckCircle2, Lock, Volume2, ArrowRight, X, Award, BookOpen, Pause, RotateCcw, Sparkles } from "lucide-react";
import { Button } from "../ui/button";
import { Card, CardContent } from "../ui/card";
import { Badge } from "../ui/badge";
import { Progress } from "../ui/progress";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "../ui/dialog";
import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";

interface Checkpoint {
  id: number;
  title: string;
  description: string;
  completed: boolean;
  locked: boolean;
  duration: string;
  content: {
    intro: string;
    keyPoints: string[];
    plants: string[];
    activity: string;
  };
}

export function VirtualTour({ tourId, title, description, stops }: { tourId?: string, title?: string, description?: string, stops?: any[] }) {
  const [expandedCheckpoint, setExpandedCheckpoint] = useState<number | null>(null);
  const [selectedCheckpoint, setSelectedCheckpoint] = useState<Checkpoint | null>(null);
  const [checkpoints, setCheckpoints] = useState<Checkpoint[]>([
    {
      id: 1,
      title: "Welcome to the Garden",
      description: "Introduction to medicinal plants and their importance",
      completed: true,
      locked: false,
      duration: "3 min",
      content: {
        intro: "Welcome to your journey into the world of medicinal plants! In this introductory tour, you'll learn about the fascinating history of herbal medicine and how plants have been used for healing throughout human civilization.",
        keyPoints: [
          "The history of medicinal plants in traditional medicine",
          "How plants produce healing compounds",
          "The importance of sustainable harvesting",
          "Safety considerations when using herbs"
        ],
        plants: ["Aloe Vera", "Chamomile", "Peppermint"],
        activity: "Take a quiz on plant identification basics"
      }
    },
    {
      id: 2,
      title: "Immunity Boosters",
      description: "Explore plants that strengthen immune system",
      completed: true,
      locked: false,
      duration: "5 min",
      content: {
        intro: "Discover powerful plants that have been scientifically proven to boost your immune system and help your body fight infections naturally.",
        keyPoints: [
          "How immune-boosting compounds work in the body",
          "Best practices for preparing immune teas",
          "Seasonal immune support strategies",
          "Combining herbs for maximum benefit"
        ],
        plants: ["Tulsi (Holy Basil)", "Echinacea", "Ginger", "Turmeric"],
        activity: "Learn to prepare a basic immunity tea blend"
      }
    },
    {
      id: 3,
      title: "Digestive Herbs",
      description: "Learn about herbs for digestive health",
      completed: false,
      locked: false,
      duration: "4 min",
      content: {
        intro: "The digestive system is the foundation of health. Explore herbs that soothe, heal, and optimize digestive function.",
        keyPoints: [
          "Understanding digestive processes",
          "Herbs for different digestive issues",
          "Creating digestive bitters and teas",
          "When to use carminative herbs"
        ],
        plants: ["Peppermint", "Fennel", "Ginger", "Licorice"],
        activity: "Interactive guide to digestive herb selection"
      }
    },
    {
      id: 4,
      title: "Skin & Beauty",
      description: "Natural remedies for skin care",
      completed: false,
      locked: false,
      duration: "6 min",
      content: {
        intro: "Your skin is your body's largest organ. Learn how to nourish it naturally with botanical remedies used for centuries.",
        keyPoints: [
          "Herbs for different skin types",
          "Making herbal infusions for skincare",
          "Anti-aging botanicals",
          "Treating common skin conditions naturally"
        ],
        plants: ["Aloe Vera", "Lavender", "Calendula", "Rose"],
        activity: "Create your personalized skincare routine"
      }
    },
    {
      id: 5,
      title: "Respiratory Support",
      description: "Plants for breathing and lung health",
      completed: false,
      locked: true,
      duration: "5 min",
      content: {
        intro: "Complete previous checkpoints to unlock this respiratory health journey.",
        keyPoints: [],
        plants: [],
        activity: ""
      }
    },
    {
      id: 6,
      title: "Final Assessment",
      description: "Test your knowledge and earn certificate",
      completed: false,
      locked: true,
      duration: "10 min",
      content: {
        intro: "Complete all tours to unlock the final assessment.",
        keyPoints: [],
        plants: [],
        activity: ""
      }
    }
  ]);

  const [isPlaying, setIsPlaying] = useState<number | null>(null);
  const [showQuiz, setShowQuiz] = useState(false);

  const completedCount = checkpoints.filter(c => c.completed).length;
  const progressPercentage = (completedCount / checkpoints.length) * 100;

  const handleCheckpointClick = (checkpoint: Checkpoint) => {
    if (!checkpoint.locked) {
      setSelectedCheckpoint(checkpoint);
    }
  };

  const handleStartCheckpoint = (checkpoint: Checkpoint) => {
    setIsPlaying(checkpoint.id);
    
    // Simulate completing after a delay
    setTimeout(() => {
      setCheckpoints(prev => prev.map(cp => 
        cp.id === checkpoint.id ? { ...cp, completed: true } : cp
      ));
      setIsPlaying(null);
      
      // Unlock next checkpoint
      setCheckpoints(prev => prev.map((cp, idx) => {
        if (idx > 0 && prev[idx - 1].completed) {
          return { ...cp, locked: false };
        }
        return cp;
      }));
    }, 3000);
  };

  const handleReviewCheckpoint = (checkpoint: Checkpoint) => {
    setSelectedCheckpoint(checkpoint);
  };

  const toggleExpand = (checkpointId: number) => {
    setExpandedCheckpoint(prev => prev === checkpointId ? null : checkpointId);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50/50 via-emerald-50/30 to-teal-50/30">
      <div className="max-w-6xl mx-auto px-6 py-12">
        {/* Header */}
        <motion.div 
          className="mb-12 text-center"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <Badge className="mb-4 bg-green-100 text-green-700 border-green-300">
            Interactive Learning Journey
          </Badge>
          <h1 className="text-4xl text-green-900 mb-4">Virtual Herbal Garden Tour</h1>
          <p className="text-lg text-green-600 max-w-2xl mx-auto">
            Embark on a guided journey through the world of medicinal plants. 
            Learn at your own pace with interactive lessons and narrated content.
          </p>
        </motion.div>

        {/* Progress Overview */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <Card className="mb-12 border-2 border-green-200 bg-white shadow-lg hover:shadow-xl transition-shadow">
            <CardContent className="p-8">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-xl text-green-900 mb-1">Your Progress</h3>
                  <p className="text-sm text-green-600">
                    {completedCount} of {checkpoints.length} checkpoints completed
                  </p>
                </div>
                <div className="text-right">
                  <div className="text-3xl text-green-700 mb-1">
                    {Math.round(progressPercentage)}%
                  </div>
                  <p className="text-xs text-green-600">Complete</p>
                </div>
              </div>
              <Progress value={progressPercentage} className="h-3 bg-green-100" />
              
              {completedCount === checkpoints.length && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mt-4 p-4 bg-green-50 rounded-lg border-2 border-green-300 flex items-center gap-3"
                >
                  <Award className="w-8 h-8 text-green-600" />
                  <div>
                    <p className="text-sm text-green-900">Congratulations! 🎉</p>
                    <p className="text-xs text-green-600">You've completed all checkpoints!</p>
                  </div>
                </motion.div>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* Tour Map */}
        <div className="relative">
          {/* Connecting Path - SVG Line */}
          <svg className="absolute inset-0 w-full h-full pointer-events-none" style={{ zIndex: 0 }}>
            <defs>
              <linearGradient id="pathGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#4a7c59" stopOpacity="0.3" />
                <stop offset="100%" stopColor="#8fbc8f" stopOpacity="0.3" />
              </linearGradient>
            </defs>
            {/* Curved path connecting checkpoints */}
            <path
              d="M 100 100 Q 300 200, 100 300 T 100 500 T 100 700 T 100 900"
              stroke="url(#pathGradient)"
              strokeWidth="3"
              fill="none"
              strokeDasharray="10,5"
            />
          </svg>

          {/* Checkpoints */}
          <div className="space-y-8 relative z-10">
            <AnimatePresence>
              {checkpoints.map((checkpoint, index) => (
                <motion.div 
                  key={checkpoint.id}
                  className={`flex items-start gap-6 ${
                    index % 2 === 0 ? 'flex-row' : 'flex-row-reverse'
                  }`}
                  initial={{ opacity: 0, x: index % 2 === 0 ? -50 : 50 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                >
                  {/* Checkpoint Marker */}
                  <motion.div 
                    className="relative flex-shrink-0 cursor-pointer"
                    whileHover={{ scale: checkpoint.locked ? 1 : 1.1 }}
                    whileTap={{ scale: checkpoint.locked ? 1 : 0.95 }}
                    onClick={() => !checkpoint.locked && handleCheckpointClick(checkpoint)}
                  >
                    <div className={`
                      w-20 h-20 rounded-full border-4 flex items-center justify-center
                      ${checkpoint.completed 
                        ? 'bg-green-500 border-green-600' 
                        : checkpoint.locked 
                          ? 'bg-gray-300 border-gray-400'
                          : 'bg-white border-green-400'
                      }
                      shadow-lg transition-all
                      ${!checkpoint.locked && 'hover:shadow-2xl'}
                    `}>
                      {checkpoint.completed ? (
                        <CheckCircle2 className="w-10 h-10 text-white" />
                      ) : checkpoint.locked ? (
                        <Lock className="w-8 h-8 text-gray-600" />
                      ) : (
                        <MapPin className="w-8 h-8 text-green-600" />
                      )}
                    </div>
                    {/* Pulsing ring for active checkpoint */}
                    {!checkpoint.completed && !checkpoint.locked && isPlaying !== checkpoint.id && (
                      <motion.div 
                        className="absolute inset-0 rounded-full border-4 border-green-400"
                        animate={{ 
                          scale: [1, 1.2, 1],
                          opacity: [0.7, 0, 0.7]
                        }}
                        transition={{ 
                          duration: 2,
                          repeat: Infinity,
                          ease: "easeInOut"
                        }}
                      />
                    )}
                    {/* Playing indicator */}
                    {isPlaying === checkpoint.id && (
                      <motion.div 
                        className="absolute inset-0 rounded-full border-4 border-green-600"
                        animate={{ 
                          rotate: 360
                        }}
                        transition={{ 
                          duration: 1,
                          repeat: Infinity,
                          ease: "linear"
                        }}
                      />
                    )}
                  </motion.div>

                  {/* Checkpoint Content */}
                  <motion.div
                    className="flex-1"
                    whileHover={!checkpoint.locked ? { y: -4 } : {}}
                    transition={{ duration: 0.2 }}
                  >
                    <Card className={`
                      border-2 transition-all
                      ${checkpoint.completed 
                        ? 'border-green-300 bg-green-50/50' 
                        : checkpoint.locked 
                          ? 'border-gray-300 bg-gray-50/50 opacity-60'
                          : 'border-green-400 bg-white shadow-lg hover:shadow-2xl hover:border-green-500'
                      }
                      ${!checkpoint.locked && 'cursor-pointer'}
                    `}
                    onClick={() => !checkpoint.locked && toggleExpand(checkpoint.id)}
                    >
                      <CardContent className="p-6">
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2">
                              <h3 className="text-xl text-green-900">
                                {checkpoint.id}. {checkpoint.title}
                              </h3>
                              {checkpoint.completed && (
                                <Badge className="bg-green-600 text-white">Completed</Badge>
                              )}
                              {checkpoint.locked && (
                                <Badge variant="outline" className="border-gray-400 text-gray-600">
                                  Locked
                                </Badge>
                              )}
                              {isPlaying === checkpoint.id && (
                                <Badge className="bg-blue-600 text-white animate-pulse">
                                  Playing...
                                </Badge>
                              )}
                            </div>
                            <p className="text-green-700 mb-4">{checkpoint.description}</p>
                            
                            {/* Features */}
                            <div className="flex flex-wrap items-center gap-4 text-sm text-green-600 mb-4">
                              <div className="flex items-center gap-2">
                                <Volume2 className="w-4 h-4" />
                                <span>Audio Narration</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <Play className="w-4 h-4" />
                                <span>{checkpoint.duration}</span>
                              </div>
                              {!checkpoint.locked && (
                                <div className="flex items-center gap-2">
                                  <BookOpen className="w-4 h-4" />
                                  <span>Interactive Activities</span>
                                </div>
                              )}
                            </div>

                            {/* Expanded Content */}
                            <AnimatePresence>
                              {expandedCheckpoint === checkpoint.id && !checkpoint.locked && (
                                <motion.div
                                  initial={{ opacity: 0, height: 0 }}
                                  animate={{ opacity: 1, height: "auto" }}
                                  exit={{ opacity: 0, height: 0 }}
                                  transition={{ duration: 0.3 }}
                                  className="overflow-hidden"
                                >
                                  <div className="pt-4 border-t-2 border-green-200 space-y-3">
                                    <div className="bg-green-50 p-4 rounded-lg">
                                      <h4 className="text-sm text-green-900 mb-2">What you'll learn:</h4>
                                      <ul className="space-y-1">
                                        {checkpoint.content.keyPoints.slice(0, 2).map((point, idx) => (
                                          <li key={idx} className="text-sm text-green-700 flex items-start gap-2">
                                            <span className="text-green-500">•</span>
                                            {point}
                                          </li>
                                        ))}
                                      </ul>
                                    </div>
                                    {checkpoint.content.plants.length > 0 && (
                                      <div className="flex flex-wrap gap-2">
                                        {checkpoint.content.plants.slice(0, 3).map((plant, idx) => (
                                          <Badge key={idx} variant="outline" className="border-green-300 text-green-700">
                                            {plant}
                                          </Badge>
                                        ))}
                                      </div>
                                    )}
                                  </div>
                                </motion.div>
                              )}
                            </AnimatePresence>
                          </div>
                        </div>

                        {/* Action Buttons */}
                        {!checkpoint.locked && (
                          <div className="flex gap-3" onClick={(e) => e.stopPropagation()}>
                            {checkpoint.completed ? (
                              <>
                                <Button 
                                  className="bg-green-200 text-green-800 hover:bg-green-300"
                                  onClick={() => handleReviewCheckpoint(checkpoint)}
                                >
                                  <CheckCircle2 className="w-4 h-4 mr-2" />
                                  Review Checkpoint
                                </Button>
                                <Button
                                  variant="outline"
                                  className="border-green-300 text-green-700 hover:bg-green-50"
                                  onClick={() => handleStartCheckpoint(checkpoint)}
                                >
                                  <RotateCcw className="w-4 h-4 mr-2" />
                                  Replay
                                </Button>
                              </>
                            ) : (
                              <Button 
                                className="bg-green-600 hover:bg-green-700 text-white"
                                onClick={() => handleStartCheckpoint(checkpoint)}
                                disabled={isPlaying === checkpoint.id}
                              >
                                {isPlaying === checkpoint.id ? (
                                  <>
                                    <Pause className="w-4 h-4 mr-2" />
                                    Playing...
                                  </>
                                ) : (
                                  <>
                                    <Play className="w-4 h-4 mr-2" />
                                    Start Checkpoint
                                  </>
                                )}
                              </Button>
                            )}
                            <Button
                              variant="outline"
                              className="border-green-300 text-green-700 hover:bg-green-50"
                              onClick={() => handleCheckpointClick(checkpoint)}
                            >
                              <BookOpen className="w-4 h-4 mr-2" />
                              View Details
                            </Button>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  </motion.div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </div>

        {/* Continue Button */}
        <motion.div 
          className="mt-12 text-center"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.5 }}
        >
          <Card className="inline-block border-2 border-green-300 bg-gradient-to-br from-green-50 to-emerald-50 hover:shadow-xl transition-shadow">
            <CardContent className="p-8">
              <h3 className="text-xl text-green-900 mb-2">Ready to Continue?</h3>
              <p className="text-green-600 mb-6">
                {completedCount === checkpoints.length 
                  ? "Congratulations on completing all checkpoints!"
                  : "Resume your journey from where you left off"
                }
              </p>
              <Button 
                size="lg" 
                className="bg-green-600 hover:bg-green-700"
                onClick={() => {
                  const nextIncomplete = checkpoints.find(cp => !cp.completed && !cp.locked);
                  if (nextIncomplete) handleCheckpointClick(nextIncomplete);
                }}
              >
                {completedCount === checkpoints.length ? (
                  <>
                    <Award className="w-4 h-4 mr-2" />
                    View Certificate
                  </>
                ) : (
                  <>
                    Continue Tour
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Checkpoint Detail Modal */}
      <Dialog open={!!selectedCheckpoint} onOpenChange={() => setSelectedCheckpoint(null)}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto bg-gradient-to-br from-green-50 to-white border-2 border-green-200">
          <DialogHeader>
            <div className="flex items-center justify-between">
              <div>
                <DialogTitle className="text-2xl text-green-900 mb-2">
                  {selectedCheckpoint?.title}
                </DialogTitle>
                <DialogDescription className="text-green-600">
                  {selectedCheckpoint?.description}
                </DialogDescription>
              </div>
              {selectedCheckpoint?.completed && (
                <Badge className="bg-green-600 text-white">
                  <CheckCircle2 className="w-3 h-3 mr-1" />
                  Completed
                </Badge>
              )}
            </div>
          </DialogHeader>

          {selectedCheckpoint && (
            <div className="space-y-6 pt-4">
              {/* Introduction */}
              <div className="p-5 bg-white rounded-xl border-2 border-green-200">
                <h4 className="text-sm text-green-800 mb-3 flex items-center gap-2">
                  <BookOpen className="w-4 h-4" />
                  Introduction
                </h4>
                <p className="text-green-700">{selectedCheckpoint.content.intro}</p>
              </div>

              {/* Key Learning Points */}
              {selectedCheckpoint.content.keyPoints.length > 0 && (
                <div className="p-5 bg-white rounded-xl border-2 border-green-200">
                  <h4 className="text-sm text-green-800 mb-3">Key Learning Points</h4>
                  <ul className="space-y-2">
                    {selectedCheckpoint.content.keyPoints.map((point, idx) => (
                      <motion.li
                        key={idx}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: idx * 0.1 }}
                        className="flex items-start gap-3 text-green-700"
                      >
                        <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                        {point}
                      </motion.li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Featured Plants */}
              {selectedCheckpoint.content.plants.length > 0 && (
                <div className="p-5 bg-white rounded-xl border-2 border-green-200">
                  <h4 className="text-sm text-green-800 mb-3">Featured Plants</h4>
                  <div className="flex flex-wrap gap-2">
                    {selectedCheckpoint.content.plants.map((plant, idx) => (
                      <motion.div
                        key={idx}
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: idx * 0.1 }}
                      >
                        <Badge className="bg-green-100 text-green-700 border-green-300 px-3 py-1">
                          {plant}
                        </Badge>
                      </motion.div>
                    ))}
                  </div>
                </div>
              )}

              {/* Interactive Activity */}
              {selectedCheckpoint.content.activity && (
                <div className="p-5 bg-gradient-to-br from-green-100 to-emerald-100 rounded-xl border-2 border-green-300">
                  <h4 className="text-sm text-green-800 mb-3 flex items-center gap-2">
                    <Sparkles className="w-4 h-4" />
                    Interactive Activity
                  </h4>
                  <p className="text-green-700 mb-4">{selectedCheckpoint.content.activity}</p>
                  <Button className="bg-green-600 hover:bg-green-700" onClick={() => setShowQuiz(true)}>
                    Start Activity
                  </Button>
                </div>
              )}

              {/* Audio Player Simulation */}
              <div className="p-5 bg-white rounded-xl border-2 border-green-200">
                <h4 className="text-sm text-green-800 mb-3 flex items-center gap-2">
                  <Volume2 className="w-4 h-4" />
                  Audio Narration
                </h4>
                <div className="flex items-center gap-4">
                  <Button size="icon" className="bg-green-600 hover:bg-green-700 rounded-full">
                    <Play className="w-4 h-4" />
                  </Button>
                  <div className="flex-1">
                    <Progress value={0} className="h-2 bg-green-100" />
                    <div className="flex justify-between text-xs text-green-600 mt-1">
                      <span>0:00</span>
                      <span>{selectedCheckpoint.duration}</span>
                    </div>
                  </div>
                  <Button size="icon" variant="outline" className="border-green-300 text-green-700">
                    <Volume2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}