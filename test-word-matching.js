// Comprehensive test for word-based matching with detailed breakdown
function extractCoreWords(title) {
  return title
    .toLowerCase()
    .replace(/[°':!?.,()-]/g, ' ')
    .replace(/\b(the|and|or|of|in|on|at|to|for|with|by|no|hen|wa)\b/g, ' ')
    .split(/\s+/)
    .filter(word => word.length > 2)
    .filter(word => !['season', 'part', 'final', 'new', 'movie', 'ova', 'special', 'episode'].includes(word));
}

function calculateWordBasedMatch(title1, title2) {
  // Split into words and clean them
  function getWords(title) {
    return title
      .toLowerCase()
      .replace(/[°':!?.,()-]/g, ' ')
      .split(/\s+/)
      .filter(word => word.length > 0);
  }
  
  const words1 = getWords(title1);
  const words2 = getWords(title2);
  
  console.log(`  Raw words: "${title1}" → [${words1.join(', ')}]`);
  console.log(`  Raw words: "${title2}" → [${words2.join(', ')}]`);
  
  // Find which has fewer words (shorter)
  const shorterWords = words1.length <= words2.length ? words1 : words2;
  const longerWords = words1.length <= words2.length ? words2 : words1;
  const shorterTitle = words1.length <= words2.length ? title1 : title2;
  const longerTitle = words1.length <= words2.length ? title2 : title1;
  
  console.log(`  Shorter (${shorterWords.length} words): "${shorterTitle}" → [${shorterWords.join(', ')}]`);
  console.log(`  Longer (${longerWords.length} words): "${longerTitle}" → [${longerWords.join(', ')}]`);
  
  // Count how many words from shorter are contained in longer
  const matchedWords = [];
  const unmatchedWords = [];
  
  shorterWords.forEach(word => {
    const found = longerWords.some(longerWord => 
      longerWord.includes(word) || word.includes(longerWord)
    );
    
    if (found) {
      matchedWords.push(word);
    } else {
      unmatchedWords.push(word);
    }
  });
  
  console.log(`  ✅ Matched words: [${matchedWords.join(', ')}] (${matchedWords.length}/${shorterWords.length})`);
  console.log(`  ❌ Unmatched words: [${unmatchedWords.join(', ')}]`);
  
  // Return percentage of shorter title's words that match
  const percentage = shorterWords.length > 0 ? matchedWords.length / shorterWords.length : 0;
  console.log(`  📊 Word match calculation: ${matchedWords.length} ÷ ${shorterWords.length} = ${(percentage * 100).toFixed(1)}%`);
  
  return percentage;
}

function testCompleteLogic(currentTitle, seriesTitle) {
  console.log(`\n${'='.repeat(80)}`);
  console.log(`🎬 Testing: "${currentTitle}" vs "${seriesTitle}"`);
  console.log(`${'='.repeat(80)}`);
  
  // Core word similarity calculation
  const words1 = extractCoreWords(currentTitle);
  const words2 = extractCoreWords(seriesTitle);
  const sharedWords = words1.filter(word => words2.includes(word));
  const similarity = words1.length > 0 && words2.length > 0 
    ? sharedWords.length / Math.max(words1.length, words2.length) 
    : 0;
  
  console.log(`\n🔍 Core Word Similarity Analysis:`);
  console.log(`  Core words: "${currentTitle}" → [${words1.join(', ')}]`);
  console.log(`  Core words: "${seriesTitle}" → [${words2.join(', ')}]`);
  console.log(`  Shared core words: [${sharedWords.join(', ')}]`);
  console.log(`  Core similarity: ${sharedWords.length} ÷ max(${words1.length}, ${words2.length}) = ${(similarity * 100).toFixed(1)}%`);
  
  // Word-based match calculation
  console.log(`\n🔍 Word-Based Match Analysis:`);
  const substringMatchPercentage = calculateWordBasedMatch(currentTitle, seriesTitle);
  
  // Auto-assignment logic
  console.log(`\n⚖️ Auto-Assignment Decision:`);
  const shorterWordCount = Math.min(
    currentTitle.split(/\s+/).length, 
    seriesTitle.split(/\s+/).length
  );
  const isSimpleCase = substringMatchPercentage >= 1.0 && shorterWordCount <= 2;
  
  console.log(`  Shorter word count: ${shorterWordCount}`);
  console.log(`  Perfect word match (100%): ${substringMatchPercentage >= 1.0}`);
  console.log(`  Simple case (≤2 words): ${shorterWordCount <= 2}`);
  console.log(`  Is simple case: ${isSimpleCase}`);
  console.log(`  Core similarity >80%: ${similarity > 0.8}`);
  
  const wouldAutoAssign = similarity > 0.8 && isSimpleCase;
  const wouldAskUser = similarity > 0.4 && !wouldAutoAssign;
  
  console.log(`\n🎯 Final Decision:`);
  if (wouldAutoAssign) {
    console.log(`  ✅ AUTO-ASSIGN (High similarity + Perfect word match + Simple)`);
  } else if (wouldAskUser) {
    console.log(`  🤔 ASK USER (Potential match but not auto-assignable)`);
  } else {
    console.log(`  ❌ NO MATCH (Low similarity)`);
  }
  
  return { wouldAutoAssign, wouldAskUser, similarity, wordMatch: substringMatchPercentage };
}

// Comprehensive test cases
console.log('🧪 COMPREHENSIVE WORD-BASED MATCHING TEST');
console.log('Testing various anime title combinations...\n');

const results = [];

// Simple cases that should auto-assign
results.push(testCompleteLogic('Gintama', 'Gintama°'));
results.push(testCompleteLogic('Tokyo Ghoul', 'Tokyo Ghoul √A'));

// Complex cases that should ask user
results.push(testCompleteLogic('Gintama. Shirogane no Tamashii-hen - Kouhan-sen', 'Gintama'));
results.push(testCompleteLogic('One Piece', 'One Piece Fan Letter'));
results.push(testCompleteLogic('Attack on Titan', 'Attack on Titan: Season 2'));
results.push(testCompleteLogic('Naruto', 'Naruto: Shippuden'));

// Edge cases
results.push(testCompleteLogic('Full Metal Alchemist', 'Fullmetal Alchemist: Brotherhood'));
results.push(testCompleteLogic('Jujutsu Kaisen', 'Jujutsu Kaisen 2nd Season'));

console.log(`\n${'='.repeat(80)}`);
console.log('📊 SUMMARY OF RESULTS');
console.log(`${'='.repeat(80)}`);

const autoAssignCount = results.filter(r => r.wouldAutoAssign).length;
const askUserCount = results.filter(r => r.wouldAskUser).length;
const noMatchCount = results.filter(r => !r.wouldAutoAssign && !r.wouldAskUser).length;

console.log(`Auto-assign: ${autoAssignCount}/${results.length}`);
console.log(`Ask user: ${askUserCount}/${results.length}`);
console.log(`No match: ${noMatchCount}/${results.length}`);
