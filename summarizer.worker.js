import { pipeline } from '@xenova/transformers';

let summarizer = null;

async function initializeSummarizer() {
  try {
    summarizer = await pipeline('summarization', 'Xenova/distilbart-cnn-6-6', {
      quantized: true
    });
    self.postMessage({ type: 'MODEL_READY' });
  } catch (error) {
    self.postMessage({ type: 'ERROR', error: error.message });
  }
}

initializeSummarizer();

async function summarizeText(text, messageId) {
  try {
    if (!summarizer) {
      await initializeSummarizer();
    }

    const result = await summarizer(text, {
      max_length: 150,
      min_length: 50,
      do_sample: false
    });

    self.postMessage({
      type: 'SUMMARY_RESULT',
      summary: result[0].summary_text,
      messageId
    });
  } catch (error) {
    self.postMessage({
      type: 'ERROR',
      error: error.message,
      messageId
    });
  }
}

self.onmessage = async (event) => {
  if (event.data.type === 'SUMMARIZE') {
    await summarizeText(event.data.text, event.data.messageId);
  }
};