'use client'

import { useState, useRef, useEffect } from 'react'
import { generateBotSaiResponse } from '@/app/lib/botsai'
import { SkillMastery, MasteryLevel } from '@/app/types/mastery';
import mockSupabase from '@/app/lib/mock-supabase'; // Changed to default import
import { motion, AnimatePresence } from 'framer-motion'

export default function BotSaiAssistant() {
  const [prompt, setPrompt] = useState('')
  const [response, setResponse] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isFocused, setIsFocused] = useState(false)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const responseRef = useRef<HTMLDivElement>(null)
  const [skillMasteryData, setSkillMasteryData] = useState<SkillMastery[] | null>(null);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [conversationHistory, setConversationHistory] = useState<{ prompt: string, response: string }[]>([]);


  // Load conversation history from localStorage on mount
  useEffect(() => {
    try {
      const storedHistory = localStorage.getItem('botsaiConversationHistory');
      if (storedHistory) {
        const parsedHistory = JSON.parse(storedHistory);
        // Basic validation: check if it's an array
        if (Array.isArray(parsedHistory)) {
          setConversationHistory(parsedHistory);
        } else {
          console.warn('Invalid conversation history format found in localStorage.');
          localStorage.removeItem('botsaiConversationHistory'); // Clear invalid data
        }
      }
    } catch (error) {
      console.error('Failed to load or parse conversation history from localStorage:', error);
      // Optionally clear potentially corrupted data
      localStorage.removeItem('botsaiConversationHistory');
    }
  }, []); // Empty dependency array ensures this runs only once on mount

  // Save conversation history to localStorage whenever it changes
  useEffect(() => {
    try {
      // Only save if conversationHistory is not the initial empty array, 
      // unless it was explicitly set to empty (e.g., by clearing). 
      // For simplicity here, we save unconditionally. If performance becomes an issue
      // with frequent updates, add a check like: if (conversationHistory.length > 0 || localStorage.getItem('botsaiConversationHistory'))
      localStorage.setItem('botsaiConversationHistory', JSON.stringify(conversationHistory));
    } catch (error) {
      console.error('Failed to save conversation history to localStorage:', error);
    }
  }, [conversationHistory]); // Dependency array ensures this runs when history changes

  // Auto-resize textarea based on content
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`
    }
  }, [prompt])

  // Scroll to response when it's generated
  useEffect(() => {
    if (response && responseRef.current) {
      responseRef.current.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
    }
  }, [response])

  // Fetch skill data and generate suggestions on mount
  useEffect(() => {
    const fetchSkillsAndSuggest = async () => {
      try {
        // Fetch data using the mock client
        // Define expected response structure for type safety
        interface MockSkillResponse {
          data: {
            id: string;
            user_id: string;
            topic: string;
            mastery_level: MasteryLevel; // Use MasteryLevel from import
            last_updated: string;
            isPruned: boolean;
          }[] | null;
          error: any | null;
        }
        
        // Use type assertion 'as' directly on the await expression
        const result = await mockSupabase.from('user_skills').select().eq() as MockSkillResponse;
        const { data, error: fetchError } = result; // Destructure the asserted result
        if (fetchError) {
          throw new Error(`Failed to fetch skill data: ${fetchError.message}`);
        }
        if (!data) {
           throw new Error('No skill data returned');
        }
        // Map mock data structure to SkillMastery interface if needed (adjusting property names)
        const mappedData: SkillMastery[] = data.map((skill: any) => ({
          ...skill,
          masteryLevel: skill.mastery_level // Map mastery_level to masteryLevel
        }));
        setSkillMasteryData(mappedData);

        // Use mappedData and add type annotations
        const skillsToSuggest = mappedData
          .filter((skill: SkillMastery) => skill.masteryLevel === MasteryLevel.NeedsPractice)
          .slice(0, 2); // Limit to 2 suggestions

        // Generate varied suggestions for 'NeedsPractice'
        const suggestionPhrases = [
          `Looks like '${"{topic}"}' could use some focus. Maybe try reviewing the related video or tackling a practice problem?`,
          `Need to strengthen your understanding of '${"{topic}"}'? Consider revisiting the lesson or working through some examples.`,
          `For '${"{topic}"}', extra practice might be helpful. Try the exercises or review the core concepts.`
        ];

        const generatedSuggestions = skillsToSuggest.map((skill: SkillMastery, index: number) => {
          // Cycle through suggestion phrases
          const phraseTemplate = suggestionPhrases[index % suggestionPhrases.length];
          return phraseTemplate.replace('{topic}', skill.topic);
        });
        setSuggestions(generatedSuggestions);

      } catch (error) {
        console.error("Error fetching skill mastery data:", error);
        // Optionally set an error state here for suggestions
      }
    };

    fetchSkillsAndSuggest();
  }, []); // Empty dependency array ensures this runs only once on mount

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!prompt.trim()) return
    
    setIsLoading(true)
    setError(null)
    
    try {
      // Add SAT/PSAT context to the prompt
      const enhancedPrompt = `As an SAT/PSAT tutor, please help with the following question: ${prompt}`;
      const result = await generateBotSaiResponse(enhancedPrompt)
      setResponse(result) // Keep this to potentially trigger effects or if needed elsewhere temporarily
      setConversationHistory(prevHistory => [...prevHistory, { prompt: prompt, response: result }]);
    } catch (err: any) {
      setError(err.message || 'Failed to generate response')
      console.error('BotSai API error:', err)
    } finally {
      setIsLoading(false)
      setPrompt(''); // Clear prompt after submission attempt
    }
  }

  // Example SAT/PSAT questions for quick selection
  const exampleQuestions = [
    "Explain how to solve quadratic equations for the SAT Math section",
    "What are the best strategies for the SAT Reading section?",
    "How do I identify and fix dangling modifiers for the Writing section?",
    "Explain the difference between PSAT and SAT scoring"
  ];

  return (
    <div className="bg-white dark:bg-gray-800 shadow-lg rounded-xl p-6 border border-gray-100 dark:border-gray-700 transition-all duration-300 hover:shadow-xl relative overflow-hidden group">
      {/* Background glow effect */}
      <div className="absolute -inset-0.5 bg-gradient-to-r from-primary-400/20 to-secondary-400/20 rounded-xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
      
      <div className="relative">
        <div className="flex items-center mb-6">
          <div className="w-10 h-10 bg-primary-100 dark:bg-primary-800 rounded-full flex items-center justify-center text-primary-600 dark:text-primary-300 mr-3 animate-float">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
            </svg>
          </div>
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">
            BonsAI Assistant
          </h2>
        </div>
        
        {/* Suggestions Section */}
        <AnimatePresence>
          {suggestions.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.3 }}
              className="mb-5 p-4 bg-primary-50 dark:bg-primary-900/30 border border-primary-200 dark:border-primary-700 rounded-lg shadow-sm"
            >
              <h3 className="text-sm font-semibold text-primary-800 dark:text-primary-200 mb-2 flex items-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-primary-600 dark:text-primary-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-11a1 1 0 10-2 0v4a1 1 0 102 0V7zm-1 9a1 1 0 110-2 1 1 0 010 2z" clipRule="evenodd" />
                </svg>
                Study Suggestions:
              </h3>
              <ul className="list-none pl-1 space-y-1 text-sm text-primary-700 dark:text-primary-300">
                {suggestions.map((suggestion, index) => (
                  <li key={index} className="flex items-start">
                    <span className="text-primary-500 dark:text-primary-400 mr-2">›</span>
                    <span>{suggestion}</span>
                  </li>
                ))}
              </ul>
            </motion.div>
          )}
        </AnimatePresence>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label htmlFor="prompt" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Ask anything about SAT or PSAT prep
            </label>
            <div className={`relative transition-all duration-300 ${isFocused ? 'transform scale-[1.01]' : ''}`}>
              <div className={`absolute -inset-0.5 bg-gradient-to-r from-primary-400 to-secondary-400 rounded-lg blur opacity-75 transition-opacity duration-300 ${isFocused ? 'opacity-100 animate-pulse' : 'opacity-0'}`}></div>
              <div className="relative">
                <textarea
                  ref={textareaRef}
                  id="prompt"
                  rows={3}
                  className={`botsai-input botsai-scrollbar ${isFocused ? 'animate-pulse-border' : ''}`}
                  placeholder="e.g., How do I solve systems of equations? What's the best way to approach the reading section?"
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  onFocus={() => setIsFocused(true)}
                  onBlur={() => setIsFocused(false)}
                />
                {prompt && (
                  <button 
                    type="button" 
                    className="absolute top-2 right-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors duration-200"
                    onClick={() => setPrompt('')}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                    </svg>
                  </button>
                )}
              </div>
            </div>
          </div>
          
          {/* Example questions */}
          <div className="flex flex-wrap gap-2">
            <span className="text-xs text-gray-500 dark:text-gray-400 self-center mr-1">Try:</span>
            {exampleQuestions.map((question, index) => (
              <button
                key={index}
                type="button"
                className="text-xs bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-full px-3 py-1.5 transition-all duration-200 hover:shadow-md transform hover:-translate-y-0.5"
                onClick={() => {
                  setPrompt(question)
                  if (textareaRef.current) {
                    textareaRef.current.focus()
                  }
                }}
              >
                {question.length > 30 ? question.substring(0, 30) + '...' : question}
              </button>
            ))}
          </div>
          
          <div>
            <motion.button
              type="submit"
              disabled={isLoading || !prompt.trim()}
              className={`w-full ${isLoading ? 'bg-gray-400 cursor-not-allowed' : 'botsai-button'}`}
              whileTap={{ scale: 0.98 }}
            >
              {isLoading ? (
                <div className="flex items-center justify-center">
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Generating...
                </div>
              ) : (
                'Get SAT/PSAT Help'
              )}
            </motion.button>
          </div>
        </form>
        
        <AnimatePresence>
          {error && (
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="mt-5 bg-red-50 dark:bg-red-900/30 text-red-800 dark:text-red-200 p-4 rounded-lg text-sm flex items-start"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 flex-shrink-0" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
              {error}
            </motion.div>
          )}
        </AnimatePresence>
        
        <AnimatePresence>
          {conversationHistory.length > 0 && (
            <motion.div
              ref={responseRef} // Keep ref for scrolling to the latest part of history
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
              className="mt-6"
            >
              <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 flex items-center">
                 <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1 text-primary-500" viewBox="0 0 20 20" fill="currentColor">
                   <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                 </svg>
                Conversation History:
              </h3>
              <div className="bg-gray-50 dark:bg-gray-900 p-5 rounded-lg text-gray-800 dark:text-gray-200 text-sm border border-gray-200 dark:border-gray-700 shadow-inner botsai-scrollbar" style={{ maxHeight: '400px', overflowY: 'auto' }}>
                {conversationHistory.map((entry, index) => (
                  <div key={index} className="mb-4 pb-4 border-b border-gray-200 dark:border-gray-700 last:mb-0 last:pb-0 last:border-b-0">
                    <div className="mb-2">
                      <span className="font-semibold text-gray-600 dark:text-gray-400">You:</span>
                      <p className="ml-2 mt-1 inline-block whitespace-pre-wrap">{entry.prompt}</p>
                    </div>
                    <div>
                      <span className="font-semibold text-primary-600 dark:text-primary-400">BotSai:</span>
                      <p className="ml-2 mt-1 inline-block whitespace-pre-wrap">{entry.response}</p>
                    </div>
                  </div>
                ))}
              </div>
              {/* Removed copy button for simplicity, could be added back for the last message */}
            </motion.div>
          )}
        </AnimatePresence>
        
        <div className="mt-6 flex items-center justify-between text-xs text-gray-500 dark:text-gray-400 border-t border-gray-200 dark:border-gray-700 pt-4">
          <div className="flex items-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1 text-primary-500" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M11.3 1.046A1 1 0 0112 2v5h4a1 1 0 01.82 1.573l-7 10A1 1 0 018 18v-5H4a1 1 0 01-.82-1.573l7-10a1 1 0 011.12-.38z" clipRule="evenodd" />
            </svg>
            Powered by BonsAI
          </div>
          <div>Specialized for SAT/PSAT preparation</div>
        </div>
      </div>
    </div>
  )
} 