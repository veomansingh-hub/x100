import { siteConfig } from '@/data/config';
import Image from 'next/image';
import { Navigation } from '@/components/Navigation';

export default function StoryPage() {
  const startDate = new Date(siteConfig.relationshipStartDate);
  const today = new Date();
  const diffTime = Math.abs(today.getTime() - startDate.getTime());
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  const timeline = [
    { year: '2024', title: 'We met', description: 'Coffee at the local roastery.' },
    { year: '2024', title: 'First Trip', description: 'Weekend in the mountains.' },
    { year: '2025', title: 'Moving in', description: 'Our first shared apartment.' },
    { year: '2026', title: 'Paris', description: 'A dream week in France.' },
  ];

  return (
    <>
      <Navigation />
      <main className="min-h-screen pt-40 pb-32 bg-background text-foreground">
        <div className="max-w-4xl mx-auto px-6">
        <h1 className="text-4xl md:text-5xl font-serif tracking-tight mb-12">Our Story</h1>
        
        <p className="text-xl md:text-2xl text-muted-foreground font-serif tracking-wide mb-24">
          {siteConfig.introText}
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-16 mb-32">
          <div>
            <h3 className="text-sm uppercase tracking-widest text-muted-foreground mb-4">Timeline</h3>
            <div className="space-y-8">
              {timeline.map((item, idx) => (
                <div key={idx} className="flex gap-6 border-l border-muted pl-6">
                  <div className="w-12 text-sm text-muted-foreground pt-1">{item.year}</div>
                  <div>
                    <h4 className="text-lg font-medium tracking-tight">{item.title}</h4>
                    <p className="text-muted-foreground">{item.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
          
          <div>
            <h3 className="text-sm uppercase tracking-widest text-muted-foreground mb-4">By the numbers</h3>
            <div className="space-y-8 mt-6">
              <div>
                <div className="text-5xl font-serif tracking-tight mb-2">{diffDays}</div>
                <div className="text-sm uppercase tracking-widest text-muted-foreground">Days together</div>
              </div>
              <div>
                <div className="text-5xl font-serif tracking-tight mb-2">6</div>
                <div className="text-sm uppercase tracking-widest text-muted-foreground">Countries visited</div>
              </div>
              <div>
                <div className="text-5xl font-serif tracking-tight mb-2">∞</div>
                <div className="text-sm uppercase tracking-widest text-muted-foreground">Memories made</div>
              </div>
            </div>
          </div>
        </div>

        <div className="w-full aspect-video relative bg-muted mb-8">
          {/* Main story photo */}
          <Image
            src="https://images.unsplash.com/photo-1518199266791-5375a83164ba?q=80&w=2000&auto=format&fit=crop"
            alt="Us"
            fill
            className="object-cover"
          />
        </div>
        </div>
      </main>
    </>
  );
}
