import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { onboardingApi, criteriaApi } from '../services/api';

const QUESTIONS = [
  'Think of someone you deeply admired — what quality stood out most?',
  'What\'s a value that is non-negotiable for you in a relationship?',
  'How important is physical attraction versus emotional connection to you?',
  'What lifestyle factors matter most — career ambition, family focus, adventure, stability?',
  'How do you feel about someone who shares your hobbies vs complements you?',
  'What communication style do you need from a partner?',
  'How important is shared humour and playfulness?',
  'What role does physical health/fitness play in your ideal partner?',
  'How much does financial stability or ambition matter to you?',
  'What has been a recurring dealbreaker in past relationships?',
];

export default function Onboarding() {
  const [currentStep, setCurrentStep] = useState(0);
  const [answers, setAnswers] = useState<string[]>(Array(10).fill(''));
  const [currentAnswer, setCurrentAnswer] = useState('');
  const [generatedCriteria, setGeneratedCriteria] = useState<any[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isCompleting, setIsCompleting] = useState(false);
  const { updateUser, user } = useAuth();
  const navigate = useNavigate();

  const isInterview = currentStep < 10;
  const isReview = currentStep === 10;
  const isEdit = currentStep === 11;

  useEffect(() => {
    if (currentStep < 10) {
      setCurrentAnswer(answers[currentStep] || '');
    }
  }, [currentStep, answers]);

  const handleNext = async () => {
    if (isInterview) {
      const newAnswers = [...answers];
      newAnswers[currentStep] = currentAnswer;
      setAnswers(newAnswers);

      try {
        await onboardingApi.saveResponse({
          question_number: currentStep + 1,
          answer: currentAnswer,
        });
      } catch (error) {
        console.error('Failed to save answer:', error);
      }

      if (currentStep === 9) {
        setIsGenerating(true);
        try {
          const response: any = await onboardingApi.generateCriteria();
          setGeneratedCriteria(response.criteria);
          setCurrentStep(10);
        } catch (error) {
          console.error('Failed to generate criteria:', error);
        } finally {
          setIsGenerating(false);
        }
      } else {
        setCurrentStep(currentStep + 1);
      }
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleEditCriteria = () => {
    setCurrentStep(11);
  };

  const handleComplete = async () => {
    setIsCompleting(true);
    try {
      if (user) {
        updateUser({ ...user, has_completed_onboarding: true });
      }
      navigate('/');
    } catch (error) {
      console.error('Failed to complete onboarding:', error);
    } finally {
      setIsCompleting(false);
    }
  };

  const updateCriterion = (index: number, field: string, value: any) => {
    const updated = [...generatedCriteria];
    updated[index] = { ...updated[index], [field]: value };
    setGeneratedCriteria(updated);
  };

  const deleteCriterion = (index: number) => {
    setGeneratedCriteria(generatedCriteria.filter((_, i) => i !== index));
  };

  const saveCriteria = async () => {
    try {
      await criteriaApi.bulkUpdate(generatedCriteria);
      handleComplete();
    } catch (error) {
      console.error('Failed to save criteria:', error);
    }
  };

  if (isGenerating) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-warm-50">
        <div className="text-center">
          <div className="inline-block h-12 w-12 animate-spin rounded-full border-4 border-solid border-rose-500 border-r-transparent mb-4"></div>
          <p className="text-lg text-navy-700">Crafting your personalized criteria...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-rose-50 via-warm-50 to-navy-50 px-4 py-8">
      <div className="max-w-2xl mx-auto">
        {/* Progress bar */}
        {isInterview && (
          <div className="mb-8">
            <div className="flex justify-between text-sm text-navy-600 mb-2">
              <span>Question {currentStep + 1} of 10</span>
              <span>{Math.round(((currentStep + 1) / 10) * 100)}%</span>
            </div>
            <div className="h-2 bg-white rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-rose-500 to-navy-600 transition-all duration-300"
                style={{ width: `${((currentStep + 1) / 10) * 100}%` }}
              />
            </div>
          </div>
        )}

        <div className="card">
          {isInterview && (
            <>
              <h2 className="text-2xl font-semibold text-navy-800 mb-6">
                {QUESTIONS[currentStep]}
              </h2>
              <textarea
                value={currentAnswer}
                onChange={(e) => setCurrentAnswer(e.target.value)}
                className="input min-h-[150px] resize-y"
                placeholder="Share your thoughts..."
              />
              <div className="flex justify-between mt-6">
                <button
                  onClick={handleBack}
                  disabled={currentStep === 0}
                  className="btn btn-outline"
                >
                  Back
                </button>
                <button
                  onClick={handleNext}
                  disabled={!currentAnswer.trim()}
                  className="btn btn-primary"
                >
                  {currentStep === 9 ? 'Generate My Criteria' : 'Next'}
                </button>
              </div>
            </>
          )}

          {isReview && (
            <>
              <h2 className="text-2xl font-semibold text-navy-800 mb-4">
                Your Personalized Criteria
              </h2>
              <p className="text-navy-600 mb-6">
                Based on your answers, we've created these criteria to help you evaluate potential partners.
              </p>

              <div className="space-y-4">
                {generatedCriteria.map((criterion) => (
                  <div key={criterion.id} className="p-4 bg-warm-50 rounded-xl">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h3 className="font-semibold text-navy-800">{criterion.name}</h3>
                        <p className="text-sm text-navy-600 mt-1">{criterion.description}</p>
                        <span
                          className={`inline-block mt-2 px-3 py-1 rounded-full text-xs font-medium ${
                            criterion.tier === 'dealbreaker'
                              ? 'bg-rose-100 text-rose-700'
                              : criterion.tier === 'important'
                              ? 'bg-navy-100 text-navy-700'
                              : 'bg-warm-200 text-warm-700'
                          }`}
                        >
                          {criterion.tier}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex gap-3 mt-6">
                <button onClick={handleEditCriteria} className="btn btn-outline flex-1">
                  Edit Criteria
                </button>
                <button onClick={handleComplete} disabled={isCompleting} className="btn btn-primary flex-1">
                  {isCompleting ? 'Completing...' : 'Looks Good!'}
                </button>
              </div>
            </>
          )}

          {isEdit && (
            <>
              <h2 className="text-2xl font-semibold text-navy-800 mb-4">Edit Your Criteria</h2>
              <div className="space-y-4">
                {generatedCriteria.map((criterion, index) => (
                  <div key={criterion.id} className="p-4 border border-warm-300 rounded-xl">
                    <input
                      type="text"
                      value={criterion.name}
                      onChange={(e) => updateCriterion(index, 'name', e.target.value)}
                      className="input mb-2"
                      placeholder="Criterion name"
                    />
                    <textarea
                      value={criterion.description || ''}
                      onChange={(e) => updateCriterion(index, 'description', e.target.value)}
                      className="input mb-2"
                      placeholder="Description"
                    />
                    <div className="flex items-center gap-3">
                      <select
                        value={criterion.tier}
                        onChange={(e) => updateCriterion(index, 'tier', e.target.value)}
                        className="input flex-1"
                      >
                        <option value="dealbreaker">Dealbreaker</option>
                        <option value="important">Important</option>
                        <option value="nice-to-have">Nice-to-have</option>
                      </select>
                      <button
                        onClick={() => deleteCriterion(index)}
                        className="text-red-500 hover:text-red-700"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                ))}
              </div>
              <div className="flex gap-3 mt-6">
                <button onClick={() => setCurrentStep(10)} className="btn btn-outline flex-1">
                  Cancel
                </button>
                <button onClick={saveCriteria} className="btn btn-primary flex-1">
                  Save Changes
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
