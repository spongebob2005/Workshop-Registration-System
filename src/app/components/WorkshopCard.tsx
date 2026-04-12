import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Badge } from './ui/badge';
import { Calendar, Clock, Users, DollarSign, ArrowRight, BookOpen } from 'lucide-react';
import { Workshop } from '../contexts/WorkshopContext';
import { ImageWithFallback } from './figma/ImageWithFallback';
import { motion } from 'motion/react';

interface WorkshopCardProps {
  workshop: Workshop;
}

const CATEGORY_GRADIENTS: Record<string, string> = {
  'Web Development': 'from-blue-500 to-indigo-600',
  'Design': 'from-pink-500 to-rose-600',
  'Data Science': 'from-purple-500 to-violet-600',
  'Marketing': 'from-orange-500 to-amber-600',
  'Cloud Computing': 'from-cyan-500 to-blue-600',
  'Mobile Development': 'from-green-500 to-emerald-600',
  'Security': 'from-red-500 to-rose-600',
  'Blockchain': 'from-yellow-500 to-amber-600',
};

const CATEGORY_LIGHT: Record<string, string> = {
  'Web Development': 'bg-blue-50 text-blue-700',
  'Design': 'bg-pink-50 text-pink-700',
  'Data Science': 'bg-purple-50 text-purple-700',
  'Marketing': 'bg-orange-50 text-orange-700',
  'Cloud Computing': 'bg-cyan-50 text-cyan-700',
  'Mobile Development': 'bg-green-50 text-green-700',
  'Security': 'bg-red-50 text-red-700',
  'Blockchain': 'bg-yellow-50 text-yellow-700',
};

export const WorkshopCard = ({ workshop }: WorkshopCardProps) => {
  const navigate = useNavigate();
  const [imgLoaded, setImgLoaded] = useState(false);

  const seatPercentage = (workshop.availableSeats / workshop.totalSeats) * 100;
  const getSeatStatus = () => {
    if (seatPercentage > 50) return { bar: 'bg-gradient-to-r from-green-400 to-emerald-500', text: 'Available', dot: 'bg-green-500', badge: 'bg-green-50 text-green-700' };
    if (seatPercentage > 20) return { bar: 'bg-gradient-to-r from-yellow-400 to-amber-500', text: 'Filling Fast', dot: 'bg-yellow-500', badge: 'bg-yellow-50 text-yellow-700' };
    if (seatPercentage > 0) return { bar: 'bg-gradient-to-r from-orange-400 to-orange-500', text: 'Almost Full', dot: 'bg-orange-500', badge: 'bg-orange-50 text-orange-700' };
    return { bar: 'bg-gradient-to-r from-red-400 to-red-500', text: 'Sold Out', dot: 'bg-red-500', badge: 'bg-red-50 text-red-700' };
  };

  const seatStatus = getSeatStatus();
  const gradient = CATEGORY_GRADIENTS[workshop.category] || 'from-indigo-500 to-purple-600';
  const categoryLight = CATEGORY_LIGHT[workshop.category] || 'bg-indigo-50 text-indigo-700';

  return (
    <motion.div
      whileHover={{ y: -6, transition: { duration: 0.2 } }}
      className="group bg-white rounded-2xl overflow-hidden border border-gray-100 shadow-sm hover:shadow-xl hover:shadow-gray-200/60 transition-shadow duration-300 flex flex-col h-full"
    >
      {/* Image */}
      <div className={`relative h-48 overflow-hidden bg-gradient-to-br ${gradient}`}>
        {!imgLoaded && workshop.image && (
          <div className="absolute inset-0 animate-pulse bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200" />
        )}
        {workshop.image ? (
          <ImageWithFallback
            src={workshop.image}
            alt={workshop.title}
            className={`w-full h-full object-cover transition-all duration-700 group-hover:scale-110 ${imgLoaded ? 'opacity-100' : 'opacity-0'}`}
            onLoad={() => setImgLoaded(true)}
          />
        ) : (
          <div className="flex items-center justify-center h-full opacity-30">
            <svg xmlns="http://www.w3.org/2000/svg" className="size-16 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
        )}
        {/* Gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />

        {/* Category badge */}
        <div className={`absolute top-3 left-3 px-2.5 py-1 rounded-lg text-xs font-medium ${categoryLight} backdrop-blur-sm`}>
          {workshop.category}
        </div>

        {/* Price badge */}
        <div className="absolute top-3 right-3 bg-white/95 backdrop-blur-sm rounded-xl px-2.5 py-1 flex items-center gap-0.5">
          <DollarSign className="size-3 text-green-600" />
          <span className="text-sm font-semibold text-green-700">{workshop.price}</span>
        </div>

        {/* Bottom overlay content */}
        <div className="absolute bottom-3 left-3 right-3 flex items-end justify-between">
          <div className={`flex items-center gap-1.5 px-2 py-1 rounded-lg text-xs font-medium ${seatStatus.badge} backdrop-blur-sm`}>
            <span className={`size-1.5 rounded-full ${seatStatus.dot}`} />
            {seatStatus.text}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="p-5 flex-1 flex flex-col">
        <h3 className="text-base text-gray-900 mb-1 line-clamp-2 leading-snug group-hover:text-indigo-700 transition-colors">
          {workshop.title}
        </h3>
        <p className="text-sm text-gray-500 mb-3 flex items-center gap-1.5">
          <BookOpen className="size-3.5" />
          {workshop.instructor}
        </p>

        <p className="text-sm text-gray-600 line-clamp-2 mb-4">{workshop.description}</p>

        {/* Date & Duration row */}
        <div className="flex items-center gap-4 text-xs text-gray-500 mb-4">
          <div className="flex items-center gap-1.5">
            <Calendar className="size-3.5 text-indigo-400" />
            {new Date(workshop.date).toLocaleDateString('en-US', {
              month: 'short',
              day: 'numeric',
              year: 'numeric',
            })}
          </div>
          <div className="flex items-center gap-1.5">
            <Clock className="size-3.5 text-indigo-400" />
            {workshop.duration}
          </div>
        </div>

        {/* Seat progress bar */}
        <div className="mb-4">
          <div className="flex items-center justify-between text-xs text-gray-500 mb-1.5">
            <div className="flex items-center gap-1">
              <Users className="size-3.5" />
              <span>{workshop.availableSeats} / {workshop.totalSeats} seats left</span>
            </div>
            <span className="font-medium">{Math.round(seatPercentage)}%</span>
          </div>
          <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${100 - seatPercentage}%` }}
              transition={{ duration: 0.8, ease: 'easeOut', delay: 0.2 }}
              className={`h-full rounded-full ${seatStatus.bar}`}
            />
          </div>
        </div>

        {/* Skills */}
        <div className="flex flex-wrap gap-1.5 mb-5">
          {workshop.skills.slice(0, 3).map(skill => (
            <span key={skill} className="px-2 py-0.5 bg-gray-100 text-gray-600 rounded-md text-xs">
              {skill}
            </span>
          ))}
          {workshop.skills.length > 3 && (
            <span className="px-2 py-0.5 bg-gray-100 text-gray-400 rounded-md text-xs">
              +{workshop.skills.length - 3}
            </span>
          )}
        </div>

        {/* Action */}
        <div className="mt-auto">
          <button
            onClick={() => navigate(`/workshop/${workshop.id}`)}
            disabled={workshop.availableSeats === 0}
            className={`w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 ${
              workshop.availableSeats === 0
                ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                : 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white hover:from-indigo-700 hover:to-purple-700 shadow-md shadow-indigo-200/50 hover:shadow-indigo-300/50 group-hover:gap-3'
            }`}
          >
            {workshop.availableSeats === 0 ? 'Sold Out' : 'View Details'}
            {workshop.availableSeats > 0 && (
              <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" />
            )}
          </button>
        </div>
      </div>
    </motion.div>
  );
};