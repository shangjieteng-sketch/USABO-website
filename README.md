# USABO Study Platform

A comprehensive web platform for USA Biology Olympiad (USABO) preparation featuring interactive experiments, study materials, community features, and AI-powered assistance.

## Features

### 🧬 Core Functionality
- **Interactive Textbook**: Organized biology content with molecular diagrams and detailed explanations
- **Virtual Experiments**: Step-by-step laboratory simulations with real-time feedback
- **Problem Sets**: Practice questions from past USABO exams and AI-generated problems
- **Memory Cards**: Quizlet-style flashcard system with spaced repetition
- **AI Tutor**: OpenAI-powered study assistant for personalized help
- **Community Chat**: Real-time discussion platform for students

### 🔬 Study Materials
- Molecular Biology (DNA, RNA, proteins)
- Cell Biology (organelles, processes)
- Plant Biology (anatomy, physiology)
- Animal Physiology (systems, homeostasis)
- Biochemistry (pathways, molecules)
- Microbiology (bacteria, viruses)

### 🧪 Interactive Experiments
- PCR Amplification simulation
- Gel Electrophoresis virtual lab
- Enzyme Kinetics analysis
- Microscopy techniques
- DNA Extraction protocols

### 👥 Community Features
- Student authentication with email verification
- Real-time chat with biology-focused moderation
- Study groups and collaborative learning
- Memory card sharing and deck creation
- Progress tracking and statistics

## Technology Stack

### Backend
- **Node.js** with Express.js framework
- **Socket.IO** for real-time chat functionality
- **SQLite** database (development) / PostgreSQL (production)
- **JWT** authentication
- **OpenAI API** integration
- **bcryptjs** for password hashing

### Frontend
- **HTML5/CSS3** with modern responsive design
- **Vanilla JavaScript** with Socket.IO client
- **Font Awesome** icons
- **CSS Grid/Flexbox** for layouts

### Security & Performance
- **Helmet.js** for security headers
- **Rate limiting** to prevent abuse
- **CORS** configuration
- **Input validation** and sanitization
- **Content moderation** for community features

## Quick Start

### Prerequisites
- Node.js (v16 or higher)
- npm or yarn package manager
- OpenAI API key (for AI features)

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd usabo-website
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Environment Configuration**
   ```bash
   cp .env.example .env
   ```
   
   Edit `.env` file:
   ```
   PORT=3000
   JWT_SECRET=your_secure_jwt_secret_here
   OPENAI_API_KEY=your_openai_api_key_here
   EMAIL_HOST=smtp.gmail.com
   EMAIL_PORT=587
   EMAIL_USER=your_email@gmail.com
   EMAIL_PASS=your_app_password
   NODE_ENV=development
   ```

4. **Start the development server**
   ```bash
   npm run dev
   ```

5. **Access the application**
   Open your browser to `http://localhost:3000`

### Production Deployment

1. **Set environment to production**
   ```bash
   NODE_ENV=production
   ```

2. **Use process manager**
   ```bash
   npm install -g pm2
   pm2 start server.js --name "usabo-platform"
   ```

3. **Set up reverse proxy (nginx)**
   ```nginx
   server {
       listen 80;
       server_name your-domain.com;
       
       location / {
           proxy_pass http://localhost:3000;
           proxy_http_version 1.1;
           proxy_set_header Upgrade $http_upgrade;
           proxy_set_header Connection 'upgrade';
           proxy_set_header Host $host;
           proxy_cache_bypass $http_upgrade;
       }
   }
   ```

## API Documentation

### Authentication Endpoints
- `POST /api/auth/register` - Register new student account
- `POST /api/auth/login` - Student login
- `GET /api/auth/me` - Get current user info

### Textbook Endpoints
- `GET /api/textbook/chapters` - Get all chapters
- `GET /api/textbook/chapters/:id` - Get specific chapter
- `GET /api/textbook/search?query=term` - Search content

### Experiment Endpoints
- `GET /api/experiments` - Get all experiments
- `GET /api/experiments/:id` - Get experiment details
- `POST /api/experiments/:id/start` - Start experiment session
- `POST /api/experiments/:id/step/:stepId` - Submit experiment step

### Problem Set Endpoints
- `GET /api/problems` - Get all problem sets
- `POST /api/problems/:id/start` - Start problem session
- `POST /api/problems/:id/submit` - Submit completed problem set

### AI Assistant Endpoints
- `POST /api/ai/chat` - Chat with AI tutor
- `POST /api/ai/generate-questions` - Generate practice questions
- `POST /api/ai/explain` - Get concept explanations

### Community Endpoints
- `GET /api/community/chat/messages` - Get chat messages
- `POST /api/community/chat/message` - Send chat message
- `GET /api/community/memory-cards` - Get memory cards
- `POST /api/community/memory-cards` - Create memory card

## File Structure

```
usabo-website/
├── server.js                 # Main server file
├── package.json              # Dependencies and scripts
├── .env                      # Environment variables
├── README.md                 # This file
├── MEMORY_CARD_SYSTEM.md     # Memory card system documentation
├── public/                   # Static files
│   ├── index.html           # Main HTML file
│   ├── css/
│   │   └── style.css        # Main stylesheet
│   ├── js/
│   │   └── app.js           # Frontend JavaScript
│   └── images/              # Image assets
├── routes/                   # API route handlers
│   ├── auth.js              # Authentication routes
│   ├── textbook.js          # Textbook content routes
│   ├── experiments.js       # Experiment simulation routes
│   ├── problems.js          # Problem set routes
│   ├── ai.js                # AI assistant routes
│   └── community.js         # Community features routes
├── models/                   # Data models (future database integration)
└── middleware/               # Custom middleware functions
```

## Contributing

### Content Guidelines
1. **Scientific Accuracy**: All content must be scientifically accurate
2. **USABO Relevance**: Focus on topics covered in USABO exams
3. **Educational Value**: Content should enhance student understanding
4. **Accessibility**: Make content accessible to various learning styles

### Code Contributions
1. Fork the repository
2. Create a feature branch (`git checkout -b feature/new-feature`)
3. Commit changes (`git commit -am 'Add new feature'`)
4. Push to branch (`git push origin feature/new-feature`)
5. Create Pull Request

### Bug Reports
Please include:
- Operating system and browser version
- Steps to reproduce the issue
- Expected vs actual behavior
- Screenshots if applicable

## Configuration

### Student Email Validation
The platform requires student email addresses for registration. Configure email validation patterns in `routes/auth.js`:

```javascript
// Accept .edu domains and emails containing 'student'
if (!email.includes('.edu') && !email.includes('student')) {
    return res.status(400).json({ 
        message: 'Please use a valid student email address' 
    });
}
```

### Content Moderation
Basic content moderation is implemented for chat messages. Customize inappropriate content detection in `routes/community.js`:

```javascript
function isInappropriateContent(message) {
    const inappropriateWords = ['spam', 'inappropriate']; // Add more as needed
    const lowerMessage = message.toLowerCase();
    return inappropriateWords.some(word => lowerMessage.includes(word));
}
```

### Memory Card Categories
Customize available categories in the memory card system:

```javascript
categories: [
    'molecular_biology', 
    'cell_biology', 
    'plant_biology', 
    'animal_physiology', 
    'ecology', 
    'genetics'
]
```

## Future Roadmap

### Phase 1 (Current)
- ✅ Basic platform structure
- ✅ User authentication
- ✅ Static content placeholders
- ✅ Community chat functionality
- ✅ AI integration framework

### Phase 2 (Next Sprint)
- 🔄 Database integration (PostgreSQL)
- 🔄 Enhanced experiment simulations
- 🔄 Advanced memory card features
- 🔄 Mobile responsiveness improvements

### Phase 3 (Future)
- 📋 Advanced analytics and progress tracking
- 📋 Collaborative study groups
- 📋 Integration with external biology databases
- 📋 Mobile application development
- 📋 Advanced AI tutoring features

## Support

For questions, issues, or contributions:
- Create an issue on GitHub
- Contact the development team
- Check the documentation for common solutions

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgments

- OpenAI for AI assistance capabilities
- Biology education community for content guidance
- Socket.IO for real-time communication features
- Express.js community for web framework support