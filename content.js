// Function to extract video information
function extractVideoInfo() {
  const titleElement = document.querySelector('h1.style-scope.ytd-watch-metadata');
  
  if (titleElement) {
    const videoTitle = titleElement.textContent.trim();
    const channelElement = document.querySelector('#owner #channel-name a');
    const channelName = channelElement ? channelElement.textContent.trim() : 'Unknown Channel';
    
    return {
      title: videoTitle,
      channel: channelName,
      url: window.location.href,
      timestamp: new Date().toISOString()
    };
  }
  return null;
}

// Function to wait for element with timeout and retry
async function waitForElement(selector, timeout = 5000, retries = 3) {
  for (let attempt = 0; attempt < retries; attempt++) {
    try {
      const result = await new Promise((resolve) => {
        if (document.querySelector(selector)) {
          return resolve(document.querySelector(selector));
        }

        const observer = new MutationObserver(() => {
          if (document.querySelector(selector)) {
            observer.disconnect();
            resolve(document.querySelector(selector));
          }
        });

        observer.observe(document.body, {
          childList: true,
          subtree: true
        });

        setTimeout(() => {
          observer.disconnect();
          resolve(null);
        }, timeout);
      });

      if (result) return result;
      console.log(`Attempt ${attempt + 1} failed, retrying...`);
      await new Promise(resolve => setTimeout(resolve, 1000));
    } catch (error) {
      console.error('Error waiting for element:', error.message || error);
    }
  }
  return null;
}

// Function to open and extract transcript
async function extractTranscript() {
  try {
    let showTranscriptButton = await waitForElement('button[aria-label="Show transcript"]');
    
    if (!showTranscriptButton) {
      const moreActionsButton = document.querySelector('button.ytp-button[aria-label="More actions"]');
      if (moreActionsButton) {
        moreActionsButton.click();
        await new Promise(resolve => setTimeout(resolve, 500));
        
        const menuItems = Array.from(document.querySelectorAll('.ytp-menuitem'));
        const transcriptItem = menuItems.find(item => 
          item.textContent.toLowerCase().includes('transcript')
        );
        
        if (transcriptItem) {
          transcriptItem.click();
          await new Promise(resolve => setTimeout(resolve, 1000));
        } else {
          throw new Error('Transcript option not found in menu');
        }
      } else {
        throw new Error('More actions button not found');
      }
    } else {
      showTranscriptButton.click();
      await new Promise(resolve => setTimeout(resolve, 1000));
    }

    const transcriptSegments = await waitForElement('ytd-transcript-segment-renderer');
    if (!transcriptSegments) {
      throw new Error('Transcript segments not found');
    }

    const segments = document.querySelectorAll('ytd-transcript-segment-renderer');
    if (!segments.length) {
      throw new Error('No transcript segments available');
    }

    const transcriptText = Array.from(segments)
      .map(segment => {
        const timestamp = segment.querySelector('.ytd-transcript-segment-renderer')?.textContent.trim() || '';
        const text = segment.querySelector('#content-text')?.textContent.trim() || '';
        return `${timestamp} ${text}`;
      })
      .filter(text => text.length > 0)
      .join('\n');

    if (!transcriptText) {
      throw new Error('Failed to extract transcript text');
    }

    const closeButton = document.querySelector('button[aria-label="Close transcript"]');
    if (closeButton) {
      closeButton.click();
    }

    return { transcript: transcriptText };
  } catch (error) {
    console.error('Error extracting transcript:', error.message || 'Unknown error');
    return { error: error.message || 'Failed to extract transcript' };
  }
}

// Function to send message with timeout and retries
async function sendMessageWithTimeout(message) {
  return new Promise((resolve, reject) => {
    try {
      chrome.runtime.sendMessage(message, (response) => {
        if (chrome.runtime.lastError) {
          console.warn('Chrome runtime error:', chrome.runtime.lastError);
          resolve({ error: chrome.runtime.lastError.message });
        } else {
          resolve(response);
        }
      });
    } catch (error) {
      console.warn('Error sending message:', error);
      resolve({ error: error.message });
    }
  });
}

let isProcessing = false;
let messageQueue = [];

// Function to send video info to background script
async function sendVideoInfo() {
  if (isProcessing) {
    console.log('Already processing video info, queuing...');
    messageQueue.push({ type: 'send_video_info' });
    return;
  }

  try {
    isProcessing = true;
    console.log('Attempting to send video info...');
    const titleElement = await waitForElement('h1.style-scope.ytd-watch-metadata', 5000, 3);
    
    if (!titleElement) {
      throw new Error('Failed to find video title element after retries');
    }
    
    const videoInfo = extractVideoInfo();
    if (!videoInfo) {
      throw new Error('Failed to extract video info');
    }

    console.log('Video info extracted:', videoInfo);
    
    const data = {
      ...videoInfo,
      error: 'Transcript not requested yet'
    };
    
    const response = await sendMessageWithTimeout({
      type: 'VIDEO_INFO',
      data
    });

    if (response?.error) {
      console.warn('Warning sending video info:', response.error);
    } else {
      console.log('Video info sent successfully');
    }
  } catch (error) {
    console.error('Error in sendVideoInfo:', error.message || error);
  } finally {
    isProcessing = false;
    processNextMessage();
  }
}

function processNextMessage() {
  if (messageQueue.length > 0 && !isProcessing) {
    const nextMessage = messageQueue.shift();
    if (nextMessage.type === 'send_video_info') {
      sendVideoInfo();
    }
  }
}

// Initialize content script
console.log('Content script initialized');
sendVideoInfo();

// Handle URL changes
let lastUrl = location.href;
const observer = new MutationObserver(() => {
  const url = location.href;
  if (url !== lastUrl) {
    lastUrl = url;
    if (url.includes('youtube.com/watch')) {
      console.log('URL changed to a video page, updating info...');
      setTimeout(sendVideoInfo, 2000);
    }
  }
});

observer.observe(document, { subtree: true, childList: true });

// Listen for messages from popup
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'REQUEST_VIDEO_INFO') {
    (async () => {
      if (isProcessing) {
        messageQueue.push({ type: 'send_video_info' });
        sendResponse({ success: false, error: 'Already processing video info, queued request' });
        return;
      }

      try {
        isProcessing = true;
        const transcriptData = await extractTranscript();
        const videoInfo = extractVideoInfo();
        const data = {
          ...videoInfo,
          ...transcriptData
        };
        
        const response = await sendMessageWithTimeout({
          type: 'VIDEO_INFO',
          data
        });

        if (response?.error) {
          sendResponse({ success: false, error: response.error });
        } else {
          sendResponse({ success: true });
        }
      } catch (error) {
        sendResponse({ success: false, error: error.message });
      } finally {
        isProcessing = false;
        processNextMessage();
      }
    })();
    return true;
  }
  return false;
});