import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useWorkshops } from '../contexts/WorkshopContext';
import { useAuth } from '../contexts/AuthContext';
import { Button } from '../components/ui/button';
import { Progress } from '../components/ui/progress';
import { Card } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { motion, AnimatePresence } from 'motion/react';
import {
  ArrowLeft,
  CheckCircle2,
  XCircle,
  Clock,
  Award,
  ChevronRight,
  RotateCcw,
  Home,
  Trophy,
  Target
} from 'lucide-react';

interface QuizQuestion {
  id: number;
  question: string;
  options: string[];
  correctAnswer: number;
  explanation?: string;
}

interface QuizAnswer {
  questionId: number;
  selectedAnswer: number;
  isCorrect: boolean;
}

export const QuizPage = () => {
  const { workshopId, quizIndex } = useParams<{ workshopId: string; quizIndex: string }>();
  const navigate = useNavigate();
  const { getWorkshopById, getBookingsByWorkshop } = useWorkshops();
  const { user, isAuthenticated } = useAuth();
  const workshop = getWorkshopById(workshopId!);

  // Check if user is registered for this workshop
  const registeredUsers = workshop
    ? getBookingsByWorkshop(workshop.id)
        .filter((booking) => booking.status === 'confirmed')
    : [];
  const isUserRegistered = isAuthenticated && registeredUsers.some(u => u.userId === user?.id);

  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<QuizAnswer[]>([]);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [showResult, setShowResult] = useState(false);
  const [quizCompleted, setQuizCompleted] = useState(false);
  const [timeElapsed, setTimeElapsed] = useState(0);
  const [timerRunning, setTimerRunning] = useState(true);

  // Sample quiz questions - Replace with actual quiz data from workshop when available
  const quizData: QuizQuestion[] = [
    {
      id: 1,
      question: "What is React primarily used for?",
      options: [
        "Database management",
        "Building user interfaces",
        "Server-side programming",
        "Network security"
      ],
      correctAnswer: 1,
      explanation: "React is a JavaScript library for building user interfaces, particularly for single-page applications."
    },
    {
      id: 2,
      question: "Which hook is used for managing state in functional components?",
      options: [
        "useEffect",
        "useContext",
        "useState",
        "useReducer"
      ],
      correctAnswer: 2,
      explanation: "useState is the primary hook for managing local state in React functional components."
    },
    {
      id: 3,
      question: "What does JSX stand for?",
      options: [
        "JavaScript XML",
        "Java Syntax Extension",
        "JSON XML",
        "JavaScript Extension"
      ],
      correctAnswer: 0,
      explanation: "JSX stands for JavaScript XML, a syntax extension that allows you to write HTML-like code in JavaScript."
    },
    {
      id: 4,
      question: "What is the virtual DOM in React?",
      options: [
        "A physical copy of the DOM",
        "A lightweight copy of the real DOM kept in memory",
        "A browser feature",
        "A CSS framework"
      ],
      correctAnswer: 1,
      explanation: "The virtual DOM is a lightweight representation of the real DOM that React uses to optimize updates."
    },
    {
      id: 5,
      question: "Which method is used to update state in a class component?",
      options: [
        "this.updateState()",
        "this.setState()",
        "this.changeState()",
        "this.modifyState()"
      ],
      correctAnswer: 1,
      explanation: "this.setState() is the method used to update state in React class components."
    }
  ];

  const quizTitle = workshop?.learningContent?.mcqs[Number(quizIndex)]?.title || "Workshop Quiz";
  const currentQuestion = quizData[currentQuestionIndex];
  const totalQuestions = quizData.length;
  const progress = ((currentQuestionIndex + 1) / totalQuestions) * 100;

  // Timer effect
  useEffect(() => {
    if (timerRunning && !quizCompleted) {
      const interval = setInterval(() => {
        setTimeElapsed(prev => prev + 1);
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [timerRunning, quizCompleted]);

  // Format time
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Handle answer selection
  const handleOptionSelect = (optionIndex: number) => {
    if (!showResult) {
      setSelectedOption(optionIndex);
    }
  };

  // Submit answer
  const handleSubmitAnswer = () => {
    if (selectedOption === null) return;

    const isCorrect = selectedOption === currentQuestion.correctAnswer;
    const newAnswer: QuizAnswer = {
      questionId: currentQuestion.id,
      selectedAnswer: selectedOption,
      isCorrect
    };

    setAnswers([...answers, newAnswer]);
    setShowResult(true);
  };

  // Next question
  const handleNextQuestion = () => {
    if (currentQuestionIndex < totalQuestions - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
      setSelectedOption(null);
      setShowResult(false);
    } else {
      setQuizCompleted(true);
      setTimerRunning(false);
    }
  };

  // Retry quiz
  const handleRetryQuiz = () => {
    setCurrentQuestionIndex(0);
    setAnswers([]);
    setSelectedOption(null);
    setShowResult(false);
    setQuizCompleted(false);
    setTimeElapsed(0);
    setTimerRunning(true);
  };

  // Calculate score
  const calculateScore = () => {
    const correctAnswers = answers.filter(a => a.isCorrect).length;
    return {
      correct: correctAnswers,
      total: totalQuestions,
      percentage: Math.round((correctAnswers / totalQuestions) * 100)
    };
  };

  if (!workshop) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl mb-2 text-gray-700">Workshop not found</h2>
          <Button onClick={() => navigate('/')}>Back to Home</Button>
        </div>
      </div>
    );
  }

  if (!isUserRegistered) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="size-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Target className="size-10 text-gray-300" />
          </div>
          <h2 className="text-2xl mb-2 text-gray-700">Access Restricted</h2>
          <p className="text-gray-500 mb-6">You need to register for this workshop to access the quiz.</p>
          <div className="space-x-4">
            <Button onClick={() => navigate(`/workshop/${workshopId}`)}>View Workshop</Button>
            <Button variant="outline" onClick={() => navigate('/')}>Back to Home</Button>
          </div>
        </div>
      </div>
    );
  }

  // Results screen
  if (quizCompleted) {
    const score = calculateScore();
    const isPassed = score.percentage >= 70;

    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 py-12 px-4">
        <div className="max-w-3xl mx-auto">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5 }}
          >
            <Card className="p-8 md:p-12 bg-white/80 backdrop-blur-sm border-2 shadow-2xl">
              {/* Trophy Icon */}
              <div className="text-center mb-8">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
                  className={`inline-flex items-center justify-center w-24 h-24 rounded-full ${
                    isPassed
                      ? 'bg-gradient-to-br from-yellow-400 to-amber-500'
                      : 'bg-gradient-to-br from-gray-300 to-gray-400'
                  } mb-6 shadow-xl`}
                >
                  {isPassed ? (
                    <Trophy className="w-12 h-12 text-white" />
                  ) : (
                    <Target className="w-12 h-12 text-white" />
                  )}
                </motion.div>
                
                <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-2">
                  {isPassed ? 'Congratulations!' : 'Quiz Complete'}
                </h1>
                <p className="text-gray-600">
                  {isPassed
                    ? 'You passed the quiz! Great work!'
                    : 'Keep practicing to improve your score.'}
                </p>
              </div>

              {/* Score Display */}
              <div className="bg-gradient-to-r from-indigo-500 to-purple-600 rounded-2xl p-8 mb-8 text-white text-center">
                <p className="text-sm uppercase tracking-wider opacity-90 mb-2">Your Score</p>
                <div className="flex items-center justify-center gap-4 mb-2">
                  <span className="text-6xl font-bold">{score.percentage}%</span>
                </div>
                <p className="opacity-90">
                  {score.correct} out of {score.total} correct answers
                </p>
              </div>

              {/* Stats Grid */}
              <div className="grid grid-cols-3 gap-4 mb-8">
                <div className="bg-gray-50 rounded-xl p-4 text-center border border-gray-100">
                  <CheckCircle2 className="w-6 h-6 text-green-500 mx-auto mb-2" />
                  <p className="text-2xl font-bold text-gray-900">{score.correct}</p>
                  <p className="text-xs text-gray-500">Correct</p>
                </div>
                <div className="bg-gray-50 rounded-xl p-4 text-center border border-gray-100">
                  <XCircle className="w-6 h-6 text-red-500 mx-auto mb-2" />
                  <p className="text-2xl font-bold text-gray-900">{score.total - score.correct}</p>
                  <p className="text-xs text-gray-500">Incorrect</p>
                </div>
                <div className="bg-gray-50 rounded-xl p-4 text-center border border-gray-100">
                  <Clock className="w-6 h-6 text-blue-500 mx-auto mb-2" />
                  <p className="text-2xl font-bold text-gray-900">{formatTime(timeElapsed)}</p>
                  <p className="text-xs text-gray-500">Time</p>
                </div>
              </div>

              {/* Review Answers */}
              <div className="space-y-3 mb-8">
                <h3 className="font-semibold text-gray-900 mb-4">Answer Summary</h3>
                {quizData.map((question, index) => {
                  const answer = answers[index];
                  return (
                    <div
                      key={question.id}
                      className={`flex items-center gap-3 p-3 rounded-xl border ${
                        answer?.isCorrect
                          ? 'bg-green-50 border-green-200'
                          : 'bg-red-50 border-red-200'
                      }`}
                    >
                      {answer?.isCorrect ? (
                        <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0" />
                      ) : (
                        <XCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
                      )}
                      <span className="text-sm text-gray-700 flex-1">
                        Question {index + 1}: {question.question}
                      </span>
                    </div>
                  );
                })}
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-3">
                <Button
                  onClick={handleRetryQuiz}
                  variant="outline"
                  className="flex-1 h-12 rounded-xl"
                >
                  <RotateCcw className="w-4 h-4 mr-2" />
                  Retry Quiz
                </Button>
                <Button
                  onClick={() => navigate(`/workshop/${workshopId}`)}
                  className="flex-1 h-12 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700"
                >
                  <Home className="w-4 h-4 mr-2" />
                  Back to Workshop
                </Button>
              </div>
            </Card>
          </motion.div>
        </div>
      </div>
    );
  }

  // Quiz interface
  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <Button
            variant="ghost"
            onClick={() => navigate(`/workshop/${workshopId}`)}
            className="mb-4 hover:bg-white/50"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Workshop
          </Button>

          <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 border shadow-lg">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
              <div>
                <h1 className="text-2xl font-bold text-gray-900 mb-1">{quizTitle}</h1>
                <p className="text-gray-600">{workshop.title}</p>
              </div>
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2 bg-indigo-50 px-4 py-2 rounded-xl">
                  <Clock className="w-4 h-4 text-indigo-600" />
                  <span className="font-mono font-semibold text-indigo-600">
                    {formatTime(timeElapsed)}
                  </span>
                </div>
                <Badge variant="secondary" className="px-3 py-1">
                  Question {currentQuestionIndex + 1}/{totalQuestions}
                </Badge>
              </div>
            </div>

            <Progress value={progress} className="h-2" />
          </div>
        </div>

        {/* Question Card */}
        <AnimatePresence mode="wait">
          <motion.div
            key={currentQuestionIndex}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3 }}
          >
            <Card className="p-8 bg-white/80 backdrop-blur-sm border-2 shadow-xl">
              {/* Question */}
              <div className="mb-8">
                <div className="flex items-start gap-3 mb-4">
                  <div className="bg-gradient-to-br from-indigo-500 to-purple-600 text-white rounded-xl px-4 py-2 font-bold text-lg flex-shrink-0">
                    {currentQuestionIndex + 1}
                  </div>
                  <h2 className="text-xl font-semibold text-gray-900 leading-relaxed pt-1">
                    {currentQuestion.question}
                  </h2>
                </div>
              </div>

              {/* Options */}
              <div className="space-y-3 mb-8">
                {currentQuestion.options.map((option, index) => {
                  const isSelected = selectedOption === index;
                  const isCorrect = index === currentQuestion.correctAnswer;
                  const showCorrectAnswer = showResult && isCorrect;
                  const showIncorrectAnswer = showResult && isSelected && !isCorrect;

                  return (
                    <motion.button
                      key={index}
                      onClick={() => handleOptionSelect(index)}
                      disabled={showResult}
                      whileHover={!showResult ? { scale: 1.02 } : {}}
                      whileTap={!showResult ? { scale: 0.98 } : {}}
                      className={`w-full text-left p-4 rounded-xl border-2 transition-all ${
                        showCorrectAnswer
                          ? 'bg-green-50 border-green-500 shadow-lg shadow-green-100'
                          : showIncorrectAnswer
                          ? 'bg-red-50 border-red-500 shadow-lg shadow-red-100'
                          : isSelected
                          ? 'bg-indigo-50 border-indigo-500 shadow-lg shadow-indigo-100'
                          : 'bg-white border-gray-200 hover:border-indigo-300 hover:shadow-md'
                      } ${showResult ? 'cursor-default' : 'cursor-pointer'}`}
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-6 h-6 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${
                            showCorrectAnswer
                              ? 'bg-green-500 border-green-500'
                              : showIncorrectAnswer
                              ? 'bg-red-500 border-red-500'
                              : isSelected
                              ? 'bg-indigo-500 border-indigo-500'
                              : 'border-gray-300'
                          }`}
                        >
                          {showCorrectAnswer && <CheckCircle2 className="w-4 h-4 text-white" />}
                          {showIncorrectAnswer && <XCircle className="w-4 h-4 text-white" />}
                          {isSelected && !showResult && (
                            <div className="w-3 h-3 bg-white rounded-full" />
                          )}
                        </div>
                        <span
                          className={`font-medium ${
                            showCorrectAnswer || showIncorrectAnswer
                              ? 'text-gray-900'
                              : isSelected
                              ? 'text-indigo-900'
                              : 'text-gray-700'
                          }`}
                        >
                          {option}
                        </span>
                      </div>
                    </motion.button>
                  );
                })}
              </div>

              {/* Explanation */}
              <AnimatePresence>
                {showResult && currentQuestion.explanation && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-xl"
                  >
                    <div className="flex gap-2">
                      <Award className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="font-semibold text-blue-900 mb-1">Explanation</p>
                        <p className="text-blue-800 text-sm leading-relaxed">
                          {currentQuestion.explanation}
                        </p>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Action Button */}
              <div className="flex justify-end">
                {!showResult ? (
                  <Button
                    onClick={handleSubmitAnswer}
                    disabled={selectedOption === null}
                    className="px-8 h-12 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Submit Answer
                  </Button>
                ) : (
                  <Button
                    onClick={handleNextQuestion}
                    className="px-8 h-12 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700"
                  >
                    {currentQuestionIndex < totalQuestions - 1 ? (
                      <>
                        Next Question
                        <ChevronRight className="w-4 h-4 ml-2" />
                      </>
                    ) : (
                      'View Results'
                    )}
                  </Button>
                )}
              </div>
            </Card>
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
};