const express = require('express');
const router = express.Router();

// Sample textbook data structure (replace with database in production)
const textbookChapters = [
    {
        id: 1,
        title: "Molecular Biology",
        icon: "🧬",
        description: "DNA, RNA, protein synthesis, and molecular mechanisms",
        sections: [
            {
                id: 1,
                title: "DNA Structure and Replication",
                content: "Placeholder content for DNA structure and replication...",
                diagrams: [
                    {
                        title: "DNA Double Helix",
                        type: "molecular_diagram",
                        placeholder: true
                    }
                ]
            },
            {
                id: 2,
                title: "RNA and Transcription",
                content: "Placeholder content for RNA and transcription...",
                diagrams: [
                    {
                        title: "Transcription Process",
                        type: "molecular_diagram",
                        placeholder: true
                    }
                ]
            },
            {
                id: 3,
                title: "Protein Synthesis",
                content: "Placeholder content for protein synthesis...",
                diagrams: [
                    {
                        title: "Translation Mechanism",
                        type: "molecular_diagram",
                        placeholder: true
                    }
                ]
            }
        ]
    },
    {
        id: 2,
        title: "Cell Biology",
        icon: "🔬",
        description: "Cell structure, organelles, and cellular processes",
        sections: [
            {
                id: 1,
                title: "Cell Structure",
                content: "Placeholder content for cell structure...",
                diagrams: [
                    {
                        title: "Cell Organelles",
                        type: "anatomical_diagram",
                        placeholder: true
                    }
                ]
            },
            {
                id: 2,
                title: "Membrane Transport",
                content: "Placeholder content for membrane transport...",
                diagrams: [
                    {
                        title: "Transport Mechanisms",
                        type: "process_diagram",
                        placeholder: true
                    }
                ]
            }
        ]
    },
    {
        id: 3,
        title: "Plant Biology",
        icon: "🌿",
        description: "Plant anatomy, physiology, and development",
        sections: [
            {
                id: 1,
                title: "Plant Structure",
                content: "Placeholder content for plant structure...",
                diagrams: [
                    {
                        title: "Plant Anatomy",
                        type: "anatomical_diagram",
                        placeholder: true
                    }
                ]
            },
            {
                id: 2,
                title: "Photosynthesis",
                content: "Placeholder content for photosynthesis...",
                diagrams: [
                    {
                        title: "Photosynthesis Pathway",
                        type: "biochemical_pathway",
                        placeholder: true
                    }
                ]
            }
        ]
    },
    {
        id: 4,
        title: "Microbiology",
        icon: "🦠",
        description: "Bacteria, viruses, and microbial systems",
        sections: [
            {
                id: 1,
                title: "Bacterial Structure",
                content: "Placeholder content for bacterial structure...",
                diagrams: [
                    {
                        title: "Bacterial Cell",
                        type: "anatomical_diagram",
                        placeholder: true
                    }
                ]
            },
            {
                id: 2,
                title: "Viral Replication",
                content: "Placeholder content for viral replication...",
                diagrams: [
                    {
                        title: "Viral Life Cycle",
                        type: "process_diagram",
                        placeholder: true
                    }
                ]
            }
        ]
    },
    {
        id: 5,
        title: "Biochemistry",
        icon: "🧪",
        description: "Metabolic pathways and chemical processes",
        sections: [
            {
                id: 1,
                title: "Glycolysis",
                content: "Placeholder content for glycolysis...",
                diagrams: [
                    {
                        title: "Glycolytic Pathway",
                        type: "biochemical_pathway",
                        placeholder: true
                    }
                ]
            },
            {
                id: 2,
                title: "Citric Acid Cycle",
                content: "Placeholder content for citric acid cycle...",
                diagrams: [
                    {
                        title: "Krebs Cycle",
                        type: "biochemical_pathway",
                        placeholder: true
                    }
                ]
            }
        ]
    },
    {
        id: 6,
        title: "Animal Physiology",
        icon: "🧠",
        description: "Organ systems and physiological processes",
        sections: [
            {
                id: 1,
                title: "Nervous System",
                content: "Placeholder content for nervous system...",
                diagrams: [
                    {
                        title: "Neural Pathways",
                        type: "anatomical_diagram",
                        placeholder: true
                    }
                ]
            },
            {
                id: 2,
                title: "Cardiovascular System",
                content: "Placeholder content for cardiovascular system...",
                diagrams: [
                    {
                        title: "Heart Structure",
                        type: "anatomical_diagram",
                        placeholder: true
                    }
                ]
            }
        ]
    }
];

// Get all chapters
router.get('/chapters', (req, res) => {
    try {
        const chapters = textbookChapters.map(chapter => ({
            id: chapter.id,
            title: chapter.title,
            icon: chapter.icon,
            description: chapter.description,
            sectionCount: chapter.sections.length
        }));
        
        res.json({
            chapters: chapters,
            total: chapters.length
        });
    } catch (error) {
        console.error('Error fetching chapters:', error);
        res.status(500).json({ message: 'Failed to fetch chapters' });
    }
});

// Get specific chapter with sections
router.get('/chapters/:id', (req, res) => {
    try {
        const chapterId = parseInt(req.params.id);
        const chapter = textbookChapters.find(ch => ch.id === chapterId);
        
        if (!chapter) {
            return res.status(404).json({ message: 'Chapter not found' });
        }
        
        res.json(chapter);
    } catch (error) {
        console.error('Error fetching chapter:', error);
        res.status(500).json({ message: 'Failed to fetch chapter' });
    }
});

// Get specific section
router.get('/chapters/:chapterId/sections/:sectionId', (req, res) => {
    try {
        const chapterId = parseInt(req.params.chapterId);
        const sectionId = parseInt(req.params.sectionId);
        
        const chapter = textbookChapters.find(ch => ch.id === chapterId);
        if (!chapter) {
            return res.status(404).json({ message: 'Chapter not found' });
        }
        
        const section = chapter.sections.find(sec => sec.id === sectionId);
        if (!section) {
            return res.status(404).json({ message: 'Section not found' });
        }
        
        res.json({
            ...section,
            chapterTitle: chapter.title,
            chapterIcon: chapter.icon
        });
    } catch (error) {
        console.error('Error fetching section:', error);
        res.status(500).json({ message: 'Failed to fetch section' });
    }
});

// Search textbook content
router.get('/search', (req, res) => {
    try {
        const { query } = req.query;
        
        if (!query) {
            return res.status(400).json({ message: 'Search query is required' });
        }
        
        const results = [];
        
        textbookChapters.forEach(chapter => {
            // Search in chapter title and description
            if (chapter.title.toLowerCase().includes(query.toLowerCase()) ||
                chapter.description.toLowerCase().includes(query.toLowerCase())) {
                results.push({
                    type: 'chapter',
                    id: chapter.id,
                    title: chapter.title,
                    description: chapter.description,
                    icon: chapter.icon
                });
            }
            
            // Search in sections
            chapter.sections.forEach(section => {
                if (section.title.toLowerCase().includes(query.toLowerCase()) ||
                    section.content.toLowerCase().includes(query.toLowerCase())) {
                    results.push({
                        type: 'section',
                        chapterId: chapter.id,
                        chapterTitle: chapter.title,
                        sectionId: section.id,
                        title: section.title,
                        excerpt: section.content.substring(0, 200) + '...'
                    });
                }
            });
        });
        
        res.json({
            query: query,
            results: results,
            count: results.length
        });
    } catch (error) {
        console.error('Error searching textbook:', error);
        res.status(500).json({ message: 'Search failed' });
    }
});

// Get Campbell Biology PowerPoint files with embed info
router.get('/campbell-ppt', async (req, res) => {
    try {
        const AWS = require('aws-sdk');
        const s3 = new AWS.S3({ region: 'us-east-1' });
        let pptFiles = [];
        
        // Try to load from S3 first
        try {
            const htmlParams = {
                Bucket: 'usabo-ppt-files',
                Prefix: 'ppt-html/'
            };
            
            const htmlData = await s3.listObjectsV2(htmlParams).promise();
            pptFiles = htmlData.Contents
                .filter((obj) => obj.Key.endsWith('.html'))
                .map((obj, index) => {
                    const filename = obj.Key.replace('ppt-html/', '');
                    const name = filename.replace('.html', '');
                    const chapterMatch = name.match(/^(\d+)/);
                    const chapterNum = chapterMatch ? parseInt(chapterMatch[1]) : index + 1;
                    
                    // Clean up the title
                    let title = name.replace(/^\d+[-_\s]*/, '').replace(/_/g, ' ');
                    title = title.replace(/\.ppt$/, ''); // Remove any remaining .ppt extension
                    
                    const s3HtmlUrl = `https://usabo-ppt-files.s3.amazonaws.com/${obj.Key}`;
                    const s3PptUrl = `https://usabo-ppt-files.s3.amazonaws.com/ppt/${name}.ppt`;
                    
                    return {
                        id: index + 1,
                        filename: filename,
                        title: title,
                        chapter: chapterNum,
                        downloadUrl: s3PptUrl,
                        htmlUrl: s3HtmlUrl,
                        type: 'html'
                    };
                })
                .sort((a, b) => a.chapter - b.chapter);
                
        } catch (s3Error) {
            console.error('Error reading from S3:', s3Error);
            
            // Fallback to local files if available
            const fs = require('fs');
            const path = require('path');
            const pptDir = path.join(__dirname, '..', 'public', 'ppt');
            
            if (fs.existsSync(pptDir)) {
                const files = fs.readdirSync(pptDir);
                pptFiles = files
                    .filter(file => file.endsWith('.ppt'))
                    .map((file, index) => {
                        const name = file.replace('.ppt', '');
                        const chapterMatch = name.match(/^(\d+)/);
                        const chapterNum = chapterMatch ? parseInt(chapterMatch[1]) : index + 1;
                        
                        let title = name.replace(/^\d+[-_\s]*/, '').replace(/_/g, ' ');
                        
                        return {
                            id: index + 1,
                            filename: file,
                            title: title,
                            chapter: chapterNum,
                            downloadUrl: `/ppt/${file}`,
                            type: 'local'
                        };
                    })
                    .sort((a, b) => a.chapter - b.chapter);
            } else {
                // Ultimate fallback - basic chapter list
                pptFiles = Array.from({ length: 56 }, (_, i) => ({
                    id: i + 1,
                    chapter: i + 1,
                    title: `Chapter ${i + 1}`,
                    downloadUrl: `#`,
                    type: 'placeholder'
                }));
            }
        }
        
        res.json({
            files: pptFiles,
            total: pptFiles.length
        });
    } catch (error) {
        console.error('Error fetching Campbell PPT files:', error);
        res.status(500).json({ message: 'Failed to fetch Campbell PPT files' });
    }
});

// Get diagram information
router.get('/diagrams', (req, res) => {
    try {
        const diagrams = [];
        
        textbookChapters.forEach(chapter => {
            chapter.sections.forEach(section => {
                section.diagrams.forEach(diagram => {
                    diagrams.push({
                        ...diagram,
                        chapterId: chapter.id,
                        chapterTitle: chapter.title,
                        sectionId: section.id,
                        sectionTitle: section.title
                    });
                });
            });
        });
        
        res.json({
            diagrams: diagrams,
            types: ['molecular_diagram', 'anatomical_diagram', 'process_diagram', 'biochemical_pathway'],
            note: 'Diagrams are currently placeholders. Integration with ChemDraw or similar tools will be implemented.'
        });
    } catch (error) {
        console.error('Error fetching diagrams:', error);
        res.status(500).json({ message: 'Failed to fetch diagrams' });
    }
});

// Get USABO-Slide PowerPoint files
router.get('/usabo-slide-ppt', (req, res) => {
    try {
        const fs = require('fs');
        const path = require('path');
        const slideDir = path.join(__dirname, '..', 'USABO-Slide');
        
        let pptFiles = [];
        
        if (fs.existsSync(slideDir)) {
            const files = fs.readdirSync(slideDir);
            pptFiles = files
                .filter(file => file.endsWith('.ppt') || file.endsWith('.pptx'))
                .map((file, index) => {
                    const name = file.replace(/\.(ppt|pptx)$/, '');
                    
                    return {
                        id: index + 1,
                        filename: file,
                        title: name,
                        slideNumber: index + 1,
                        downloadUrl: `/usabo-slide/${file}`,
                        type: 'local'
                    };
                });
            
            // Shuffle the array for random order
            for (let i = pptFiles.length - 1; i > 0; i--) {
                const j = Math.floor(Math.random() * (i + 1));
                [pptFiles[i], pptFiles[j]] = [pptFiles[j], pptFiles[i]];
            }
            
            // Reassign slide numbers after shuffle
            pptFiles.forEach((file, index) => {
                file.slideNumber = index + 1;
                file.id = index + 1;
            });
        }
        
        res.json({
            files: pptFiles,
            total: pptFiles.length
        });
    } catch (error) {
        console.error('Error fetching USABO-Slide PPT files:', error);
        res.status(500).json({ message: 'Failed to fetch USABO-Slide PPT files' });
    }
});

module.exports = router;