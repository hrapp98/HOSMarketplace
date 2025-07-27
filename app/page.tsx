import Link from "next/link"
import Image from "next/image"

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white dark:from-gray-900 dark:to-gray-800">
      {/* Navigation */}
      <nav className="fixed top-0 w-full bg-white/80 dark:bg-gray-900/80 backdrop-blur-md z-50 border-b border-gray-200 dark:border-gray-700">
        <div className="container-max section-padding py-4">
          <div className="flex items-center justify-between">
            <Link href="/" className="flex items-center space-x-2">
              <div className="w-10 h-10 bg-primary-500 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-xl">HO</span>
              </div>
              <span className="text-2xl font-bold text-gray-900 dark:text-white">HireOverseas</span>
            </Link>
            
            <div className="hidden md:flex items-center space-x-8">
              <Link href="/talent" className="text-gray-600 dark:text-gray-300 hover:text-primary-500 transition-smooth">
                Find Talent
              </Link>
              <Link href="/jobs" className="text-gray-600 dark:text-gray-300 hover:text-primary-500 transition-smooth">
                Find Work
              </Link>
              <Link href="/how-it-works" className="text-gray-600 dark:text-gray-300 hover:text-primary-500 transition-smooth">
                How It Works
              </Link>
              <Link href="/pricing" className="text-gray-600 dark:text-gray-300 hover:text-primary-500 transition-smooth">
                Pricing
              </Link>
            </div>
            
            <div className="flex items-center space-x-4">
              <Link href="/auth/signin" className="text-gray-600 dark:text-gray-300 hover:text-primary-500 transition-smooth">
                Sign In
              </Link>
              <Link href="/auth/signup" className="btn-primary">
                Get Started
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-32 pb-20 section-padding">
        <div className="container-max">
          <div className="text-center max-w-4xl mx-auto">
            <h1 className="text-5xl md:text-6xl font-bold text-gray-900 dark:text-white mb-6">
              Hire Exceptional Full-Time 
              <span className="text-primary-500"> Overseas Talent</span>
            </h1>
            <p className="text-xl text-gray-600 dark:text-gray-300 mb-8">
              Connect with pre-vetted professionals from around the world. Build your remote team with top-tier talent at competitive rates.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/auth/signup?role=employer" className="btn-primary text-lg px-8 py-4">
                Hire Talent
              </Link>
              <Link href="/auth/signup?role=freelancer" className="btn-outline text-lg px-8 py-4">
                Apply as Talent
              </Link>
            </div>
          </div>
          
          <div className="mt-16 grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            <div>
              <div className="text-4xl font-bold text-primary-500">10K+</div>
              <div className="text-gray-600 dark:text-gray-400">Verified Professionals</div>
            </div>
            <div>
              <div className="text-4xl font-bold text-primary-500">50+</div>
              <div className="text-gray-600 dark:text-gray-400">Countries</div>
            </div>
            <div>
              <div className="text-4xl font-bold text-primary-500">95%</div>
              <div className="text-gray-600 dark:text-gray-400">Success Rate</div>
            </div>
            <div>
              <div className="text-4xl font-bold text-primary-500">24h</div>
              <div className="text-gray-600 dark:text-gray-400">Avg Response Time</div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-white dark:bg-gray-800 section-padding">
        <div className="container-max">
          <h2 className="text-4xl font-bold text-center text-gray-900 dark:text-white mb-16">
            Why Choose HireOverseas?
          </h2>
          
          <div className="grid md:grid-cols-3 gap-8">
            <div className="card text-center">
              <div className="w-16 h-16 bg-primary-100 dark:bg-primary-900 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-primary-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold mb-2">Pre-Vetted Talent</h3>
              <p className="text-gray-600 dark:text-gray-400">
                Every professional is thoroughly screened for skills, experience, and communication abilities.
              </p>
            </div>
            
            <div className="card text-center">
              <div className="w-16 h-16 bg-primary-100 dark:bg-primary-900 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-primary-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold mb-2">Cost-Effective</h3>
              <p className="text-gray-600 dark:text-gray-400">
                Access global talent at competitive rates without compromising on quality.
              </p>
            </div>
            
            <div className="card text-center">
              <div className="w-16 h-16 bg-primary-100 dark:bg-primary-900 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-primary-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold mb-2">Fast Hiring</h3>
              <p className="text-gray-600 dark:text-gray-400">
                Connect with qualified candidates within 24 hours and hire in days, not months.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-20 section-padding">
        <div className="container-max">
          <h2 className="text-4xl font-bold text-center text-gray-900 dark:text-white mb-16">
            How It Works
          </h2>
          
          <div className="grid md:grid-cols-2 gap-16 items-center">
            <div>
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-8">For Employers</h3>
              <div className="space-y-6">
                <div className="flex gap-4">
                  <div className="flex-shrink-0 w-10 h-10 bg-primary-500 text-white rounded-full flex items-center justify-center font-bold">
                    1
                  </div>
                  <div>
                    <h4 className="font-semibold mb-1">Post Your Job</h4>
                    <p className="text-gray-600 dark:text-gray-400">
                      Describe your requirements and ideal candidate profile
                    </p>
                  </div>
                </div>
                
                <div className="flex gap-4">
                  <div className="flex-shrink-0 w-10 h-10 bg-primary-500 text-white rounded-full flex items-center justify-center font-bold">
                    2
                  </div>
                  <div>
                    <h4 className="font-semibold mb-1">Review Applications</h4>
                    <p className="text-gray-600 dark:text-gray-400">
                      Get matched with pre-vetted professionals within 24 hours
                    </p>
                  </div>
                </div>
                
                <div className="flex gap-4">
                  <div className="flex-shrink-0 w-10 h-10 bg-primary-500 text-white rounded-full flex items-center justify-center font-bold">
                    3
                  </div>
                  <div>
                    <h4 className="font-semibold mb-1">Interview & Hire</h4>
                    <p className="text-gray-600 dark:text-gray-400">
                      Conduct interviews and make your hiring decision
                    </p>
                  </div>
                </div>
              </div>
            </div>
            
            <div>
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-8">For Talent</h3>
              <div className="space-y-6">
                <div className="flex gap-4">
                  <div className="flex-shrink-0 w-10 h-10 bg-secondary-500 text-white rounded-full flex items-center justify-center font-bold">
                    1
                  </div>
                  <div>
                    <h4 className="font-semibold mb-1">Create Your Profile</h4>
                    <p className="text-gray-600 dark:text-gray-400">
                      Showcase your skills, experience, and portfolio
                    </p>
                  </div>
                </div>
                
                <div className="flex gap-4">
                  <div className="flex-shrink-0 w-10 h-10 bg-secondary-500 text-white rounded-full flex items-center justify-center font-bold">
                    2
                  </div>
                  <div>
                    <h4 className="font-semibold mb-1">Apply to Jobs</h4>
                    <p className="text-gray-600 dark:text-gray-400">
                      Browse and apply to full-time remote positions
                    </p>
                  </div>
                </div>
                
                <div className="flex gap-4">
                  <div className="flex-shrink-0 w-10 h-10 bg-secondary-500 text-white rounded-full flex items-center justify-center font-bold">
                    3
                  </div>
                  <div>
                    <h4 className="font-semibold mb-1">Get Hired</h4>
                    <p className="text-gray-600 dark:text-gray-400">
                      Interview with employers and start your remote career
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Categories */}
      <section className="py-20 bg-gray-50 dark:bg-gray-900 section-padding">
        <div className="container-max">
          <h2 className="text-4xl font-bold text-center text-gray-900 dark:text-white mb-16">
            Popular Categories
          </h2>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {[
              "Software Development",
              "Digital Marketing",
              "Customer Support",
              "Virtual Assistant",
              "Graphic Design",
              "Content Writing",
              "Data Entry",
              "Accounting"
            ].map((category) => (
              <Link
                key={category}
                href={`/talent?category=${encodeURIComponent(category)}`}
                className="card hover:border-primary-500 text-center group"
              >
                <h3 className="font-semibold group-hover:text-primary-500 transition-smooth">
                  {category}
                </h3>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-primary-500 section-padding">
        <div className="container-max text-center">
          <h2 className="text-4xl font-bold text-white mb-6">
            Ready to Build Your Remote Team?
          </h2>
          <p className="text-xl text-primary-100 mb-8 max-w-2xl mx-auto">
            Join thousands of companies that have found their perfect overseas talent through HireOverseas.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/auth/signup?role=employer" className="bg-white text-primary-500 px-8 py-4 rounded-lg font-semibold hover:bg-gray-100 transition-smooth">
              Start Hiring Today
            </Link>
            <Link href="/talent" className="border-2 border-white text-white px-8 py-4 rounded-lg font-semibold hover:bg-white hover:text-primary-500 transition-smooth">
              Browse Talent
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 bg-gray-900 text-white section-padding">
        <div className="container-max">
          <div className="grid md:grid-cols-4 gap-8 mb-8">
            <div>
              <div className="flex items-center space-x-2 mb-4">
                <div className="w-10 h-10 bg-primary-500 rounded-lg flex items-center justify-center">
                  <span className="text-white font-bold text-xl">HO</span>
                </div>
                <span className="text-2xl font-bold">HireOverseas</span>
              </div>
              <p className="text-gray-400">
                Connect with exceptional overseas talent for full-time remote positions.
              </p>
            </div>
            
            <div>
              <h4 className="font-semibold mb-4">For Employers</h4>
              <ul className="space-y-2 text-gray-400">
                <li><Link href="/how-it-works" className="hover:text-white transition-smooth">How It Works</Link></li>
                <li><Link href="/talent" className="hover:text-white transition-smooth">Browse Talent</Link></li>
                <li><Link href="/pricing" className="hover:text-white transition-smooth">Pricing</Link></li>
                <li><Link href="/success-stories" className="hover:text-white transition-smooth">Success Stories</Link></li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-semibold mb-4">For Talent</h4>
              <ul className="space-y-2 text-gray-400">
                <li><Link href="/jobs" className="hover:text-white transition-smooth">Find Jobs</Link></li>
                <li><Link href="/resources" className="hover:text-white transition-smooth">Resources</Link></li>
                <li><Link href="/blog" className="hover:text-white transition-smooth">Blog</Link></li>
                <li><Link href="/faq" className="hover:text-white transition-smooth">FAQ</Link></li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-semibold mb-4">Company</h4>
              <ul className="space-y-2 text-gray-400">
                <li><Link href="/about" className="hover:text-white transition-smooth">About Us</Link></li>
                <li><Link href="/contact" className="hover:text-white transition-smooth">Contact</Link></li>
                <li><Link href="/privacy" className="hover:text-white transition-smooth">Privacy Policy</Link></li>
                <li><Link href="/terms" className="hover:text-white transition-smooth">Terms of Service</Link></li>
              </ul>
            </div>
          </div>
          
          <div className="border-t border-gray-800 pt-8 text-center text-gray-400">
            <p>&copy; 2024 HireOverseas. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}