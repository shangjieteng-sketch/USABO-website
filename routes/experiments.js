const express = require('express');
const router = express.Router();

// Sample experiment data structure
const experiments = [
    {
        id: 1,
        title: "PCR Amplification",
        category: "molecular",
        description: "Learn the principles and steps of Polymerase Chain Reaction",
        difficulty: "intermediate",
        duration: "45 minutes",
        objectives: [
            "Understand PCR principle",
            "Learn thermal cycling steps",
            "Identify PCR components",
            "Analyze PCR results"
        ],
        materials: [
            "DNA template",
            "Primers (forward and reverse)",
            "DNA polymerase (Taq)",
            "dNTPs",
            "Buffer solution",
            "Thermal cycler"
        ],
        procedure: [
            {
                step: 1,
                title: "Sample Preparation",
                description: "Prepare DNA template and reaction mixture",
                duration: "10 minutes",
                interactive: true
            },
            {
                step: 2,
                title: "Denaturation",
                description: "Heat to 94°C to separate DNA strands",
                duration: "2 minutes",
                interactive: true
            },
            {
                step: 3,
                title: "Annealing",
                description: "Cool to 55°C for primer binding",
                duration: "30 seconds",
                interactive: true
            },
            {
                step: 4,
                title: "Extension",
                description: "Heat to 72°C for DNA synthesis",
                duration: "1 minute",
                interactive: true
            },
            {
                step: 5,
                title: "Cycle Repetition",
                description: "Repeat steps 2-4 for 30-35 cycles",
                duration: "30 minutes",
                interactive: false
            }
        ],
        quiz: [
            {
                question: "What is the purpose of the denaturation step in PCR?",
                options: [
                    "To cool the reaction",
                    "To separate DNA strands",
                    "To bind primers",
                    "To synthesize DNA"
                ],
                correct: 1,
                explanation: "Denaturation at high temperature breaks hydrogen bonds and separates the double-stranded DNA into single strands."
            }
        ]
    },
    {
        id: 2,
        title: "Gel Electrophoresis",
        category: "molecular",
        description: "Understand DNA separation and analysis techniques",
        difficulty: "beginner",
        duration: "60 minutes",
        objectives: [
            "Understand electrophoresis principle",
            "Learn gel preparation",
            "Analyze DNA migration patterns",
            "Interpret results"
        ],
        materials: [
            "Agarose powder",
            "TAE buffer",
            "DNA samples",
            "Loading dye",
            "DNA ladder/marker",
            "Electrophoresis apparatus"
        ],
        procedure: [
            {
                step: 1,
                title: "Gel Preparation",
                description: "Prepare agarose gel with appropriate concentration",
                duration: "15 minutes",
                interactive: true
            },
            {
                step: 2,
                title: "Sample Loading",
                description: "Load DNA samples and ladder into wells",
                duration: "10 minutes",
                interactive: true
            },
            {
                step: 3,
                title: "Electrophoresis",
                description: "Run gel at appropriate voltage",
                duration: "30 minutes",
                interactive: false
            },
            {
                step: 4,
                title: "Visualization",
                description: "Visualize DNA bands under UV light",
                duration: "5 minutes",
                interactive: true
            }
        ],
        quiz: [
            {
                question: "In gel electrophoresis, DNA migrates toward which electrode?",
                options: [
                    "Negative electrode",
                    "Positive electrode",
                    "Both electrodes",
                    "Neither electrode"
                ],
                correct: 1,
                explanation: "DNA is negatively charged due to its phosphate groups, so it migrates toward the positive electrode."
            }
        ]
    },
    {
        id: 3,
        title: "Enzyme Kinetics",
        category: "biochemical",
        description: "Explore enzyme activity and inhibition patterns",
        difficulty: "advanced",
        duration: "90 minutes",
        objectives: [
            "Understand Michaelis-Menten kinetics",
            "Measure enzyme activity",
            "Study competitive inhibition",
            "Calculate kinetic parameters"
        ],
        materials: [
            "Enzyme solution",
            "Substrate solutions",
            "Inhibitor solutions",
            "Spectrophotometer",
            "Cuvettes",
            "Stop solutions"
        ],
        procedure: [
            {
                step: 1,
                title: "Baseline Measurement",
                description: "Establish baseline absorbance",
                duration: "10 minutes",
                interactive: true
            },
            {
                step: 2,
                title: "Substrate Titration",
                description: "Test different substrate concentrations",
                duration: "40 minutes",
                interactive: true
            },
            {
                step: 3,
                title: "Inhibition Studies",
                description: "Test effect of competitive inhibitor",
                duration: "30 minutes",
                interactive: true
            },
            {
                step: 4,
                title: "Data Analysis",
                description: "Plot Lineweaver-Burk plot and calculate Km",
                duration: "10 minutes",
                interactive: true
            }
        ],
        quiz: [
            {
                question: "What does Km represent in enzyme kinetics?",
                options: [
                    "Maximum velocity",
                    "Enzyme concentration",
                    "Substrate concentration at half Vmax",
                    "Inhibitor concentration"
                ],
                correct: 2,
                explanation: "Km is the substrate concentration at which the reaction velocity is half of the maximum velocity (Vmax)."
            }
        ]
    },
    {
        id: 4,
        title: "Light Microscopy",
        category: "microscopy",
        description: "Master basic microscopy techniques",
        difficulty: "beginner",
        duration: "45 minutes",
        objectives: [
            "Learn microscope operation",
            "Practice focusing techniques",
            "Understand magnification",
            "Prepare wet mounts"
        ],
        materials: [
            "Light microscope",
            "Slides and coverslips",
            "Various specimens",
            "Immersion oil",
            "Lens paper"
        ],
        procedure: [
            {
                step: 1,
                title: "Microscope Setup",
                description: "Properly set up and align microscope",
                duration: "10 minutes",
                interactive: true
            },
            {
                step: 2,
                title: "Low Power Observation",
                description: "Observe specimens at 10x magnification",
                duration: "15 minutes",
                interactive: true
            },
            {
                step: 3,
                title: "High Power Observation",
                description: "Switch to higher magnifications",
                duration: "15 minutes",
                interactive: true
            },
            {
                step: 4,
                title: "Oil Immersion",
                description: "Use 100x oil immersion objective",
                duration: "5 minutes",
                interactive: true
            }
        ],
        quiz: [
            {
                question: "What is the total magnification when using 40x objective with 10x eyepiece?",
                options: [
                    "40x",
                    "50x",
                    "400x",
                    "4000x"
                ],
                correct: 2,
                explanation: "Total magnification = objective magnification × eyepiece magnification = 40x × 10x = 400x"
            }
        ]
    },
    {
        id: 5,
        title: "DNA Extraction",
        category: "molecular",
        description: "Extract DNA from plant or animal tissues",
        difficulty: "intermediate",
        duration: "75 minutes",
        objectives: [
            "Understand cell lysis principles",
            "Learn DNA precipitation",
            "Practice sterile technique",
            "Assess DNA quality"
        ],
        materials: [
            "Plant/animal tissue",
            "Lysis buffer",
            "Protease",
            "Ethanol",
            "Centrifuge",
            "Micropipettes"
        ],
        procedure: [
            {
                step: 1,
                title: "Tissue Preparation",
                description: "Grind tissue and add lysis buffer",
                duration: "15 minutes",
                interactive: true
            },
            {
                step: 2,
                title: "Cell Lysis",
                description: "Incubate with protease to break down proteins",
                duration: "30 minutes",
                interactive: false
            },
            {
                step: 3,
                title: "DNA Precipitation",
                description: "Add ethanol to precipitate DNA",
                duration: "20 minutes",
                interactive: true
            },
            {
                step: 4,
                title: "DNA Recovery",
                description: "Centrifuge and wash DNA pellet",
                duration: "10 minutes",
                interactive: true
            }
        ],
        quiz: [
            {
                question: "Why is ethanol used in DNA extraction?",
                options: [
                    "To denature proteins",
                    "To precipitate DNA",
                    "To lyse cells",
                    "To stain DNA"
                ],
                correct: 1,
                explanation: "Ethanol causes DNA to precipitate out of solution, allowing it to be separated from other cellular components."
            }
        ]
    }
];

// Get all experiments
router.get('/', (req, res) => {
    try {
        const { category, difficulty } = req.query;
        
        let filteredExperiments = experiments;
        
        if (category) {
            filteredExperiments = filteredExperiments.filter(exp => exp.category === category);
        }
        
        if (difficulty) {
            filteredExperiments = filteredExperiments.filter(exp => exp.difficulty === difficulty);
        }
        
        const experimentsOverview = filteredExperiments.map(exp => ({
            id: exp.id,
            title: exp.title,
            category: exp.category,
            description: exp.description,
            difficulty: exp.difficulty,
            duration: exp.duration
        }));
        
        res.json({
            experiments: experimentsOverview,
            total: experimentsOverview.length,
            categories: ['molecular', 'microscopy', 'biochemical', 'genetics'],
            difficulties: ['beginner', 'intermediate', 'advanced']
        });
    } catch (error) {
        console.error('Error fetching experiments:', error);
        res.status(500).json({ message: 'Failed to fetch experiments' });
    }
});

// Get specific experiment details
router.get('/:id', (req, res) => {
    try {
        const experimentId = parseInt(req.params.id);
        const experiment = experiments.find(exp => exp.id === experimentId);
        
        if (!experiment) {
            return res.status(404).json({ message: 'Experiment not found' });
        }
        
        res.json(experiment);
    } catch (error) {
        console.error('Error fetching experiment:', error);
        res.status(500).json({ message: 'Failed to fetch experiment' });
    }
});

// Start experiment simulation
router.post('/:id/start', (req, res) => {
    try {
        const experimentId = parseInt(req.params.id);
        const experiment = experiments.find(exp => exp.id === experimentId);
        
        if (!experiment) {
            return res.status(404).json({ message: 'Experiment not found' });
        }
        
        // Create a session for this experiment (in production, use proper session management)
        const sessionId = Date.now().toString();
        
        res.json({
            sessionId: sessionId,
            experiment: {
                id: experiment.id,
                title: experiment.title,
                currentStep: 1,
                totalSteps: experiment.procedure.length
            },
            message: 'Experiment simulation started'
        });
    } catch (error) {
        console.error('Error starting experiment:', error);
        res.status(500).json({ message: 'Failed to start experiment' });
    }
});

// Submit experiment step
router.post('/:id/step/:stepId', (req, res) => {
    try {
        const experimentId = parseInt(req.params.id);
        const stepId = parseInt(req.params.stepId);
        const { sessionId, userInput } = req.body;
        
        const experiment = experiments.find(exp => exp.id === experimentId);
        if (!experiment) {
            return res.status(404).json({ message: 'Experiment not found' });
        }
        
        const step = experiment.procedure.find(step => step.step === stepId);
        if (!step) {
            return res.status(404).json({ message: 'Step not found' });
        }
        
        // Simulate step completion and feedback
        const feedback = generateStepFeedback(experimentId, stepId, userInput);
        const isComplete = stepId >= experiment.procedure.length;
        const nextStep = isComplete ? null : stepId + 1;
        
        res.json({
            sessionId: sessionId,
            currentStep: stepId,
            feedback: feedback,
            isComplete: isComplete,
            nextStep: nextStep,
            progress: (stepId / experiment.procedure.length) * 100
        });
    } catch (error) {
        console.error('Error processing experiment step:', error);
        res.status(500).json({ message: 'Failed to process step' });
    }
});

// Submit experiment quiz
router.post('/:id/quiz', (req, res) => {
    try {
        const experimentId = parseInt(req.params.id);
        const { answers } = req.body;
        
        const experiment = experiments.find(exp => exp.id === experimentId);
        if (!experiment) {
            return res.status(404).json({ message: 'Experiment not found' });
        }
        
        const results = experiment.quiz.map((question, index) => {
            const userAnswer = answers[index];
            const isCorrect = userAnswer === question.correct;
            
            return {
                question: question.question,
                userAnswer: userAnswer,
                correctAnswer: question.correct,
                isCorrect: isCorrect,
                explanation: question.explanation
            };
        });
        
        const score = results.filter(r => r.isCorrect).length;
        const totalQuestions = results.length;
        const percentage = Math.round((score / totalQuestions) * 100);
        
        res.json({
            score: score,
            total: totalQuestions,
            percentage: percentage,
            results: results,
            passed: percentage >= 70
        });
    } catch (error) {
        console.error('Error processing quiz:', error);
        res.status(500).json({ message: 'Failed to process quiz' });
    }
});

// Helper function to generate step feedback
function generateStepFeedback(experimentId, stepId, userInput) {
    const feedbackTemplates = {
        1: { // PCR
            1: "Good! You've prepared the reaction mixture correctly. Notice how important it is to keep everything on ice.",
            2: "Excellent! The high temperature has successfully denatured the DNA strands.",
            3: "Perfect! The primers have now bound to their complementary sequences.",
            4: "Great! DNA polymerase has extended the primers to create new DNA strands."
        },
        2: { // Gel Electrophoresis
            1: "Well done! Your gel concentration is appropriate for the DNA fragments you're analyzing.",
            2: "Good technique! Loading the samples carefully prevents spillover between wells.",
            3: "The electrophoresis is running well. Notice how smaller fragments migrate faster.",
            4: "Excellent! You can clearly see the DNA bands under UV illumination."
        }
    };
    
    const feedback = feedbackTemplates[experimentId]?.[stepId] || 
                    "Good work! You've completed this step successfully.";
    
    return feedback;
}

module.exports = router;