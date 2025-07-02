/**
 * UAT Feedback Collection Tool
 * Phase 5.2.4 - User Acceptance Testing Support
 * 
 * Interactive CLI tool to collect structured feedback from UAT participants.
 * Allows testers to submit feedback on features, usability, and overall experience.
 */

const readline = require('readline');
const fs = require('fs');
const path = require('path');

// Setup readline interface
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

// Configuration
const config = {
  outputDir: path.join(__dirname, '..', 'results', 'feedback'),
  sessionId: `uat-session-${new Date().toISOString().replace(/:/g, '-')}`
};

// Ensure output directory exists
if (!fs.existsSync(config.outputDir)) {
  fs.mkdirSync(config.outputDir, { recursive: true });
}

// Feedback categories
const CATEGORIES = {
  FEATURE: 'Feature Functionality',
  USABILITY: 'Usability',
  PERFORMANCE: 'Performance',
  UI: 'User Interface',
  SUGGESTION: 'Suggestion',
  BUG: 'Bug Report'
};

// Rating scale
const RATINGS = {
  1: 'Very Poor',
  2: 'Poor',
  3: 'Acceptable',
  4: 'Good',
  5: 'Excellent'
};

/**
 * Ask a question and get input
 * @param {string} question Question to ask
 * @returns {Promise<string>} User's response
 */
function askQuestion(question) {
  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      resolve(answer);
    });
  });
}

/**
 * Ask for a rating on the 1-5 scale
 * @param {string} aspect What is being rated
 * @returns {Promise<number>} Rating between 1-5
 */
async function askRating(aspect) {
  const ratingText = Object.entries(RATINGS)
    .map(([num, label]) => `${num} - ${label}`)
    .join(', ');
    
  let rating = 0;
  while (rating < 1 || rating > 5) {
    const response = await askQuestion(`Rate ${aspect} (${ratingText}): `);
    rating = parseInt(response);
    if (isNaN(rating) || rating < 1 || rating > 5) {
      console.log('Please enter a number between 1 and 5.');
    }
  }
  return rating;
}

/**
 * Display a list of options and get user selection
 * @param {string} title Title of the selection
 * @param {Object} options Key-value pairs of options
 * @returns {Promise<string>} Selected option key
 */
async function selectOption(title, options) {
  console.log(`\n${title}:`);
  const keys = Object.keys(options);
  keys.forEach((key, index) => {
    console.log(`${index + 1}. ${options[key]}`);
  });
  
  let selection = 0;
  while (selection < 1 || selection > keys.length) {
    const response = await askQuestion(`Select an option (1-${keys.length}): `);
    selection = parseInt(response);
    if (isNaN(selection) || selection < 1 || selection > keys.length) {
      console.log(`Please enter a number between 1 and ${keys.length}.`);
    }
  }
  return keys[selection - 1];
}

/**
 * Collect detailed feedback for a specific feature or area
 */
async function collectFeedback() {
  console.log('\n=== UAT Feedback Collection ===\n');
  
  // Get participant info
  const participantName = await askQuestion('Your Name: ');
  const participantRole = await askQuestion('Your Role (e.g., Business Analyst, Manager): ');
  const testCaseId = await askQuestion('Test Case ID (optional): ');
  
  // Get feedback category
  const category = await selectOption('Select Feedback Category', CATEGORIES);
  
  // Get feedback details
  console.log('\n--- Feedback Details ---');
  const featureArea = await askQuestion('Feature/Area: ');
  const feedbackTitle = await askQuestion('Feedback Title/Summary: ');
  
  console.log('\nPlease provide your detailed feedback (type END on a new line when finished):');
  let feedbackDetails = '';
  let line = '';
  
  while (line.trim().toUpperCase() !== 'END') {
    line = await askQuestion('> ');
    if (line.trim().toUpperCase() !== 'END') {
      feedbackDetails += line + '\n';
    }
  }
  
  // Get ratings
  console.log('\n--- Ratings ---');
  const ratings = {};
  
  switch (category) {
    case 'FEATURE':
      ratings.functionality = await askRating('feature functionality');
      ratings.completeness = await askRating('feature completeness');
      ratings.easeOfUse = await askRating('ease of use');
      break;
    case 'USABILITY':
      ratings.efficiency = await askRating('workflow efficiency');
      ratings.learnability = await askRating('ease of learning');
      ratings.satisfaction = await askRating('overall satisfaction');
      break;
    case 'PERFORMANCE':
      ratings.speed = await askRating('response time');
      ratings.reliability = await askRating('reliability');
      break;
    case 'UI':
      ratings.layout = await askRating('layout and organization');
      ratings.visualDesign = await askRating('visual design');
      ratings.responsiveness = await askRating('responsiveness');
      break;
    default:
      // No ratings for suggestions and bug reports
      break;
  }
  
  // Additional questions
  console.log('\n--- Additional Information ---');
  const impactOnWorkflow = await askQuestion('How would this impact your daily workflow? ');
  const suggestedImprovements = await askQuestion('Any specific suggestions for improvement? ');
  
  // Compile the feedback
  const feedback = {
    metadata: {
      participantName,
      participantRole,
      testCaseId: testCaseId || 'N/A',
      sessionId: config.sessionId,
      timestamp: new Date().toISOString(),
      category: CATEGORIES[category]
    },
    content: {
      featureArea,
      title: feedbackTitle,
      details: feedbackDetails.trim(),
      ratings: ratings,
      impactOnWorkflow,
      suggestedImprovements
    }
  };
  
  // Save feedback
  const feedbackFilename = path.join(
    config.outputDir,
    `${config.sessionId}-${category.toLowerCase()}-${Date.now()}.json`
  );
  
  fs.writeFileSync(feedbackFilename, JSON.stringify(feedback, null, 2));
  console.log(`\nFeedback saved to ${feedbackFilename}`);
  
  // Create markdown summary for easy reading
  const markdownSummary = `
# UAT Feedback: ${feedbackTitle}

## Metadata
- **Participant:** ${participantName} (${participantRole})
- **Category:** ${CATEGORIES[category]}
- **Feature/Area:** ${featureArea}
- **Date:** ${new Date().toLocaleString()}
${testCaseId ? `- **Test Case:** ${testCaseId}` : ''}

## Feedback Details
${feedbackDetails.trim()}

${Object.keys(ratings).length > 0 ? `
## Ratings
${Object.entries(ratings).map(([key, value]) => `- **${key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}:** ${value}/5 (${RATINGS[value]})`).join('\n')}
` : ''}

## Additional Information
- **Impact on Workflow:** ${impactOnWorkflow}
- **Suggested Improvements:** ${suggestedImprovements}
  `.trim();
  
  const markdownFilename = feedbackFilename.replace('.json', '.md');
  fs.writeFileSync(markdownFilename, markdownSummary);
  console.log(`Markdown summary saved to ${markdownFilename}`);
  
  return feedbackFilename;
}

/**
 * Main function for the feedback tool
 */
async function main() {
  try {
    console.clear();
    console.log('\n===================================');
    console.log('  RENEXUS UAT FEEDBACK COLLECTION  ');
    console.log('===================================\n');
    console.log('Welcome to the UAT feedback collection tool.');
    console.log('This tool will guide you through providing structured feedback on the Renexus application.\n');
    
    let continueFeedback = true;
    const submittedFeedback = [];
    
    while (continueFeedback) {
      const feedbackFile = await collectFeedback();
      submittedFeedback.push(feedbackFile);
      
      const continueResponse = await askQuestion('\nWould you like to submit additional feedback? (yes/no): ');
      continueFeedback = continueResponse.toLowerCase() === 'yes' || continueResponse.toLowerCase() === 'y';
    }
    
    console.log('\n===================================');
    console.log('  FEEDBACK SUBMISSION COMPLETE  ');
    console.log('===================================\n');
    console.log(`You submitted ${submittedFeedback.length} feedback item(s):`);
    submittedFeedback.forEach(file => {
      console.log(`- ${path.basename(file)}`);
    });
    console.log('\nThank you for your participation in the UAT process!');
    console.log('Your feedback helps us improve the Renexus application.\n');
    
  } catch (error) {
    console.error('An error occurred during feedback collection:', error);
  } finally {
    rl.close();
  }
}

// Execute if run directly
if (require.main === module) {
  main();
}

module.exports = {
  collectFeedback,
  main
};
