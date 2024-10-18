import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { LandingNavbar } from '@/components/LandingNavbar'

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-background">
      <LandingNavbar />
      <main className="container mx-auto px-6 py-12">
        <section className="text-center mb-12">
          <h1 className="text-4xl font-bold mb-4">Welcome to Optiroute</h1>
          <p className="text-xl text-muted-foreground mb-8">Optimize your delivery routes with AI-powered technology</p>
          <Button asChild size="lg">
            <Link href="/signup">Get Started</Link>
          </Button>
        </section>

        <section className="mb-12">
          <h2 className="text-3xl font-semibold mb-6">Features</h2>
          <div className="grid md:grid-cols-3 gap-6">
            {[
              { title: 'Dynamic Route Optimization', description: 'Real-time route adjustments based on traffic and priorities' },
              { title: 'Fleet Management', description: 'Comprehensive overview of your entire fleet' },
              { title: 'Delivery Tracking', description: 'Real-time updates on all your deliveries' },
            ].map((feature, index) => (
              <div key={index} className="bg-card text-card-foreground rounded-lg p-6 shadow-md">
                <h3 className="text-xl font-semibold mb-2">{feature.title}</h3>
                <p>{feature.description}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="text-center">
          <h2 className="text-3xl font-semibold mb-6">Ready to optimize your deliveries?</h2>
          <Button asChild size="lg">
            <Link href="/signup">Sign Up Now</Link>
          </Button>
        </section>
      </main>
    </div>
  )
}