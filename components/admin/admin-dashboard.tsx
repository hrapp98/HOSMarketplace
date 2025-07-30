import { prisma } from '@/app/lib/prisma'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import {
  Users,
  Briefcase,
  CreditCard,
  TrendingUp,
  AlertTriangle,
  CheckCircle,
  Clock,
  DollarSign,
} from 'lucide-react'

async function getDashboardStats() {
  const [
    totalUsers,
    totalJobs,
    totalApplications,
    totalPayments,
    recentUsers,
    recentJobs,
    pendingApplications,
    activeJobs,
  ] = await Promise.all([
    prisma.user.count(),
    prisma.job.count(),
    prisma.application.count(),
    prisma.payment.count(),
    prisma.user.count({
      where: {
        createdAt: {
          gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // Last 7 days
        },
      },
    }),
    prisma.job.count({
      where: {
        createdAt: {
          gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // Last 7 days
        },
      },
    }),
    prisma.application.count({
      where: {
        status: 'PENDING',
      },
    }),
    prisma.job.count({
      where: {
        status: 'OPEN',
      },
    }),
  ])

  // Calculate total revenue
  const revenueResult = await prisma.payment.aggregate({
    _sum: {
      amount: true,
    },
    where: {
      status: 'COMPLETED',
    },
  })

  const totalRevenue = revenueResult._sum.amount || 0

  return {
    totalUsers,
    totalJobs,
    totalApplications,
    totalPayments,
    totalRevenue,
    recentUsers,
    recentJobs,
    pendingApplications,
    activeJobs,
  }
}

async function getRecentActivity() {
  const [recentUsers, recentJobs, recentApplications] = await Promise.all([
    prisma.user.findMany({
      take: 5,
      orderBy: { createdAt: 'desc' },
      include: {
        profile: true,
      },
    }),
    prisma.job.findMany({
      take: 5,
      orderBy: { createdAt: 'desc' },
      include: {
        employer: {
          include: {
            profile: true,
          },
        },
      },
    }),
    prisma.application.findMany({
      take: 5,
      orderBy: { createdAt: 'desc' },
      include: {
        freelancer: {
          include: {
            profile: true,
          },
        },
        job: true,
      },
    }),
  ])

  return {
    recentUsers,
    recentJobs,
    recentApplications,
  }
}

export async function AdminDashboard() {
  const [stats, activity] = await Promise.all([
    getDashboardStats(),
    getRecentActivity(),
  ])

  const statCards = [
    {
      title: 'Total Users',
      value: stats.totalUsers.toLocaleString(),
      change: `+${stats.recentUsers} this week`,
      icon: Users,
      color: 'text-blue-600',
      bgColor: 'bg-blue-100',
    },
    {
      title: 'Total Jobs',
      value: stats.totalJobs.toLocaleString(),
      change: `+${stats.recentJobs} this week`,
      icon: Briefcase,
      color: 'text-green-600',
      bgColor: 'bg-green-100',
    },
    {
      title: 'Applications',
      value: stats.totalApplications.toLocaleString(),
      change: `${stats.pendingApplications} pending`,
      icon: Clock,
      color: 'text-orange-600',
      bgColor: 'bg-orange-100',
    },
    {
      title: 'Revenue',
      value: `$${(stats.totalRevenue / 100).toLocaleString()}`,
      change: `${stats.totalPayments} payments`,
      icon: DollarSign,
      color: 'text-purple-600',
      bgColor: 'bg-purple-100',
    },
  ]

  return (
    <div className="space-y-6">
      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((stat) => (
          <Card key={stat.title}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">
                {stat.title}
              </CardTitle>
              <div className={`p-2 rounded-lg ${stat.bgColor}`}>
                <stat.icon className={`h-5 w-5 ${stat.color}`} />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gray-900">{stat.value}</div>
              <p className="text-xs text-gray-500 mt-1">{stat.change}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Activity Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
        {/* Recent Users */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg font-semibold">Recent Users</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {activity.recentUsers.map((user) => (
                <div key={user.id} className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-sm">
                      {user.profile?.firstName} {user.profile?.lastName}
                    </p>
                    <p className="text-xs text-gray-500">{user.email}</p>
                  </div>
                  <Badge variant={user.role === 'EMPLOYER' ? 'default' : 'secondary'}>
                    {user.role}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Recent Jobs */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg font-semibold">Recent Jobs</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {activity.recentJobs.map((job) => (
                <div key={job.id} className="space-y-1">
                  <p className="font-medium text-sm line-clamp-1">{job.title}</p>
                  <p className="text-xs text-gray-500">
                    by {job.employer.profile?.firstName} {job.employer.profile?.lastName}
                  </p>
                  <div className="flex items-center justify-between">
                    <Badge 
                      variant={job.status === 'OPEN' ? 'default' : 'secondary'}
                      className="text-xs"
                    >
                      {job.status}
                    </Badge>
                    <span className="text-xs text-gray-400">
                      {new Date(job.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Recent Applications */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg font-semibold">Recent Applications</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {activity.recentApplications.map((app) => (
                <div key={app.id} className="space-y-1">
                  <p className="font-medium text-sm line-clamp-1">{app.job.title}</p>
                  <p className="text-xs text-gray-500">
                    by {app.freelancer.profile?.firstName} {app.freelancer.profile?.lastName}
                  </p>
                  <div className="flex items-center justify-between">
                    <Badge 
                      variant={
                        app.status === 'PENDING' ? 'secondary' :
                        app.status === 'ACCEPTED' ? 'default' : 'destructive'
                      }
                      className="text-xs"
                    >
                      {app.status}
                    </Badge>
                    <span className="text-xs text-gray-400">
                      {new Date(app.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg font-semibold">Quick Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="flex items-center space-x-2 p-3 bg-blue-50 rounded-lg cursor-pointer hover:bg-blue-100 transition-colors">
              <Users className="h-5 w-5 text-blue-600" />
              <span className="text-sm font-medium text-blue-700">Manage Users</span>
            </div>
            <div className="flex items-center space-x-2 p-3 bg-green-50 rounded-lg cursor-pointer hover:bg-green-100 transition-colors">
              <Briefcase className="h-5 w-5 text-green-600" />
              <span className="text-sm font-medium text-green-700">Review Jobs</span>
            </div>
            <div className="flex items-center space-x-2 p-3 bg-orange-50 rounded-lg cursor-pointer hover:bg-orange-100 transition-colors">
              <AlertTriangle className="h-5 w-5 text-orange-600" />
              <span className="text-sm font-medium text-orange-700">Security Alerts</span>
            </div>
            <div className="flex items-center space-x-2 p-3 bg-purple-50 rounded-lg cursor-pointer hover:bg-purple-100 transition-colors">
              <TrendingUp className="h-5 w-5 text-purple-600" />
              <span className="text-sm font-medium text-purple-700">View Analytics</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}