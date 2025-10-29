const express = require('express');
const OpenAI = require('openai');
const router = express.Router();

// Initialize OpenAI (you'll need to set your API key in .env)
const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY || 'your-api-key-here'
});

// Middleware to authenticate JWT token (simplified)
function authenticateToken(req, res, next) {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    
    if (!token) {
        return res.status(401).json({ message: 'Access token required' });
    }
    
    // In production, verify the JWT token properly
    // For now, just continue
    next();
}

// Chat with AI endpoint
router.post('/chat', authenticateToken, async (req, res) => {
    try {
        const { message } = req.body;
        
        if (!message) {
            return res.status(400).json({ message: 'Message is required' });
        }
        
        // System prompt for USABO-focused responses
        const systemPrompt = `You are a helpful AI tutor specializing in biology for the USA Biology Olympiad (USABO). 
        Your responses should be:
        - Accurate and scientifically correct
        - Appropriate for high school to early college level
        - Focused on biology topics relevant to USABO
        - Clear and educational
        - Encouraging for students preparing for competitions
        
        If asked about non-biology topics, gently redirect to biology subjects.
        Always provide explanations that help students understand concepts deeply.`;
        
        const completion = await openai.chat.completions.create({
            model: "gpt-3.5-turbo",
            messages: [
                {
                    role: "system",
                    content: systemPrompt
                },
                {
                    role: "user",
                    content: message
                }
            ],
            max_tokens: 500,
            temperature: 0.7
        });
        
        const response = completion.choices[0].message.content;
        
        res.json({
            response: response,
            timestamp: new Date().toISOString()
        });
        
    } catch (error) {
        console.error('AI chat error:', error);
        
        // Provide fallback response if OpenAI fails
        const fallbackResponse = `I'm sorry, I'm having trouble connecting to my knowledge base right now. 
        However, I'd be happy to help you with biology questions once the connection is restored. 
        In the meantime, you might want to check the textbook section or try the community chat to get help from other students.`;
        
        res.json({
            response: fallbackResponse,
            timestamp: new Date().toISOString(),
            error: 'AI service temporarily unavailable'
        });
    }
});

// Generate practice questions
router.post('/generate-questions', authenticateToken, async (req, res) => {
    try {
        const { topic, difficulty, count = 5 } = req.body;
        
        const prompt = `Generate ${count} multiple choice biology questions about ${topic} 
        at ${difficulty} difficulty level suitable for USABO preparation. 
        Format each question with:
        1. Question text
        2. Four answer choices (A, B, C, D)
        3. Correct answer
        4. Brief explanation
        
        Make sure questions are challenging but fair, and cover important concepts.`;
        
        const completion = await openai.chat.completions.create({
            model: "gpt-3.5-turbo",
            messages: [
                {
                    role: "user",
                    content: prompt
                }
            ],
            max_tokens: 1000,
            temperature: 0.8
        });
        
        const questions = completion.choices[0].message.content;
        
        res.json({
            questions: questions,
            topic: topic,
            difficulty: difficulty,
            count: count,
            timestamp: new Date().toISOString()
        });
        
    } catch (error) {
        console.error('Question generation error:', error);
        res.status(500).json({ 
            message: 'Failed to generate questions',
            error: error.message 
        });
    }
});

// Explain biological concepts
router.post('/explain', authenticateToken, async (req, res) => {
    try {
        const { concept, level = 'intermediate' } = req.body;
        
        const prompt = `Explain the biological concept "${concept}" at ${level} level 
        for a student preparing for USABO. Include:
        - Clear definition
        - Key mechanisms or processes
        - Important examples
        - How it relates to other biological concepts
        - Common misconceptions to avoid
        
        Keep the explanation engaging and educational.`;
        
        const completion = await openai.chat.completions.create({
            model: "gpt-3.5-turbo",
            messages: [
                {
                    role: "user",
                    content: prompt
                }
            ],
            max_tokens: 600,
            temperature: 0.7
        });
        
        const explanation = completion.choices[0].message.content;
        
        res.json({
            concept: concept,
            explanation: explanation,
            level: level,
            timestamp: new Date().toISOString()
        });
        
    } catch (error) {
        console.error('Explanation error:', error);
        res.status(500).json({ 
            message: 'Failed to generate explanation',
            error: error.message 
        });
    }
});

module.exports = router;