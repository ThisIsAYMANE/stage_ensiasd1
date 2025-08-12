import { Shield, Clock, Star, Video, MessageSquare, CreditCard } from 'lucide-react';

const benefits = [
  {
    icon: Shield,
    title: 'Verified Tutors',
    description: 'All tutors are thoroughly vetted and verified with proper qualifications and background checks.',
  },
  {
    icon: Clock,
    title: 'Flexible Scheduling',
    description: 'Book lessons that fit your schedule with 24/7 availability and instant booking confirmation.',
  },
  {
    icon: Star,
    title: 'Quality Guaranteed',
    description: 'Rated tutors with proven track records and student success stories. Satisfaction guaranteed.',
  },
  {
    icon: Video,
    title: 'Online Sessions',
    description: 'Seamless video calls with integrated Google Meet for convenient remote learning.',
  },
  {
    icon: MessageSquare,
    title: 'Direct Communication',
    description: 'Chat directly with tutors before booking and stay connected throughout your learning journey.',
  },
  {
    icon: CreditCard,
    title: 'Secure Payments',
    description: 'Safe and secure payment processing with transparent pricing and no hidden fees.',
  },
];

export function BenefitsSection() {
  return (
    <section className="py-20 bg-light-bg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold text-text-primary mb-4">
            Why Choose TutorConnect?
          </h2>
          <p className="text-xl text-text-secondary max-w-3xl mx-auto">
            Experience the future of personalized learning with our comprehensive platform 
            designed to connect you with the perfect tutor for your needs.
          </p>
        </div>

        {/* Benefits Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {benefits.map((benefit, index) => {
            const IconComponent = benefit.icon;
            return (
              <div 
                key={index} 
                className="card-sharp p-8 hover:shadow-lg transition-shadow duration-300 group"
              >
                <div className="inline-flex items-center justify-center w-14 h-14 bg-primary/10 text-primary rounded-lg mb-6 group-hover:bg-primary group-hover:text-white transition-colors duration-300">
                  <IconComponent className="h-7 w-7" />
                </div>
                <h3 className="text-xl font-semibold text-text-primary mb-3">
                  {benefit.title}
                </h3>
                <p className="text-text-secondary leading-relaxed">
                  {benefit.description}
                </p>
              </div>
            );
          })}
        </div>

        {/* Bottom CTA */}
        <div className="text-center mt-16">
          <p className="text-lg text-text-secondary mb-6">
            Ready to start your learning journey?
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button className="btn-primary text-lg py-3 px-8">
              Browse Tutors
            </button>
            <button className="btn-secondary text-lg py-3 px-8">
              Learn More
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}