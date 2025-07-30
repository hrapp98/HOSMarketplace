import { getAnalyticsMetrics, getFunnelAnalysis, getUserBehavior } from '@/lib/analytics'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/Select'
import {
  BarChart3,
  Users,
  Eye,
  MousePointer,
  TrendingUp,
  TrendingDown,
  Activity,
  Calendar,
  Download,
  RefreshCw,
} from 'lucide-react'

// Date range helper
function getDateRange(period: string): { start: Date; end: Date } {
  const now = new Date()
  const end = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59)
  let start: Date

  switch (period) {
    case '7d':
      start = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
      break
    case '30d':
      start = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
      break
    case '90d':
      start = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000)
      break
    default:
      start = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
  }

  return { start, end }
}

interface AnalyticsDashboardProps {
  searchParams?: {
    period?: string
  }
}

export async function AnalyticsDashboard({ searchParams }: AnalyticsDashboardProps) {
  const period = searchParams?.period || '30d'
  const { start, end } = getDateRange(period)

  try {
    const [metrics, funnelData, behaviorData] = await Promise.all([
      getAnalyticsMetrics(start, end),
      getFunnelAnalysis(start, end),
      getUserBehavior(start, end),
    ])

    const periodName = {
      '7d': 'Last 7 days',
      '30d': 'Last 30 days',
      '90d': 'Last 90 days',
    }[period] || 'Last 30 days'

    const keyMetrics = [
      {
        title: 'Total Events',
        value: metrics.totalEvents.toLocaleString(),
        icon: Activity,
        color: 'text-blue-600',
        bgColor: 'bg-blue-100',
      },
      {
        title: 'Unique Users',
        value: metrics.uniqueUsers.toLocaleString(),
        icon: Users,
        color: 'text-green-600',
        bgColor: 'bg-green-100',
      },
      {
        title: 'Page Views',
        value: metrics.totalPageViews.toLocaleString(),
        icon: Eye,
        color: 'text-purple-600',
        bgColor: 'bg-purple-100',
      },
      {
        title: 'Conversion Rate',
        value: `${metrics.conversionRate}%`,
        icon: TrendingUp,
        color: 'text-orange-600',
        bgColor: 'bg-orange-100',
      },
    ]

    return (
      <div className="space-y-6">
        {/* Header with Controls */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">
              Analytics Overview - {periodName}
            </h2>
            <p className="text-sm text-gray-600">
              {start.toLocaleDateString()} - {end.toLocaleDateString()}
            </p>
          </div>
          <div className="flex items-center space-x-3">
            <Select defaultValue={period}>
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="7d">Last 7 days</SelectItem>
                <SelectItem value="30d">Last 30 days</SelectItem>
                <SelectItem value="90d">Last 90 days</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline" size="sm">
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
            <Button variant="outline" size="sm">
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>
          </div>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {keyMetrics.map((metric) => (
            <Card key={metric.title}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-gray-600">
                  {metric.title}
                </CardTitle>
                <div className={`p-2 rounded-lg ${metric.bgColor}`}>
                  <metric.icon className={`h-5 w-5 ${metric.color}`} />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-gray-900">{metric.value}</div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Charts and Analysis */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Top Events */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg font-semibold">Top Events</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {metrics.topEvents.slice(0, 8).map((event, index) => (
                  <div key={event.event} className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center text-sm font-medium text-gray-600">
                        {index + 1}
                      </div>
                      <div>
                        <p className="font-medium text-sm">
                          {event.event.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                        </p>
                      </div>
                    </div>
                    <Badge variant="secondary">
                      {event.count.toLocaleString()}
                    </Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Conversion Funnel */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg font-semibold">Conversion Funnel</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {funnelData.map((step, index) => (
                  <div key={step.step} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">{step.step}</span>
                      <div className="flex items-center space-x-2">
                        <span className="text-sm text-gray-600">
                          {step.users.toLocaleString()}
                        </span>
                        <Badge 
                          variant={step.conversionRate >= 50 ? "default" : "secondary"}
                          className="text-xs"
                        >
                          {step.conversionRate}%
                        </Badge>
                      </div>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-blue-600 h-2 rounded-full transition-all"
                        style={{ width: `${step.conversionRate}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* User Behavior Insights */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Session Metrics */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg font-semibold">Session Metrics</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Avg Session Duration</span>
                  <span className="font-medium">{behaviorData.avgSessionDuration} min</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Avg Pages/Session</span>
                  <span className="font-medium">{behaviorData.avgPagesPerSession}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Bounce Rate</span>
                  <span className="font-medium">{behaviorData.bounceRate}%</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Device Types */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg font-semibold">Device Types</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {behaviorData.deviceTypes.map((device) => (
                  <div key={device.device} className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">{device.device}</span>
                    <div className="flex items-center space-x-2">
                      <div className="w-16 bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-green-600 h-2 rounded-full"
                          style={{ width: `${device.percentage}%` }}
                        />
                      </div>
                      <span className="text-sm font-medium w-8">{device.percentage}%</span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Traffic Sources */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg font-semibold">Traffic Sources</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {behaviorData.trafficSources.map((source) => (
                  <div key={source.source} className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">{source.source}</span>
                    <div className="flex items-center space-x-2">
                      <div className="w-16 bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-purple-600 h-2 rounded-full"
                          style={{ width: `${source.percentage}%` }}
                        />
                      </div>
                      <span className="text-sm font-medium w-8">{source.percentage}%</span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Top Pages */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg font-semibold">Most Viewed Pages</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {behaviorData.topPages.slice(0, 10).map((page, index) => (
                <div key={page.page} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center text-xs font-medium text-blue-600">
                      {index + 1}
                    </div>
                    <code className="text-sm text-gray-700">{page.page}</code>
                  </div>
                  <Badge variant="secondary">
                    {page.views.toLocaleString()} views
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Event Timeline */}
        {metrics.eventTimeline.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg font-semibold">Activity Timeline</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm text-gray-600 mb-4">
                  <span>Daily Events</span>
                  <span>Peak: {Math.max(...metrics.eventTimeline.map(d => d.events)).toLocaleString()}</span>
                </div>
                <div className="flex items-end space-x-1 h-32">
                  {metrics.eventTimeline.map((day, index) => {
                    const maxEvents = Math.max(...metrics.eventTimeline.map(d => d.events))
                    const height = maxEvents > 0 ? (day.events / maxEvents) * 100 : 0
                    
                    return (
                      <div
                        key={index}
                        className="flex-1 bg-blue-600 rounded-t hover:bg-blue-700 transition-colors"
                        style={{ height: `${height}%` }}
                        title={`${day.date}: ${day.events.toLocaleString()} events`}
                      />
                    )
                  })}
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    )
  } catch (error) {
    console.error('Failed to load analytics:', error)
    
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg font-semibold text-red-600">Analytics Error</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-gray-600">
            Failed to load analytics data. This might be because the analytics system is not yet set up 
            or there's no data available for the selected period.
          </p>
          <Button variant="outline" className="mt-4">
            <RefreshCw className="h-4 w-4 mr-2" />
            Retry
          </Button>
        </CardContent>
      </Card>
    )
  }
}