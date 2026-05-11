import React, { createContext, useContext, useState, useEffect } from 'react';
import { api } from '../api/client';

export interface LearningContent {
  pdfs: { title: string; url: string }[];
  videos: { title: string; url: string; duration: string }[];
  mcqs: { title: string; questions: number }[];
}

export interface Workshop {
  id: string;
  title: string;
  instructor: string;
  date: string;
  time: string;
  duration: string;
  category: string;
  description: string;
  price: number;
  totalSeats: number;
  availableSeats: number;
  image: string;
  skills: string[];
  learningContent: LearningContent;
}

export interface Booking {
  id: string;
  userId: string;
  workshopId: string;
  bookingDate: string;
  paymentId: string;
  status: 'confirmed' | 'cancelled';
  amount: number;
}

interface WorkshopContextType {
  workshops: Workshop[];
  bookings: Booking[];
  loading: boolean;
  addBooking: (booking: Booking) => Promise<void>;
  cancelBooking: (bookingId: string) => Promise<void>;
  getBookingsByUser: (userId: string) => Booking[];
  getWorkshopById: (id: string) => Workshop | undefined;
  updateSeatAvailability: (workshopId: string, seatsToDeduct: number) => Promise<void>;
  getBookingsByWorkshop: (workshopId: string) => Booking[];
}

const WorkshopContext = createContext<WorkshopContextType | undefined>(undefined);

const INITIAL_WORKSHOPS: Workshop[] = [
  {
    id: '1',
    title: 'Advanced React Patterns & Best Practices',
    instructor: 'Sarah Johnson',
    date: '2026-04-15',
    time: '10:00 AM',
    duration: '3 hours',
    category: 'Web Development',
    description: 'Deep dive into advanced React patterns including Compound Components, Render Props, Custom Hooks, and State Management strategies. Perfect for developers looking to level up their React skills.',
    price: 89.99,
    totalSeats: 50,
    availableSeats: 50,
    image: 'programming workspace laptop',
    skills: ['React', 'JavaScript', 'State Management', 'Hooks'],
    learningContent: {
      pdfs: [
        { title: 'React Official Documentation', url: 'https://react.dev/' },
        { title: 'React Hooks Guide', url: 'https://react.dev/reference/react' }
      ],
      videos: [
        { title: 'React in 100 Seconds', url: 'https://www.youtube.com/watch?v=Tn6-PIqc4UM', duration: '2:15' },
        { title: 'React Hooks Tutorial', url: 'https://www.youtube.com/watch?v=TNhaISOUy6Q', duration: '38:25' },
        { title: 'Advanced React Patterns', url: 'https://www.youtube.com/watch?v=FYXLNpYZNKk', duration: '42:10' }
      ],
      mcqs: [
        { title: 'React Fundamentals Quiz', questions: 15 },
        { title: 'Hooks Deep Dive Quiz', questions: 20 }
      ]
    },
  },
  {
    id: '2',
    title: 'UI/UX Design Fundamentals',
    instructor: 'Michael Chen',
    date: '2026-04-18',
    time: '2:00 PM',
    duration: '4 hours',
    category: 'Design',
    description: 'Learn the core principles of user interface and user experience design. Covers design thinking, prototyping, user research, and creating accessible interfaces.',
    price: 79.99,
    totalSeats: 40,
    availableSeats: 35,
    image: 'ui design sketching wireframe',
    skills: ['Figma', 'User Research', 'Prototyping', 'Accessibility'],
    learningContent: {
      pdfs: [
        { title: 'Figma Official Documentation', url: 'https://help.figma.com/' },
        { title: 'Material Design Guidelines', url: 'https://m3.material.io/' }
      ],
      videos: [
        { title: 'UI Design for Beginners', url: 'https://www.youtube.com/watch?v=c9Wg6Cb_YlU', duration: '23:45' },
        { title: 'Figma Tutorial for Beginners', url: 'https://www.youtube.com/watch?v=FTFaQWZBqQ8', duration: '41:32' },
        { title: 'UX Design Process Explained', url: 'https://www.youtube.com/watch?v=RlQEoJaLQRA', duration: '15:20' }
      ],
      mcqs: [
        { title: 'Design Principles Quiz', questions: 12 },
        { title: 'Figma Mastery Assessment', questions: 18 }
      ]
    },
  },
  {
    id: '3',
    title: 'Python for Data Science',
    instructor: 'Dr. Emily Rodriguez',
    date: '2026-04-22',
    time: '9:00 AM',
    duration: '5 hours',
    category: 'Data Science',
    description: 'Comprehensive introduction to Python for data analysis. Covers NumPy, Pandas, data visualization with Matplotlib, and basic machine learning concepts.',
    price: 99.99,
    totalSeats: 60,
    availableSeats: 42,
    image: 'data science analytics charts',
    skills: ['Python', 'Pandas', 'NumPy', 'Machine Learning'],
    learningContent: {
      pdfs: [
        { title: 'Python Official Documentation', url: 'https://docs.python.org/3/' },
        { title: 'Pandas User Guide', url: 'https://pandas.pydata.org/docs/user_guide/index.html' }
      ],
      videos: [
        { title: 'Python for Beginners', url: 'https://www.youtube.com/watch?v=rfscVS0vtbw', duration: '4:26:52' },
        { title: 'Pandas Tutorial', url: 'https://www.youtube.com/watch?v=vmEHCJofslg', duration: '1:00:27' },
        { title: 'Data Science with Python', url: 'https://www.youtube.com/watch?v=ua-CiDNNj30', duration: '12:15:50' }
      ],
      mcqs: [
        { title: 'Python Basics Quiz', questions: 20 },
        { title: 'Data Analysis Assessment', questions: 25 }
      ]
    },
  },
  {
    id: '4',
    title: 'Digital Marketing Strategy 2026',
    instructor: 'James Williams',
    date: '2026-04-25',
    time: '1:00 PM',
    duration: '3 hours',
    category: 'Marketing',
    description: 'Master modern digital marketing strategies including SEO, content marketing, social media advertising, and analytics. Learn to create effective campaigns.',
    price: 69.99,
    totalSeats: 45,
    availableSeats: 28,
    image: 'digital marketing social media',
    skills: ['SEO', 'Content Marketing', 'Analytics', 'Social Media'],
    learningContent: {
      pdfs: [
        { title: 'Google Analytics Documentation', url: 'https://support.google.com/analytics' },
        { title: 'SEO Starter Guide', url: 'https://developers.google.com/search/docs/fundamentals/seo-starter-guide' }
      ],
      videos: [
        { title: 'Digital Marketing Full Course', url: 'https://www.youtube.com/watch?v=nU-IIXBWlS4', duration: '10:55:18' },
        { title: 'SEO for Beginners', url: 'https://www.youtube.com/watch?v=-B58GgsehKQ', duration: '2:00:39' },
        { title: 'Social Media Marketing Strategy', url: 'https://www.youtube.com/watch?v=LKjbTGLgGj8', duration: '45:30' }
      ],
      mcqs: [
        { title: 'SEO Fundamentals Quiz', questions: 15 },
        { title: 'Marketing Strategy Assessment', questions: 18 }
      ]
    },
  },
  {
    id: '5',
    title: 'Cloud Architecture with AWS',
    instructor: 'Robert Kumar',
    date: '2026-04-28',
    time: '11:00 AM',
    duration: '4 hours',
    category: 'Cloud Computing',
    description: 'Learn to design and implement scalable cloud solutions using AWS. Covers EC2, S3, Lambda, and best practices for cloud architecture.',
    price: 119.99,
    totalSeats: 35,
    availableSeats: 20,
    image: 'cloud computing servers technology',
    skills: ['AWS', 'Cloud Architecture', 'DevOps', 'Scalability'],
    learningContent: {
      pdfs: [
        { title: 'AWS Official Documentation', url: 'https://docs.aws.amazon.com/' },
        { title: 'AWS Well-Architected Framework', url: 'https://aws.amazon.com/architecture/well-architected/' }
      ],
      videos: [
        { title: 'AWS Tutorial for Beginners', url: 'https://www.youtube.com/watch?v=ulprqHHWlng', duration: '3:55:48' },
        { title: 'AWS Certified Solutions Architect', url: 'https://www.youtube.com/watch?v=Ia-UEYYR44s', duration: '10:26:49' },
        { title: 'AWS Lambda Tutorial', url: 'https://www.youtube.com/watch?v=97q30JjEq9Y', duration: '19:35' }
      ],
      mcqs: [
        { title: 'AWS Fundamentals Quiz', questions: 20 },
        { title: 'Cloud Architecture Assessment', questions: 25 }
      ]
    },
  },
  {
    id: '6',
    title: 'Mobile App Development with React Native',
    instructor: 'Lisa Zhang',
    date: '2026-05-02',
    time: '10:00 AM',
    duration: '5 hours',
    category: 'Mobile Development',
    description: 'Build cross-platform mobile applications using React Native. Learn navigation, state management, native modules, and deployment to App Store and Play Store.',
    price: 94.99,
    totalSeats: 40,
    availableSeats: 38,
    image: 'mobile app development smartphone',
    skills: ['React Native', 'Mobile Dev', 'iOS', 'Android'],
    learningContent: {
      pdfs: [
        { title: 'React Native Documentation', url: 'https://reactnative.dev/docs/getting-started' },
        { title: 'Expo Documentation', url: 'https://docs.expo.dev/' }
      ],
      videos: [
        { title: 'React Native Tutorial', url: 'https://www.youtube.com/watch?v=0-S5a0eXPoc', duration: '2:57:42' },
        { title: 'Build a React Native App', url: 'https://www.youtube.com/watch?v=obH0Po_RdWk', duration: '3:08:50' },
        { title: 'React Native Crash Course', url: 'https://www.youtube.com/watch?v=Hf4MJH0jDb4', duration: '2:08:19' }
      ],
      mcqs: [
        { title: 'React Native Basics Quiz', questions: 15 },
        { title: 'Mobile Development Assessment', questions: 20 }
      ]
    },
  },
  {
    id: '7',
    title: 'Cybersecurity Essentials',
    instructor: 'David Thompson',
    date: '2026-05-05',
    time: '3:00 PM',
    duration: '3 hours',
    category: 'Security',
    description: 'Essential cybersecurity concepts for developers and IT professionals. Covers encryption, authentication, common vulnerabilities, and security best practices.',
    price: 84.99,
    totalSeats: 50,
    availableSeats: 45,
    image: 'cybersecurity network protection',
    skills: ['Security', 'Encryption', 'Authentication', 'OWASP'],
    learningContent: {
      pdfs: [
        { title: 'OWASP Top 10', url: 'https://owasp.org/www-project-top-ten/' },
        { title: 'Cybersecurity Best Practices', url: 'https://www.cisa.gov/cybersecurity-best-practices' }
      ],
      videos: [
        { title: 'Cybersecurity Full Course', url: 'https://www.youtube.com/watch?v=U_P23SqJaDc', duration: '2:29:29' },
        { title: 'Ethical Hacking Tutorial', url: 'https://www.youtube.com/watch?v=3Kq1MIfTWCE', duration: '11:10:07' },
        { title: 'Network Security Explained', url: 'https://www.youtube.com/watch?v=qPwyoD_cQA4', duration: '1:27:45' }
      ],
      mcqs: [
        { title: 'Security Fundamentals Quiz', questions: 18 },
        { title: 'OWASP Assessment', questions: 22 }
      ]
    },
  },
  {
    id: '8',
    title: 'Blockchain & Smart Contracts',
    instructor: 'Alexandra Petrov',
    date: '2026-05-08',
    time: '12:00 PM',
    duration: '4 hours',
    category: 'Blockchain',
    description: 'Introduction to blockchain technology and smart contract development using Solidity. Learn about DeFi, NFTs, and decentralized applications.',
    price: 109.99,
    totalSeats: 30,
    availableSeats: 12,
    image: 'blockchain cryptocurrency technology',
    skills: ['Blockchain', 'Solidity', 'Web3', 'Smart Contracts'],
    learningContent: {
      pdfs: [
        { title: 'Solidity Documentation', url: 'https://docs.soliditylang.org/' },
        { title: 'Ethereum Developer Resources', url: 'https://ethereum.org/en/developers/docs/' }
      ],
      videos: [
        { title: 'Blockchain Full Course', url: 'https://www.youtube.com/watch?v=gyMwXuJrbJQ', duration: '4:00:00' },
        { title: 'Solidity Tutorial', url: 'https://www.youtube.com/watch?v=ipwxYa-F1uY', duration: '2:12:34' },
        { title: 'Build a DApp', url: 'https://www.youtube.com/watch?v=coQ5dg8wM2o', duration: '2:37:45' }
      ],
      mcqs: [
        { title: 'Blockchain Basics Quiz', questions: 15 },
        { title: 'Smart Contracts Assessment', questions: 20 }
      ]
    },
  },
];

export const WorkshopProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [workshops, setWorkshops] = useState<Workshop[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        // Fetch workshops
        const fetchedWorkshops = await api.get('/workshops');
        if (fetchedWorkshops && fetchedWorkshops.length > 0) {
          setWorkshops(fetchedWorkshops);
        } else {
          // Initialize if empty
          await api.post('/workshops/init', { workshops: INITIAL_WORKSHOPS });
          setWorkshops(INITIAL_WORKSHOPS);
        }

        // Fetch bookings
        const fetchedBookings = await api.get('/bookings');
        if (fetchedBookings) {
          setBookings(fetchedBookings);
        }
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const addBooking = async (booking: Booking) => {
    const newBookings = [...bookings, booking];
    setBookings(newBookings);
    
    try {
      await api.post('/bookings', booking);
    } catch (e) {
      console.error('Failed to add booking to server', e);
    }
  };

  const cancelBooking = async (bookingId: string) => {
    const booking = bookings.find(b => b.id === bookingId);
    if (booking && booking.status === 'confirmed') {
      const updatedBooking = { ...booking, status: 'cancelled' as const };
      const updatedBookings = bookings.map(b => b.id === bookingId ? updatedBooking : b);
      setBookings(updatedBookings);
      
      try {
        await api.post('/bookings', updatedBooking);
        await updateSeatAvailability(booking.workshopId, 1);
      } catch (e) {
        console.error('Failed to cancel booking on server', e);
      }
    }
  };

  const getBookingsByUser = (userId: string): Booking[] => {
    return bookings.filter(b => b.userId === userId);
  };

  const getBookingsByWorkshop = (workshopId: string): Booking[] => {
    return bookings.filter(b => b.workshopId === workshopId);
  }

  const getWorkshopById = (id: string): Workshop | undefined => {
    return workshops.find(w => w.id === id);
  };

  const updateSeatAvailability = async (workshopId: string, seatsToDeduct: number) => {
    const workshop = workshops.find(w => w.id === workshopId);
    if (!workshop) return;

    const updatedWorkshop = { ...workshop, availableSeats: workshop.availableSeats - seatsToDeduct };
    const updatedWorkshops = workshops.map(w => w.id === workshopId ? updatedWorkshop : w);
    setWorkshops(updatedWorkshops);
  };

  return (
    <WorkshopContext.Provider
      value={{
        workshops,
        bookings,
        loading,
        addBooking,
        cancelBooking,
        getBookingsByUser,
        getWorkshopById,
        updateSeatAvailability,
        getBookingsByWorkshop,
      }}
    >
      {children}
    </WorkshopContext.Provider>
  );
};

export const useWorkshops = () => {
  const context = useContext(WorkshopContext);
  if (context === undefined) {
    throw new Error('useWorkshops must be used within a WorkshopProvider');
  }
  return context;
};