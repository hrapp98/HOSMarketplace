import { Metadata } from 'next'
import Link from 'next/link'
import { FileQuestion, Home, ArrowLeft, Search } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'

export const metadata: Metadata = {
  title: '404 - Page Not Found | HireOverseas',
  description: 'The page you are looking for could not be found.',
}

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <div className="bg-blue-100 p-4 rounded-full">
              <FileQuestion className="h-12 w-12 text-blue-600" />
            </div>
          </div>
          <CardTitle className="text-2xl text-gray-900">
            Page Not Found
          </CardTitle>
        </CardHeader>
        <CardContent className="text-center space-y-4">
          <p className="text-gray-600">
            The page you're looking for doesn't exist or has been moved.
          </p>
          
          <div className="space-y-2">
            <Button asChild className="w-full">
              <Link href="/">
                <Home className="h-4 w-4 mr-2" />
                Go Home
              </Link>
            </Button>
            
            <Button asChild variant="outline" className="w-full">
              <Link href="/jobs">
                <Search className="h-4 w-4 mr-2" />
                Browse Jobs
              </Link>
            </Button>
            
            <Button 
              onClick={() => window.history.back()} 
              variant="ghost" 
              className="w-full"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Go Back
            </Button>
          </div>
          
          <div className="pt-4 border-t border-gray-200">
            <p className="text-sm text-gray-500">
              Need help? Contact{' '}
              <a 
                href="mailto:support@hireoverseas.com"
                className="text-blue-600 hover:text-blue-800"
              >
                support@hireoverseas.com
              </a>
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}