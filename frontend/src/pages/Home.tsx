import { CourseCard } from '../components/course/CourseCard';
import { useCourses } from '../hooks/useCourseQueries';
import { useRef } from 'react';
import { motion } from 'framer-motion';
import { BookOpen, Users, Star, ArrowRight, CheckCircle, ChevronRight } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';

export const Home: React.FC = () => {
  const { user } = useAuth();
  const coursesRef = useRef<HTMLDivElement>(null);

  const scrollToCourses = () => {
    coursesRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const { data: coursesData = [], isLoading } = useCourses({ status: 'PUBLISHED' }, false);
  const courses = Array.isArray(coursesData)
    ? coursesData.map((c: any) => ({
        id: c.id,
        title: c.name,
        category: c.category?.name || 'Education',
        price: 0,
        thumbnail: c.thumbnailUrl,
        rating: c.rating || 0,
        students: c.totalStudents || 0,
        instructor: c.instructor?.name || 'Instructor',
      }))
    : [];

  return (
    <div className="bg-slate-950 text-slate-50 overflow-x-hidden">
      {/* Hero Section */}
      <section className="relative pt-20 pb-32 overflow-hidden">
        <div className="container mx-auto px-6 max-w-[1440px] relative z-10">
          <div className="flex flex-col lg:flex-row items-center gap-16">
            <motion.div
              initial={{ opacity: 0, x: -50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8 }}
              className="flex-1 text-center lg:text-left"
            >
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-sm font-bold mb-8">
                <Star className="w-4 h-4 fill-indigo-400" />
                <span>Top E-Learning Platform in 2024</span>
              </div>
              <h1 className="text-5xl lg:text-7xl font-black mb-8 leading-[1.1] tracking-tight">
                Master Any Skill <br />
                <span className="bg-gradient-to-r from-indigo-400 via-cyan-400 to-indigo-400 bg-clip-text text-transparent">
                  Anytime, Anywhere
                </span>
              </h1>
              <p className="text-xl text-slate-400 mb-10 max-w-2xl leading-relaxed">
                Join over 5,000+ students learning from the world's best instructors. Start your
                journey towards a professional career today.
              </p>
              <div className="flex flex-col sm:flex-row items-center gap-6 justify-center lg:justify-start">
                <button
                  onClick={scrollToCourses}
                  className="btn-primary px-10 py-5 rounded-2xl text-lg font-bold flex items-center gap-2 group shadow-xl shadow-indigo-500/20"
                >
                  Get Started Free
                  <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </button>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.8 }}
              className="flex-1 relative"
            >
              <div className="relative z-10 glass rounded-[2.5rem] border border-white/10 p-4 shadow-2xl">
                <img
                  src="https://images.unsplash.com/photo-1522202176988-66273c2fd55f?auto=format&fit=crop&q=80&w=1000"
                  alt="Learning"
                  className="rounded-[2rem] w-full"
                />
              </div>
              {/* Floating Cards */}
              <div className="absolute -top-10 -right-10 glass p-6 rounded-3xl border border-white/10 shadow-2xl z-20 animate-bounce-slow">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-green-500/20 rounded-2xl flex items-center justify-center text-green-400">
                    <CheckCircle className="w-6 h-6" />
                  </div>
                  <div>
                    <p className="text-sm font-bold">Certificate</p>
                    <p className="text-xs text-slate-500">Verified Skills</p>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-20 border-y border-white/5 bg-slate-900/30">
        <div className="container mx-auto px-6 max-w-[1440px]">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-12">
            {[
              {
                label: 'Active Students',
                value: '15,000+',
                icon: <Users className="w-6 h-6 text-indigo-400" />,
              },
              {
                label: 'Total Courses',
                value: '1,200+',
                icon: <BookOpen className="w-6 h-6 text-cyan-400" />,
              },
              {
                label: 'Expert Mentors',
                value: '300+',
                icon: <Star className="w-6 h-6 text-amber-400" />,
              },
              {
                label: 'Satisfaction Rate',
                value: '99%',
                icon: <CheckCircle className="w-6 h-6 text-green-400" />,
              },
            ].map((stat, i) => (
              <div key={i} className="text-center space-y-3">
                <div className="flex justify-center">{stat.icon}</div>
                <h3 className="text-4xl font-black">{stat.value}</h3>
                <p className="text-slate-500 font-medium">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Courses Section */}
      <section ref={coursesRef} className="py-32 bg-slate-950">
        <div className="container mx-auto px-6 max-w-[1440px]">
          <div className="flex flex-col md:flex-row items-end justify-between mb-16 gap-6">
            <div className="text-left">
              <h2 className="text-4xl font-bold mb-4">Explore Our Top Courses</h2>
              <p className="text-slate-400 max-w-2xl text-lg">
                Choose from hundreds of high-quality courses designed to help you succeed.
              </p>
            </div>
            <button className="px-6 py-3 border border-white/10 rounded-xl hover:bg-white/5 transition-all font-bold text-sm">
              View All Courses
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {isLoading ? (
              Array.from({ length: 4 }).map((_, i) => (
                <div
                  key={i}
                  className="glass rounded-3xl border border-white/10 h-[400px] animate-pulse bg-white/5"
                />
              ))
            ) : courses.length > 0 ? (
              courses.map((course) => <CourseCard key={course.id} course={course} />)
            ) : (
              <div className="col-span-full py-20 text-center">
                <p className="text-slate-500 italic">
                  No courses available at the moment. Check back later!
                </p>
              </div>
            )}
          </div>
        </div>
      </section>
      {/* CTA Section for Instructors - Only show for USER or Guests */}
      {(!user || user.role === 'USER') && (
        <section className="py-24 bg-slate-950 relative overflow-hidden">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full bg-indigo-600/5 blur-[120px] rounded-full"></div>
          <div className="container mx-auto px-6 max-w-[1440px] relative z-10">
            <div className="glass border border-white/10 rounded-[3.5rem] p-8 md:p-20 overflow-hidden relative group">
              <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/10 blur-[80px] rounded-full -mr-20 -mt-20 group-hover:bg-indigo-500/20 transition-all duration-700"></div>

              <div className="flex flex-col lg:flex-row items-center justify-between gap-12 relative z-10">
                <div className="flex-1 text-center lg:text-left">
                  <h2 className="text-4xl lg:text-6xl font-black mb-8 leading-tight">
                    Want to become <br />
                    <span className="text-indigo-400">our partner?</span>
                  </h2>
                  <p className="text-xl text-slate-400 mb-10 max-w-xl leading-relaxed">
                    Join our mission to empower learners worldwide. Share your expertise, grow your
                    brand, and earn while making an impact.
                  </p>
                  <a
                    href="/become-instructor"
                    className="inline-flex items-center gap-3 px-10 py-5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-2xl transition-all shadow-xl shadow-indigo-600/20 hover:scale-105 active:scale-95"
                  >
                    Join Us Today
                    <ChevronRight className="w-5 h-5" />
                  </a>
                </div>

                <div className="flex-1 grid grid-cols-2 gap-4 md:gap-8">
                  {[
                    {
                      label: 'Revenue Share',
                      value: 'Competitive',
                      icon: <Star className="w-5 h-5 text-amber-400" />,
                    },
                    {
                      label: 'Global Students',
                      value: '15k+',
                      icon: <Users className="w-5 h-5 text-indigo-400" />,
                    },
                    {
                      label: 'Teaching Tools',
                      value: 'Pro Suite',
                      icon: <BookOpen className="w-5 h-5 text-cyan-400" />,
                    },
                    {
                      label: 'Support',
                      value: '24/7',
                      icon: <CheckCircle className="w-5 h-5 text-green-400" />,
                    },
                  ].map((item, i) => (
                    <div
                      key={i}
                      className="bg-white/5 border border-white/5 p-6 rounded-3xl hover:bg-white/10 transition-all duration-300"
                    >
                      <div className="w-10 h-10 bg-white/5 rounded-xl flex items-center justify-center mb-4">
                        {item.icon}
                      </div>
                      <h3 className="text-xl font-bold mb-1">{item.value}</h3>
                      <p className="text-sm text-slate-500">{item.label}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>
      )}
    </div>
  );
};
