import { BookmarkIcon, Clock, TrendingUp, Award, Leaf, Heart, FileText, BarChart3 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Badge } from "../ui/badge";
import { Button } from "../ui/button";
import { Progress } from "../ui/progress";
import { Avatar, AvatarFallback } from "../ui/avatar";
import { useBookmarks, useUserProfile } from "../../../hooks/useUser";
import { LoadingState } from "../../../components/DataStates";

interface UserDashboardProps {
  user: {
    _id: string;
    name: string;
    email: string;
    role: string;
    avatar?: string;
  };
}

export function UserDashboard({ user }: UserDashboardProps) {
  const { bookmarks, isLoading: bookmarksLoading } = useBookmarks();
  const { stats, isLoading: statsLoading } = useUserProfile();

  const initials = user.name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  const dashStats = [
    { label: "Plants Explored", value: String(stats?.plantsExplored ?? 0), icon: Leaf, color: "bg-green-100 text-green-700" },
    { label: "Tours Completed", value: String(stats?.toursCompleted ?? 0), icon: Award, color: "bg-emerald-100 text-emerald-700" },
    { label: "Learning Hours", value: String(stats?.learningHours ?? 0), icon: Clock, color: "bg-teal-100 text-teal-700" },
    { label: "Detections", value: String(stats?.detections ?? 0), icon: TrendingUp, color: "bg-lime-100 text-lime-700" },
  ];

  const achievements = [
    { title: "First Steps", description: "Completed your first tour", earned: (stats?.toursCompleted ?? 0) >= 1 },
    { title: "Plant Explorer", description: "Viewed 25+ plants", earned: (stats?.plantsExplored ?? 0) >= 25 },
    { title: "Knowledge Seeker", description: "Spent 10+ hours learning", earned: (stats?.learningHours ?? 0) >= 10 },
    { title: "Master Herbalist", description: "Complete all tours", earned: false },
  ];

  const learningProgress = [
    { category: "Immunity Plants", progress: Math.min(100, (stats?.plantsExplored ?? 0) * 5), plants: Math.floor((stats?.plantsExplored ?? 0) * 0.36) },
    { category: "Digestive Herbs", progress: Math.min(100, (stats?.plantsExplored ?? 0) * 3), plants: Math.floor((stats?.plantsExplored ?? 0) * 0.25) },
    { category: "Skin Care", progress: Math.min(100, (stats?.plantsExplored ?? 0) * 2), plants: Math.floor((stats?.plantsExplored ?? 0) * 0.19) },
    { category: "Respiratory", progress: Math.min(100, (stats?.plantsExplored ?? 0) * 1.5), plants: Math.floor((stats?.plantsExplored ?? 0) * 0.13) },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50/50 via-emerald-50/30 to-teal-50/30">
      <div className="max-w-7xl mx-auto px-6 py-12">
        {/* Header */}
        <div className="mb-12">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Avatar className="w-16 h-16 border-4 border-white shadow-lg">
                <AvatarFallback className="bg-gradient-to-br from-green-500 to-emerald-600 text-white text-xl">
                  {initials}
                </AvatarFallback>
              </Avatar>
              <div>
                <h1 className="text-3xl text-green-900 mb-1">Welcome back, {user.name.split(" ")[0]}!</h1>
                <p className="text-green-600">Continue your herbal learning journey</p>
              </div>
            </div>
            <Button className="bg-green-600 hover:bg-green-700">
              <FileText className="w-4 h-4 mr-2" />
              My Notes
            </Button>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          {dashStats.map((stat) => (
            <Card key={stat.label} className="border-2 border-green-200 bg-white hover:shadow-lg transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-3">
                  <div className={`w-12 h-12 rounded-xl ${stat.color} flex items-center justify-center`}>
                    <stat.icon className="w-6 h-6" />
                  </div>
                </div>
                <div className="text-3xl text-green-900 mb-1">{stat.value}</div>
                <p className="text-sm text-green-600">{stat.label}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Left Column - Main Content */}
          <div className="lg:col-span-2 space-y-8">
            {/* Bookmarked Plants */}
            <Card className="border-2 border-green-200 bg-white">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-green-900">
                  <BookmarkIcon className="w-5 h-5 text-green-600" />
                  Bookmarked Plants
                  <Badge className="ml-auto bg-green-100 text-green-700 border-green-300">
                    {bookmarks.length}
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {bookmarks.slice(0, 4).map((bk) => (
                    <Card 
                      key={bk._id}
                      className="border-2 border-green-100 hover:border-green-300 hover:shadow-md transition-all cursor-pointer group"
                    >
                      <CardContent className="p-0">
                        <div className="flex items-center gap-3 p-4">
                          <img 
                            src={bk.plant?.images?.[0]?.url || ''} 
                            alt={bk.plant?.commonName || 'Plant'}
                            className="w-16 h-16 object-cover rounded-lg border-2 border-green-200 group-hover:scale-110 transition-transform"
                          />
                          <div className="flex-1">
                            <h4 className="text-sm text-green-900 mb-1">{bk.plant?.commonName || 'Unknown plant'}</h4>
                            <p className="text-xs text-green-600">Saved {new Date(bk.createdAt).toLocaleDateString()}</p>
                          </div>
                          <Heart className="w-5 h-5 text-green-600 fill-green-600" />
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
                <Button 
                  variant="outline" 
                  className="w-full mt-4 border-green-300 text-green-700 hover:bg-green-50"
                >
                  View All Bookmarks
                </Button>
              </CardContent>
            </Card>

            {/* Learning Progress */}
            <Card className="border-2 border-green-200 bg-white">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-green-900">
                  <BarChart3 className="w-5 h-5 text-green-600" />
                  Learning Progress by Category
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {learningProgress.map((category) => (
                  <div key={category.category}>
                    <div className="flex items-center justify-between mb-2">
                      <div>
                        <h4 className="text-sm text-green-900">{category.category}</h4>
                        <p className="text-xs text-green-600">{category.plants} plants explored</p>
                      </div>
                      <span className="text-sm text-green-700">{category.progress}%</span>
                    </div>
                    <Progress value={category.progress} className="h-2 bg-green-100" />
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Recently Viewed */}
            <Card className="border-2 border-green-200 bg-white">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-green-900">
                  <Clock className="w-5 h-5 text-green-600" />
                  Recently Viewed
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {bookmarks.slice(0, 3).map((bk) => (
                    <div 
                      key={bk._id}
                      className="flex items-center gap-4 p-3 rounded-lg border-2 border-green-100 hover:border-green-300 hover:bg-green-50/50 cursor-pointer transition-all"
                    >
                      <img 
                        src={bk.plant?.images?.[0]?.url || ''} 
                        alt={bk.plant?.commonName || 'Plant'}
                        className="w-14 h-14 object-cover rounded-lg"
                      />
                      <div className="flex-1">
                        <h4 className="text-sm text-green-900">{bk.plant?.commonName || 'Unknown'}</h4>
                        <p className="text-xs text-green-600">Viewed recently</p>
                      </div>
                      <Button size="sm" variant="ghost" className="text-green-700">
                        View
                      </Button>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right Column - Sidebar */}
          <div className="space-y-6">
            {/* Achievements */}
            <Card className="border-2 border-green-200 bg-gradient-to-br from-green-50 to-emerald-50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-green-900">
                  <Award className="w-5 h-5 text-green-600" />
                  Achievements
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {achievements.map((achievement, idx) => (
                  <div 
                    key={idx}
                    className={`p-4 rounded-lg border-2 ${
                      achievement.earned 
                        ? 'bg-white border-green-300' 
                        : 'bg-gray-50 border-gray-200 opacity-60'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                        achievement.earned 
                          ? 'bg-green-100' 
                          : 'bg-gray-200'
                      }`}>
                        <Award className={`w-5 h-5 ${
                          achievement.earned 
                            ? 'text-green-600' 
                            : 'text-gray-400'
                        }`} />
                      </div>
                      <div className="flex-1">
                        <h4 className="text-sm text-green-900 mb-1">{achievement.title}</h4>
                        <p className="text-xs text-green-600">{achievement.description}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Quick Actions */}
            <Card className="border-2 border-green-200 bg-white">
              <CardHeader>
                <CardTitle className="text-green-900">Quick Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button className="w-full bg-green-600 hover:bg-green-700 justify-start">
                  <Leaf className="w-4 h-4 mr-2" />
                  Explore New Plants
                </Button>
                <Button variant="outline" className="w-full border-green-300 text-green-700 hover:bg-green-50 justify-start">
                  <Award className="w-4 h-4 mr-2" />
                  Continue Tour
                </Button>
                <Button variant="outline" className="w-full border-green-300 text-green-700 hover:bg-green-50 justify-start">
                  <FileText className="w-4 h-4 mr-2" />
                  Review Notes
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
