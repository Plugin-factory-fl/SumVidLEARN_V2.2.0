document.addEventListener('DOMContentLoaded', async () => {
  const loadingState = document.getElementById('loading');
  const noVideoState = document.getElementById('no-video');
  const videoInfoState = document.getElementById('video-info');
  const videoTitle = document.getElementById('video-title');
  const channelName = document.getElementById('channel-name');
  const summaryContainer = document.getElementById('summary-container');
  const summaryContent = document.getElementById('summary-content');
  const summaryHeader = document.getElementById('summary-header');
  const collapseButton = document.querySelector('.collapse-button');
  const themeToggle = document.getElementById('theme-toggle');
  const quizContainer = document.getElementById('quiz-container');
  const quizContent = document.getElementById('quiz-content');
  const quizHeader = document.getElementById('quiz-header');
  const generateQuizButton = document.getElementById('generate-quiz-button');
  const copyReportButton = document.getElementById('copy-report-button');
  const copySummaryCheckbox = document.getElementById('copy-summary');
  const copyChatCheckbox = document.getElementById('copy-chat');
  const copyQuizCheckbox = document.getElementById('copy-quiz');
  const questionsContainer = document.getElementById('questions-container');
  const questionsContent = document.getElementById('questions-content');
  const questionsHeader = document.getElementById('questions-header');
  const questionInput = document.getElementById('question-input');
  const sendQuestionButton = document.getElementById('send-question');
  const chatMessages = document.getElementById('chat-messages');
  
  let currentVideoInfo = null;
  let currentQuestionIndex = 0;
  let totalQuestions = 0;

  // Function to send message with timeout and retries
  async function sendMessageWithTimeout(message, maxRetries = 3) {
    return new Promise((resolve) => {
      let retryCount = 0;

      function attemptSend() {
        try {
          chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
            if (chrome.runtime.lastError) {
              console.warn('Chrome runtime error in tabs.query:', chrome.runtime.lastError);
              handleRetry();
              return;
            }

            if (!tabs?.[0]?.id) {
              console.warn('No active tab found');
              resolve({ error: 'No active tab found' });
              return;
            }
            
            chrome.tabs.sendMessage(tabs[0].id, message, (response) => {
              if (chrome.runtime.lastError) {
                console.warn('Chrome runtime error in sendMessage:', chrome.runtime.lastError);
                handleRetry();
                return;
              }
              resolve(response || { success: true });
            });
          });
        } catch (error) {
          console.warn('Error sending message:', error);
          handleRetry();
        }
      }

      function handleRetry() {
        retryCount++;
        if (retryCount < maxRetries) {
          console.log(`Retrying message send (attempt ${retryCount + 1}/${maxRetries})...`);
          setTimeout(attemptSend, 1000 * retryCount); // Exponential backoff
        } else {
          resolve({ error: 'Failed to send message after multiple attempts' });
        }
      }

      attemptSend();
    });
  }

  function showLoadingIndicator(container) {
    const statusIndicator = container.querySelector('.status-indicator');
    if (statusIndicator) {
      const spinner = statusIndicator.querySelector('.loading-spinner');
      const badge = statusIndicator.querySelector('.completion-badge');
      if (spinner && badge) {
        spinner.style.display = 'block';
        badge.style.display = 'none';
      }
    }
  }

  function showCompletionBadge(container) {
    const statusIndicator = container.querySelector('.status-indicator');
    if (statusIndicator) {
      const spinner = statusIndicator.querySelector('.loading-spinner');
      const badge = statusIndicator.querySelector('.completion-badge');
      if (spinner && badge) {
        spinner.style.display = 'none';
        badge.style.display = 'block';
      }
    }
  }

  // Theme handling
  if (themeToggle) {
    chrome.storage.local.get(['darkMode'], (result) => {
      if (chrome.runtime.lastError) {
        console.warn('Error getting dark mode setting:', chrome.runtime.lastError);
        return;
      }
      const isDarkMode = result.darkMode || false;
      themeToggle.checked = isDarkMode;
      document.documentElement.setAttribute('data-theme', isDarkMode ? 'dark' : 'light');
    });

    themeToggle.addEventListener('change', () => {
      const isDarkMode = themeToggle.checked;
      document.documentElement.setAttribute('data-theme', isDarkMode ? 'dark' : 'light');
      chrome.storage.local.set({ darkMode: isDarkMode }, () => {
        if (chrome.runtime.lastError) {
          console.warn('Error saving dark mode setting:', chrome.runtime.lastError);
        }
      });
    });
  }

  // Summary collapse handling
  summaryHeader?.addEventListener('click', () => {
    const isCollapsed = summaryContent.classList.contains('collapsed');
    if (isCollapsed) {
      summaryContent.classList.remove('collapsed');
      collapseButton.classList.remove('collapsed');
    } else {
      summaryContent.classList.add('collapsed');
      collapseButton.classList.add('collapsed');
    }
  });

  // Quiz collapse handling
  quizHeader?.addEventListener('click', () => {
    const isCollapsed = quizContent.classList.contains('collapsed');
    if (isCollapsed) {
      quizContent.classList.remove('collapsed');
      quizHeader.querySelector('.collapse-button')?.classList.remove('collapsed');
    } else {
      quizContent.classList.add('collapsed');
      quizHeader.querySelector('.collapse-button')?.classList.add('collapsed');
    }
  });

  // Questions collapse handling
  questionsHeader?.addEventListener('click', () => {
    const isCollapsed = questionsContent.classList.contains('collapsed');
    if (isCollapsed) {
      questionsContent.classList.remove('collapsed');
      questionsHeader.querySelector('.collapse-button')?.classList.remove('collapsed');
    } else {
      questionsContent.classList.add('collapsed');
      questionsHeader.querySelector('.collapse-button')?.classList.add('collapsed');
    }
  });

  // Function to add a message to the chat
  function addChatMessage(message, isUser = false) {
    const messageElement = document.createElement('div');
    messageElement.className = `chat-message ${isUser ? 'user' : 'assistant'}`;
    messageElement.textContent = message;
    chatMessages?.appendChild(messageElement);
    if (chatMessages) {
      chatMessages.scrollTop = chatMessages.scrollHeight;
    }
  }

  // Handle question submission
  async function handleQuestionSubmit() {
    const question = questionInput?.value.trim();
    if (!question) return;

    // Add user's question to chat
    addChatMessage(question, true);
    if (questionInput) {
      questionInput.value = '';
    }

    // Show loading state
    showLoadingIndicator(questionsContainer);

    try {
      const response = await chrome.runtime.sendMessage({
        action: 'ask-question',
        question,
        transcript: currentVideoInfo?.transcript,
        summary: summaryContent?.textContent
      });

      if (response?.error) {
        addChatMessage(`Error: ${response.error}`);
      } else {
        addChatMessage(response.answer);
      }
    } catch (error) {
      console.error('Error submitting question:', error);
      addChatMessage('Sorry, I encountered an error while processing your question.');
    }

    // Show completion state
    showCompletionBadge(questionsContainer);
  }

  // Event listeners for question input
  sendQuestionButton?.addEventListener('click', handleQuestionSubmit);
  questionInput?.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
      handleQuestionSubmit();
    }
  });

  async function summarizeText(text) {
    try {
      console.log('Starting summarization...');
      summaryContainer?.classList.remove('hidden');
      if (summaryContent) {
        summaryContent.textContent = 'Generating summary...';
      }
      
      // Show loading indicator
      showLoadingIndicator(summaryContainer);
      
      const response = await chrome.runtime.sendMessage({ 
        action: 'summarize', 
        transcript: text 
      });

      console.log('Received summary response:', response);
      if (response?.error) {
        console.error('Summary error:', response.error);
        if (summaryContent) {
          summaryContent.textContent = `Failed to generate summary: ${response.error}`;
        }
      } else {
        // Use innerHTML to properly render HTML tags
        if (summaryContent) {
          summaryContent.innerHTML = response.summary;
        }
        
        // Show completion badge
        showCompletionBadge(summaryContainer);
        
        // Show and initialize questions section
        questionsContainer?.classList.remove('hidden');
        questionsContent?.classList.add('collapsed');
        questionsHeader?.querySelector('.collapse-button')?.classList.add('collapsed');
        if (chatMessages) {
          chatMessages.innerHTML = '';
        }
        
        // Now generate the quiz
        generateQuiz(text, response.summary);
      }
    } catch (error) {
      console.error('Summary error:', error);
      if (summaryContent) {
        summaryContent.textContent = `Failed to generate summary: ${error.message}`;
      }
    }
  }

  function checkQuizAnswers() {
    const questions = quizContent?.querySelectorAll('.question');
    if (!questions) return;

    let correctAnswers = 0;
    let totalQuestions = questions.length;

    questions.forEach((question) => {
      const selectedAnswer = question.querySelector('input[type="radio"]:checked');
      const correctAnswer = question.querySelector('.correct-answer')?.textContent;

      if (selectedAnswer && correctAnswer && selectedAnswer.value === correctAnswer) {
        correctAnswers++;
      }
    });

    const percentage = (correctAnswers / totalQuestions) * 100;
    const resultClass = percentage >= 80 ? 'good' : percentage >= 60 ? 'okay' : 'poor';

    // Create result element
    const resultElement = document.createElement('div');
    resultElement.className = `quiz-result ${resultClass}`;
    resultElement.textContent = `You scored ${percentage}% (${correctAnswers}/${totalQuestions} correct)`;

    // Remove any existing result
    const existingResult = quizContent?.querySelector('.quiz-result');
    if (existingResult) {
      existingResult.remove();
    }

    // Find the navigation element
    const navigation = quizContent?.querySelector('.quiz-navigation');
    
    // Insert the result after the navigation
    if (navigation && quizContent) {
      navigation.insertAdjacentElement('afterend', resultElement);
    }
  }

  // Add submit button after questions are generated
  function addSubmitButton() {
    if (!quizContent) return;

    // Remove any existing submit button
    const existingSubmit = quizContent.querySelector('.submit-quiz');
    if (existingSubmit) {
      existingSubmit.remove();
    }

    const submitButton = document.createElement('button');
    submitButton.className = 'submit-quiz';
    submitButton.textContent = 'Submit Answers';
    submitButton.addEventListener('click', checkQuizAnswers);
    quizContent.appendChild(submitButton);
  }

  async function generateQuiz(transcript, summary = '') {
    try {
      console.log('Starting quiz generation...');
      quizContainer?.classList.remove('hidden');
      if (quizContent) {
        quizContent.textContent = 'Generating questions...';
        quizContent.classList.add('collapsed');
      }
      quizHeader?.querySelector('.collapse-button')?.classList.add('collapsed');
      
      // Show loading indicator
      showLoadingIndicator(quizContainer);
      
      const response = await chrome.runtime.sendMessage({ 
        action: 'generate-quiz', 
        transcript,
        summary
      });

      console.log('Received quiz response:', response);
      if (response?.error) {
        console.error('Quiz error:', response.error);
        if (quizContent) {
          quizContent.textContent = `Failed to generate quiz: ${response.error}`;
        }
      } else {
        // Add navigation controls
        const navigationHtml = `
          <div class="quiz-navigation">
            <button class="nav-button" id="prevQuestion"><</button>
            <span id="questionCounter">Question 1/3</span>
            <button class="nav-button" id="nextQuestion">></button>
          </div>
        `;
        
        // Insert questions and navigation
        if (quizContent) {
          quizContent.innerHTML = response.questions + navigationHtml;
        }
        
        // Initialize question navigation
        currentQuestionIndex = 0;
        const questions = quizContent?.querySelectorAll('.question');
        if (questions) {
          totalQuestions = questions.length;
          
          // Show first question
          questions[0].classList.add('active');
        }
        updateQuestionCounter();
        
        // Add navigation event listeners
        const prevButton = quizContent?.querySelector('#prevQuestion');
        const nextButton = quizContent?.querySelector('#nextQuestion');
        
        prevButton?.addEventListener('click', () => navigateQuestions(-1));
        nextButton?.addEventListener('click', () => navigateQuestions(1));
        
        // Update button states
        updateNavigationButtons();
        
        // Add submit button
        addSubmitButton();
        
        // Show completion badge
        showCompletionBadge(quizContainer);
        
        // Keep quiz section collapsed after generation
        quizContent?.classList.add('collapsed');
        quizHeader?.querySelector('.collapse-button')?.classList.add('collapsed');
      }
    } catch (error) {
      console.error('Quiz error:', error);
      if (quizContent) {
        quizContent.textContent = `Failed to generate quiz: ${error.message}`;
      }
    }
  }

  function navigateQuestions(direction) {
    const questions = quizContent?.querySelectorAll('.question');
    if (!questions) return;

    questions[currentQuestionIndex].classList.remove('active');
    
    currentQuestionIndex = Math.max(0, Math.min(totalQuestions - 1, currentQuestionIndex + direction));
    
    questions[currentQuestionIndex].classList.add('active');
    updateQuestionCounter();
    updateNavigationButtons();
  }

  function updateQuestionCounter() {
    const counter = quizContent?.querySelector('#questionCounter');
    if (counter) {
      counter.textContent = `Question ${currentQuestionIndex + 1}/${totalQuestions}`;
    }
  }

  function updateNavigationButtons() {
    const prevButton = quizContent?.querySelector('#prevQuestion');
    const nextButton = quizContent?.querySelector('#nextQuestion');
    
    if (prevButton && nextButton) {
      prevButton.disabled = currentQuestionIndex === 0;
      nextButton.disabled = currentQuestionIndex === totalQuestions - 1;
    }
  }
  
  // Function to request fresh video info
  async function requestVideoInfo() {
    try {
      const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
      const currentTab = tabs?.[0];
      
      if (currentTab?.id && currentTab.url?.includes('youtube.com/watch')) {
        const response = await sendMessageWithTimeout({ type: 'REQUEST_VIDEO_INFO' });
        if (response?.error) {
          console.warn('Error requesting video info:', response.error);
          showState(noVideoState);
        }
      } else {
        showState(noVideoState);
      }
    } catch (error) {
      console.warn('Error requesting video info:', error);
      showState(noVideoState);
    }
  }

  // Request fresh info when popup opens
  requestVideoInfo();
  
  // Show loading state initially
  showState(loadingState);
  
  async function displayVideoInfo(videoInfo) {
    if (!videoInfo) {
      showState(noVideoState);
      return;
    }
    
    currentVideoInfo = videoInfo;
    if (videoTitle) {
      videoTitle.textContent = videoInfo.title || 'Unknown Title';
    }
    if (channelName) {
      channelName.textContent = videoInfo.channel || 'Unknown Channel';
    }
    
    summaryContainer?.classList.add('hidden');
    questionsContainer?.classList.add('hidden');
    quizContainer?.classList.add('hidden');
    
    if (videoInfo.transcript) {
      summarizeText(videoInfo.transcript);
    }
    
    showState(videoInfoState);
  }
  
  // Check stored video info
  chrome.storage.local.get(['currentVideoInfo'], async (result) => {
    if (chrome.runtime.lastError) {
      console.warn('Error getting stored video info:', chrome.runtime.lastError);
      showState(noVideoState);
      return;
    }

    if (result.currentVideoInfo) {
      await displayVideoInfo(result.currentVideoInfo);
    } else {
      const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
      const currentTab = tabs?.[0];
      
      if (currentTab?.url?.includes('youtube.com/watch')) {
        setTimeout(() => {
          chrome.storage.local.get(['currentVideoInfo'], async (latestResult) => {
            if (chrome.runtime.lastError) {
              console.warn('Error getting latest video info:', chrome.runtime.lastError);
              showState(noVideoState);
              return;
            }

            if (latestResult.currentVideoInfo) {
              await displayVideoInfo(latestResult.currentVideoInfo);
            } else {
              showState(noVideoState);
            }
          });
        }, 1000);
      } else {
        showState(noVideoState);
      }
    }
  });
  
  // Listen for video info updates
  chrome.storage.onChanged.addListener((changes, namespace) => {
    if (namespace === 'local' && changes.currentVideoInfo?.newValue) {
      displayVideoInfo(changes.currentVideoInfo.newValue);
    }
  });
  
  // Copy report button functionality
  copyReportButton?.addEventListener('click', () => {
    let reportText = '';
    
    if (copySummaryCheckbox?.checked && summaryContent) {
      reportText += `Summary:\n${summaryContent.textContent}\n\n`;
    }

    if (copyChatCheckbox?.checked && chatMessages) {
      reportText += 'AI Chat:\n';
      const messages = Array.from(chatMessages.children);
      messages.forEach(message => {
        const isUser = message.classList.contains('user');
        reportText += `${isUser ? 'You' : 'AI'}: ${message.textContent}\n`;
      });
      reportText += '\n';
    }
    
    if (copyQuizCheckbox?.checked && quizContent) {
      reportText += `Quiz:\n${quizContent.textContent}`;
    }
    
    if (!reportText) {
      alert('Please select at least one section to copy.');
      return;
    }
    
    navigator.clipboard.writeText(reportText.trim()).then(() => {
      const button = copyReportButton.querySelector('span');
      if (button) {
        const originalText = button.textContent;
        button.textContent = 'Copied!';
        copyReportButton.style.backgroundColor = '#4CAF50';
        
        setTimeout(() => {
          button.textContent = originalText;
          copyReportButton.style.backgroundColor = '';
        }, 1500);
      }
    }).catch(err => {
      console.error('Could not copy text: ', err);
      const button = copyReportButton.querySelector('span');
      if (button) {
        button.textContent = 'Error!';
      }
    });
  });

  // Generate new quiz button handler
  generateQuizButton?.addEventListener('click', () => {
    if (currentVideoInfo?.transcript && summaryContent) {
      const summaryText = summaryContent.textContent;
      generateQuiz(currentVideoInfo.transcript, summaryText);
      
      const button = generateQuizButton.querySelector('span');
      if (button) {
        const originalText = button.textContent;
        button.textContent = 'Generating...';
        generateQuizButton.style.backgroundColor = '#808080';
        
        setTimeout(() => {
          button.textContent = originalText;
          generateQuizButton.style.backgroundColor = '';
        }, 2000);
      }
    }
  });
  
  function showState(stateElement) {
    if (!stateElement) return;

    if (loadingState) loadingState.classList.add('hidden');
    if (noVideoState) noVideoState.classList.add('hidden');
    if (videoInfoState) videoInfoState.classList.add('hidden');
    
    stateElement.classList.remove('hidden');
  }
});