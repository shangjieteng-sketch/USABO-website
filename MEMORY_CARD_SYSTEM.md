# Memory Card System - Quizlet-Style Implementation

## Overview
The USABO website includes a comprehensive memory card system similar to Quizlet, designed to help students memorize biology concepts through spaced repetition and active recall.

## Features

### 1. Card Creation
- **User-Generated Cards**: Students can create their own flashcards
- **Pre-made Decks**: Curated cards by topic and difficulty level
- **Rich Content**: Support for text, simple formatting, and placeholder for future image support
- **Categorization**: Cards organized by biology topics (molecular biology, cell biology, etc.)

### 2. Study Modes

#### Flashcard Mode
- Traditional front/back card review
- Click to flip between question and answer
- Mark cards as "easy," "medium," or "hard" for spaced repetition

#### Learn Mode
- Adaptive learning algorithm
- Cards repeat based on user performance
- Focuses on cards marked as difficult

#### Test Mode
- Multiple choice questions generated from cards
- Timed sessions optional
- Immediate feedback with explanations

#### Match Mode
- Match terms with definitions
- Drag-and-drop interface
- Timed challenges for engagement

### 3. Progress Tracking
- **Study Statistics**: Track study time, cards mastered, accuracy rates
- **Progress Visualization**: Charts showing improvement over time
- **Streak Counters**: Daily study streaks for motivation
- **Mastery Levels**: Cards progress from "Learning" → "Familiar" → "Mastered"

### 4. Social Features
- **Study Groups**: Join groups to study shared card decks
- **Collaborative Decks**: Multiple users can contribute to shared decks
- **Leaderboards**: Friendly competition within study groups
- **Card Sharing**: Share individual cards or entire decks

## Technical Implementation

### Database Schema
```sql
-- Memory Cards Table
CREATE TABLE memory_cards (
    id SERIAL PRIMARY KEY,
    front TEXT NOT NULL,
    back TEXT NOT NULL,
    category VARCHAR(50),
    difficulty VARCHAR(20),
    created_by INTEGER REFERENCES users(id),
    created_at TIMESTAMP DEFAULT NOW(),
    public BOOLEAN DEFAULT true,
    tags TEXT[]
);

-- User Card Progress Table
CREATE TABLE user_card_progress (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id),
    card_id INTEGER REFERENCES memory_cards(id),
    study_count INTEGER DEFAULT 0,
    correct_count INTEGER DEFAULT 0,
    last_studied TIMESTAMP,
    mastery_level VARCHAR(20) DEFAULT 'learning',
    next_review TIMESTAMP
);

-- Study Sessions Table
CREATE TABLE study_sessions (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id),
    deck_id INTEGER,
    started_at TIMESTAMP DEFAULT NOW(),
    completed_at TIMESTAMP,
    cards_studied INTEGER,
    accuracy_rate DECIMAL(5,2)
);
```

### API Endpoints

#### Card Management
- `GET /api/community/memory-cards` - Get cards with filtering
- `POST /api/community/memory-cards` - Create new card
- `PUT /api/community/memory-cards/:id` - Update card
- `DELETE /api/community/memory-cards/:id` - Delete card

#### Study Sessions
- `POST /api/community/memory-cards/study-session` - Start study session
- `POST /api/community/memory-cards/answer` - Submit card answer
- `GET /api/community/memory-cards/progress/:userId` - Get user progress

#### Decks and Collections
- `GET /api/community/decks` - Get available decks
- `POST /api/community/decks` - Create new deck
- `POST /api/community/decks/:id/cards` - Add cards to deck

### Frontend Components

#### Card Component
```javascript
// Card display component with flip animation
const MemoryCard = ({ card, onAnswer, showBack }) => {
    return (
        <div className={`memory-card ${showBack ? 'flipped' : ''}`}>
            <div className="card-front">
                <h3>{card.front}</h3>
                <div className="card-category">{card.category}</div>
            </div>
            <div className="card-back">
                <p>{card.back}</p>
                <div className="answer-buttons">
                    <button onClick={() => onAnswer('hard')}>Hard</button>
                    <button onClick={() => onAnswer('medium')}>Medium</button>
                    <button onClick={() => onAnswer('easy')}>Easy</button>
                </div>
            </div>
        </div>
    );
};
```

#### Study Session Manager
```javascript
// Manages study session state and progress
const StudySession = ({ deckId }) => {
    const [currentCard, setCurrentCard] = useState(0);
    const [showBack, setShowBack] = useState(false);
    const [sessionStats, setSessionStats] = useState({});
    
    // Study session logic here
};
```

## Spaced Repetition Algorithm

### Basic Algorithm
1. **New Cards**: Show after 1 day, then 3 days, then 1 week
2. **Easy Cards**: Increase interval by 2.5x
3. **Medium Cards**: Increase interval by 1.3x  
4. **Hard Cards**: Reset to 1 day interval

### Implementation
```javascript
function calculateNextReview(difficulty, currentInterval) {
    const multipliers = {
        'easy': 2.5,
        'medium': 1.3,
        'hard': 1.0  // Reset to base interval
    };
    
    const baseInterval = currentInterval || 1; // days
    const nextInterval = Math.ceil(baseInterval * multipliers[difficulty]);
    
    return new Date(Date.now() + nextInterval * 24 * 60 * 60 * 1000);
}
```

## Study Modes Implementation

### 1. Flashcard Mode
- Simple front/back card display
- User self-assessment (easy/medium/hard)
- Progress tracking with spaced repetition

### 2. Multiple Choice Mode
- Generate 3 incorrect answers from other cards in same category
- Immediate feedback with explanation
- Track accuracy for algorithm adjustment

### 3. Typing Mode
- User types the answer
- Fuzzy matching for close answers
- Helpful for exact term memorization

### 4. Audio Mode (Future)
- Text-to-speech for pronunciation
- Audio cues for auditory learners
- Particularly useful for scientific terminology

## Content Organization

### Categories
- **Molecular Biology**: DNA, RNA, proteins, enzymes
- **Cell Biology**: Organelles, cell processes, membranes
- **Plant Biology**: Anatomy, physiology, reproduction
- **Animal Physiology**: Systems, homeostasis, behavior
- **Ecology**: Ecosystems, populations, interactions
- **Genetics**: Inheritance, mutations, population genetics
- **Evolution**: Natural selection, speciation, phylogeny
- **Biochemistry**: Metabolic pathways, molecules

### Difficulty Levels
- **Beginner**: Basic terms and concepts
- **Intermediate**: Detailed mechanisms and processes
- **Advanced**: Complex interactions and applications

### Tags System
- Cross-reference related concepts
- Enable advanced filtering
- Support for multiple classification schemes

## Integration with USABO Website

### Navigation
- Accessible from Community section
- Quick access button on main navigation
- Integration with study groups and chat

### User Progress Integration
- Link with problem set performance
- Recommend cards based on weak areas
- Integration with AI tutor for personalized suggestions

### Content Synchronization
- Cards linked to textbook sections
- Automatic generation from textbook content
- Sync with experiment procedures and terminology

## Future Enhancements

### 1. Adaptive Learning
- Machine learning to optimize review intervals
- Personalized difficulty adjustment
- Predictive modeling for knowledge retention

### 2. Collaborative Features
- Real-time collaborative deck editing
- Peer review and rating system
- Community-curated official USABO decks

### 3. Advanced Content
- Image occlusion for diagram memorization
- Chemical structure drawing integration
- Interactive molecular models

### 4. Analytics
- Detailed learning analytics
- Performance comparison with peers
- Weak area identification and recommendations

### 5. Mobile App
- Offline study capabilities
- Push notifications for review reminders
- Gesture-based interactions

## Best Practices for Students

### Effective Card Creation
1. **One Concept Per Card**: Keep cards focused on single concepts
2. **Use Active Voice**: Write clear, direct questions
3. **Include Context**: Add enough context for understanding
4. **Use Examples**: Include specific examples when helpful

### Study Strategies
1. **Regular Sessions**: Study daily for 15-30 minutes
2. **Review Schedule**: Follow spaced repetition recommendations
3. **Active Recall**: Try to answer before flipping card
4. **Explanation**: Explain concepts aloud when reviewing

### Content Guidelines
1. **Accuracy**: Ensure all content is scientifically accurate
2. **Clarity**: Use clear, unambiguous language
3. **Consistency**: Follow consistent formatting and terminology
4. **Attribution**: Credit sources for complex concepts

## Moderation and Quality Control

### Community Moderation
- Report system for inappropriate content
- Peer review for public cards
- Admin review for official USABO content

### Quality Metrics
- User ratings and reviews
- Usage statistics and engagement
- Accuracy verification system

This memory card system provides a comprehensive, Quizlet-style learning experience tailored specifically for USABO preparation, with room for future enhancements and community growth.