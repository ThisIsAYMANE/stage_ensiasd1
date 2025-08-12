import { Star } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

const testimonials = [
  {
    id: 1,
    name: 'Sarah Chen',
    role: 'High School Student',
    avatar: 'https://images.pexels.com/photos/774909/pexels-photo-774909.jpeg',
    rating: 5,
    content: 'TutorConnect helped me improve my math grades from C to A+ in just 3 months. My tutor was patient, knowledgeable, and always available to help. The platform is so easy to use!',
  },
  {
    id: 2,
    name: 'Marcus Johnson',
    role: 'College Student',
    avatar: 'https://images.pexels.com/photos/1222271/pexels-photo-1222271.jpeg',
    rating: 5,
    content: 'As a chemistry major, I needed specialized help with organic chemistry. I found an amazing tutor who not only helped me understand complex concepts but also made learning enjoyable.',
  },
  {
    id: 3,
    name: 'Emily Rodriguez',
    role: 'Parent',
    avatar: 'https://images.pexels.com/photos/1239291/pexels-photo-1239291.jpeg',
    rating: 5,
    content: 'My daughter struggled with reading comprehension until we found her perfect tutor on TutorConnect. The progress has been remarkable, and she actually looks forward to her sessions now.',
  },
  {
    id: 4,
    name: 'David Kim',
    role: 'Professional',
    avatar: 'https://images.pexels.com/photos/614810/pexels-photo-614810.jpeg',
    rating: 5,
    content: 'Needed to brush up on my Spanish for a work opportunity. Found a native speaker tutor who was flexible with my schedule. Landed the job thanks to improved language skills!',
  },
  {
    id: 5,
    name: 'Lisa Thompson',
    role: 'Graduate Student',
    avatar: 'https://images.pexels.com/photos/1181519/pexels-photo-1181519.jpeg',
    rating: 5,
    content: 'The quality of tutors on TutorConnect is exceptional. My statistics tutor helped me not just pass my course but actually understand and enjoy the subject. Highly recommend!',
  },
  {
    id: 6,
    name: 'Ahmed Hassan',
    role: 'High School Student',
    avatar: 'https://images.pexels.com/photos/1681010/pexels-photo-1681010.jpeg',
    rating: 5,
    content: 'Physics used to be my worst subject. Thanks to my TutorConnect tutor, I not only improved my grades but also developed a genuine interest in the subject. Amazing platform!',
  },
];

export function TestimonialsSection() {
  return (
    <section className="py-20 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold text-text-primary mb-4">
            What Our Students Say
          </h2>
          <p className="text-xl text-text-secondary max-w-3xl mx-auto">
            Don't just take our word for it. Here's what our community of learners 
            and their families have to say about their TutorConnect experience.
          </p>
        </div>

        {/* Testimonials Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {testimonials.map((testimonial) => (
            <div 
              key={testimonial.id} 
              className="card-sharp p-6 hover:shadow-lg transition-shadow duration-300"
            >
              {/* Rating */}
              <div className="flex items-center mb-4">
                {[...Array(testimonial.rating)].map((_, i) => (
                  <Star key={i} className="h-5 w-5 text-yellow-400 fill-current" />
                ))}
              </div>

              {/* Content */}
              <blockquote className="text-text-secondary mb-6 leading-relaxed">
                "{testimonial.content}"
              </blockquote>

              {/* Author */}
              <div className="flex items-center">
                <Avatar className="h-12 w-12 mr-4">
                  <AvatarImage src={testimonial.avatar} alt={testimonial.name} />
                  <AvatarFallback>
                    {testimonial.name.split(' ').map(n => n[0]).join('')}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <div className="font-semibold text-text-primary">
                    {testimonial.name}
                  </div>
                  <div className="text-sm text-text-secondary">
                    {testimonial.role}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Bottom Statistics */}
        <div className="mt-16 text-center">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="text-4xl font-bold text-primary mb-2">98%</div>
              <div className="text-text-secondary">Student Satisfaction Rate</div>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold text-primary mb-2">50k+</div>
              <div className="text-text-secondary">Successful Sessions</div>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold text-primary mb-2">4.9</div>
              <div className="text-text-secondary">Average Tutor Rating</div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}