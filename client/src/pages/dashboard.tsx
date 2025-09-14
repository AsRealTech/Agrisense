import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  Users, 
  MessageSquare, 
  AlertTriangle, 
  Bug, 
  Sprout, 
  Cloud, 
  Wind, 
  Search,
  Download,
  Clock,
  CheckCircle,
  User,
  Thermometer
} from "lucide-react";
import { useState } from "react";
import type { DashboardStats, CropStats, RecentActivity, QueryWithFarmer, WeatherAlert } from "@shared/schema";

export default function Dashboard() {
  const [queryTypeFilter, setQueryTypeFilter] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");

  // Dashboard stats query
  const { data: stats, isLoading: statsLoading } = useQuery<DashboardStats>({
    queryKey: ["/api/dashboard/stats"],
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  // Crop stats query
  const { data: cropStats, isLoading: cropStatsLoading } = useQuery<CropStats[]>({
    queryKey: ["/api/dashboard/crop-stats"],
    refetchInterval: 60000, // Refresh every minute
  });

  // Recent activity query
  const { data: recentActivity, isLoading: activityLoading } = useQuery<RecentActivity[]>({
    queryKey: ["/api/dashboard/recent-activity"],
    refetchInterval: 10000, // Refresh every 10 seconds
  });

  // Weather alerts query
  const { data: weatherAlerts, isLoading: alertsLoading } = useQuery<WeatherAlert[]>({
    queryKey: ["/api/dashboard/weather-alerts"],
    refetchInterval: 30000,
  });

  // Query logs
  const { data: queryLogs, isLoading: logsLoading } = useQuery<QueryWithFarmer[]>({
    queryKey: ["/api/queries", queryTypeFilter],
    refetchInterval: 15000,
  });

  const getQueryTypeIcon = (type: string) => {
    switch (type) {
      case 'planting': return <Sprout className="h-4 w-4" />;
      case 'weather': return <Cloud className="h-4 w-4" />;
      case 'pest': return <Bug className="h-4 w-4" />;
      default: return <MessageSquare className="h-4 w-4" />;
    }
  };

  const getQueryTypeBadgeColor = (type: string) => {
    switch (type) {
      case 'planting': return 'bg-primary/10 text-primary';
      case 'weather': return 'bg-blue-100 text-blue-700';
      case 'pest': return 'bg-red-100 text-red-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case 'resolved': return 'bg-green-100 text-green-700';
      case 'pending': return 'bg-yellow-100 text-yellow-700';
      case 'failed': return 'bg-red-100 text-red-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  const getAlertSeverityColor = (severity: string) => {
    switch (severity) {
      case 'high': return 'border-red-200 bg-red-50';
      case 'medium': return 'border-yellow-200 bg-yellow-50';
      case 'low': return 'border-blue-200 bg-blue-50';
      default: return 'border-gray-200 bg-gray-50';
    }
  };

  const getAlertIcon = (type: string) => {
    switch (type) {
      case 'rain': return <Cloud className="h-4 w-4 text-blue-600" />;
      case 'heat': return <Thermometer className="h-4 w-4 text-red-600" />;
      case 'wind': return <Wind className="h-4 w-4 text-gray-600" />;
      default: return <AlertTriangle className="h-4 w-4 text-yellow-600" />;
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-card border-b border-border shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <Sprout className="h-8 w-8 text-primary" />
                <h1 className="text-xl font-bold text-foreground">AgriSense Lite</h1>
              </div>
              <span className="text-sm text-muted-foreground">Admin Dashboard</span>
            </div>
            
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                <div className="w-2 h-2 bg-primary rounded-full animate-pulse"></div>
                <span>Live</span>
              </div>
              
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center">
                  <User className="h-4 w-4 text-primary-foreground" />
                </div>
                <span className="text-sm font-medium">Admin User</span>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Total Farmers</p>
                  {statsLoading ? (
                    <Skeleton className="h-8 w-16 mt-2" />
                  ) : (
                    <p className="text-3xl font-bold text-foreground" data-testid="stat-total-farmers">
                      {stats?.totalFarmers.toLocaleString() || 0}
                    </p>
                  )}
                  <p className="text-sm text-primary">Active and registered</p>
                </div>
                <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                  <Users className="h-6 w-6 text-primary" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Daily Queries</p>
                  {statsLoading ? (
                    <Skeleton className="h-8 w-16 mt-2" />
                  ) : (
                    <p className="text-3xl font-bold text-foreground" data-testid="stat-daily-queries">
                      {stats?.dailyQueries || 0}
                    </p>
                  )}
                  <p className="text-sm text-blue-600">Questions received today</p>
                </div>
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                  <MessageSquare className="h-6 w-6 text-blue-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Active Alerts</p>
                  {statsLoading ? (
                    <Skeleton className="h-8 w-16 mt-2" />
                  ) : (
                    <p className="text-3xl font-bold text-foreground" data-testid="stat-active-alerts">
                      {stats?.activeAlerts || 0}
                    </p>
                  )}
                  <p className="text-sm text-yellow-600">Weather & system alerts</p>
                </div>
                <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center">
                  <AlertTriangle className="h-6 w-6 text-yellow-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Pest Detections</p>
                  {statsLoading ? (
                    <Skeleton className="h-8 w-16 mt-2" />
                  ) : (
                    <p className="text-3xl font-bold text-foreground" data-testid="stat-pest-detections">
                      {stats?.pestDetections || 0}
                    </p>
                  )}
                  <p className="text-sm text-red-600">Identified this period</p>
                </div>
                <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center">
                  <Bug className="h-6 w-6 text-red-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* Query Types Distribution */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Query Types Distribution</CardTitle>
                <Select defaultValue="7days">
                  <SelectTrigger className="w-32">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="7days">Last 7 days</SelectItem>
                    <SelectItem value="30days">Last 30 days</SelectItem>
                    <SelectItem value="90days">Last 90 days</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardHeader>
            <CardContent>
              {cropStatsLoading ? (
                <div className="h-64 flex items-center justify-center">
                  <Skeleton className="h-32 w-full" />
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-primary/20 p-4 rounded-lg text-center">
                    <div className="text-2xl font-bold text-primary">45%</div>
                    <div className="text-sm text-muted-foreground">Planting</div>
                  </div>
                  <div className="bg-blue-100 p-4 rounded-lg text-center">
                    <div className="text-2xl font-bold text-blue-600">30%</div>
                    <div className="text-sm text-muted-foreground">Weather</div>
                  </div>
                  <div className="bg-red-100 p-4 rounded-lg text-center">
                    <div className="text-2xl font-bold text-red-600">25%</div>
                    <div className="text-sm text-muted-foreground">Pest</div>
                  </div>
                  <div className="bg-yellow-100 p-4 rounded-lg text-center">
                    <div className="text-2xl font-bold text-yellow-600">15%</div>
                    <div className="text-sm text-muted-foreground">Other</div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Top Crops */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Top Crops by Queries</CardTitle>
                <Button variant="ghost" size="sm">View All</Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {cropStatsLoading ? (
                  <div className="space-y-3">
                    {[1, 2, 3, 4].map((i) => (
                      <Skeleton key={i} className="h-12 w-full" />
                    ))}
                  </div>
                ) : cropStats && cropStats.length > 0 ? (
                  cropStats.slice(0, 4).map((crop, index) => (
                    <div key={crop.crop} className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
                          <Sprout className="h-4 w-4 text-primary" />
                        </div>
                        <span className="font-medium text-foreground">{crop.crop}</span>
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-medium text-foreground">
                          {crop.queries} queries
                        </div>
                        <div className="w-24 bg-muted rounded-full h-2 mt-1">
                          <div 
                            className="bg-primary h-2 rounded-full" 
                            style={{ width: `${Math.min(100, crop.percentage)}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    No crop data available
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Activity Section */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
          {/* Recent Activity */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Recent Activity</CardTitle>
                  <Button variant="ghost" size="sm">View All</Button>
                </div>
              </CardHeader>
              <CardContent className="p-0">
                <div className="divide-y divide-border">
                  {activityLoading ? (
                    <div className="p-4 space-y-4">
                      {[1, 2, 3, 4].map((i) => (
                        <div key={i} className="flex items-start space-x-3">
                          <Skeleton className="w-8 h-8 rounded-full" />
                          <div className="flex-1 space-y-2">
                            <Skeleton className="h-4 w-3/4" />
                            <Skeleton className="h-3 w-1/4" />
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : recentActivity && recentActivity.length > 0 ? (
                    recentActivity.map((activity) => (
                      <div key={activity.id} className="p-4 hover:bg-muted/50 transition-colors">
                        <div className="flex items-start space-x-3">
                          <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center mt-0.5">
                            {getQueryTypeIcon(activity.queryType)}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm text-foreground">
                              <span className="font-medium">{activity.farmer}</span> 
                              {activity.queryType === 'planting' && " asked for planting advice for "}
                              {activity.queryType === 'weather' && " requested weather forecast for "}
                              {activity.queryType === 'pest' && " reported pest issues with "}
                              <span className="font-medium text-primary">{activity.crop}</span>
                            </p>
                            <p className="text-xs text-muted-foreground mt-1">{activity.time}</p>
                          </div>
                          <Badge className={getQueryTypeBadgeColor(activity.queryType)}>
                            {activity.queryType}
                          </Badge>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="p-8 text-center text-muted-foreground">
                      No recent activity
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Weather Alerts */}
          <Card>
            <CardHeader>
              <CardTitle>Active Alerts</CardTitle>
            </CardHeader>
            <CardContent className="p-4 space-y-4">
              {alertsLoading ? (
                <div className="space-y-3">
                  {[1, 2, 3].map((i) => (
                    <Skeleton key={i} className="h-16 w-full" />
                  ))}
                </div>
              ) : weatherAlerts && weatherAlerts.length > 0 ? (
                weatherAlerts.slice(0, 3).map((alert) => (
                  <div key={alert.id} className={`border rounded-lg p-3 ${getAlertSeverityColor(alert.severity)}`}>
                    <div className="flex items-start space-x-2">
                      {getAlertIcon(alert.alertType)}
                      <div className="flex-1">
                        <p className="text-sm font-medium text-foreground">
                          {alert.alertType.charAt(0).toUpperCase() + alert.alertType.slice(1)} Alert
                        </p>
                        <p className="text-xs text-muted-foreground">{alert.region}</p>
                        <p className="text-xs text-red-600 mt-1">
                          Severity: {alert.severity}
                        </p>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-4 text-muted-foreground">
                  No active alerts
                </div>
              )}
              
              <Button variant="ghost" className="w-full" size="sm">
                Manage All Alerts
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Query Logs Table */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Query Logs</CardTitle>
              <div className="flex items-center space-x-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                  <Input
                    placeholder="Search queries..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 w-64"
                    data-testid="input-search-queries"
                  />
                </div>
                <Select value={queryTypeFilter} onValueChange={setQueryTypeFilter}>
                  <SelectTrigger className="w-32">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Types</SelectItem>
                    <SelectItem value="planting">Planting</SelectItem>
                    <SelectItem value="weather">Weather</SelectItem>
                    <SelectItem value="pest">Pest</SelectItem>
                  </SelectContent>
                </Select>
                <Button variant="default" size="sm" data-testid="button-export">
                  <Download className="h-4 w-4 mr-2" />
                  Export
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Farmer</TableHead>
                    <TableHead>Query Type</TableHead>
                    <TableHead>Crop</TableHead>
                    <TableHead>Location</TableHead>
                    <TableHead>Timestamp</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {logsLoading ? (
                    Array.from({ length: 5 }).map((_, i) => (
                      <TableRow key={i}>
                        {Array.from({ length: 7 }).map((_, j) => (
                          <TableCell key={j}>
                            <Skeleton className="h-4 w-full" />
                          </TableCell>
                        ))}
                      </TableRow>
                    ))
                  ) : queryLogs && queryLogs.length > 0 ? (
                    queryLogs
                      .filter(query => 
                        !searchTerm || 
                        query.farmer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                        query.crop?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                        query.message.toLowerCase().includes(searchTerm.toLowerCase())
                      )
                      .map((query) => (
                        <TableRow key={query.id} className="hover:bg-muted/50">
                          <TableCell>
                            <div className="flex items-center space-x-3">
                              <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
                                <span className="text-xs font-medium text-primary">
                                  {query.farmer.name.split(' ').map(n => n[0]).join('').toUpperCase()}
                                </span>
                              </div>
                              <div>
                                <p className="text-sm font-medium text-foreground">{query.farmer.name}</p>
                                <p className="text-xs text-muted-foreground">{query.farmer.phone}</p>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge className={getQueryTypeBadgeColor(query.queryType)}>
                              {query.queryType}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <span className="text-sm text-foreground">{query.crop || "N/A"}</span>
                          </TableCell>
                          <TableCell>
                            <span className="text-sm text-muted-foreground">
                              {query.farmer.location || "N/A"}
                            </span>
                          </TableCell>
                          <TableCell>
                            <span className="text-sm text-muted-foreground">
                              {new Date(query.timestamp!).toLocaleString()}
                            </span>
                          </TableCell>
                          <TableCell>
                            <Badge className={getStatusBadgeColor(query.status)}>
                              {query.status === 'resolved' && <CheckCircle className="h-3 w-3 mr-1" />}
                              {query.status === 'pending' && <Clock className="h-3 w-3 mr-1" />}
                              {query.status}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Button variant="ghost" size="sm" data-testid={`button-view-${query.id}`}>
                              View
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                        No queries found
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
