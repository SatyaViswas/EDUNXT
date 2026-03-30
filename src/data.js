export const mentorStudents = [
    { name: 'Arjun Sharma', stage: 'Class 10', score: 82, streak: 7, status: 'ok', avatar: 'A', color: '#4f8cff' },
    { name: 'Priya Mehta', stage: 'Class 10', score: 32, streak: 0, status: 'high', avatar: 'P', color: '#f472b6' },
    { name: 'Rahul Kumar', stage: 'Class 11', score: 67, streak: 0, status: 'med', avatar: 'R', color: '#f59e0b' },
    { name: 'Sneha Patel', stage: 'Class 11', score: 55, streak: 3, status: 'med', avatar: 'S', color: '#a78bfa' },
    { name: 'Dev Rao', stage: 'Class 12', score: 88, streak: 14, status: 'ok', avatar: 'D', color: '#6ee7b7' },
    { name: 'Kavya S.', stage: 'Class 12', score: 91, streak: 10, status: 'ok', avatar: 'K', color: '#2dd4bf' },
    { name: 'Mohan T.', stage: 'Class 9', score: 44, streak: 1, status: 'med', avatar: 'M', color: '#f59e0b' },
    { name: 'Nisha G.', stage: 'Class 9', score: 79, streak: 5, status: 'ok', avatar: 'N', color: '#4f8cff' },
];

export const riskHighStudents = [
    { name: 'Priya Mehta', stage: 'Class 10', score: 32, lastActive: 'Today', reason: 'Score < 40%', mentor: 'Mr. Ravi K.', avatar: 'P', color: '#f472b6' },
    { name: 'Harish B.', stage: 'Class 9', score: 28, lastActive: '3 days ago', reason: 'Score < 40%', mentor: 'Ms. Pritha D.', avatar: 'H', color: '#f87171' },
    { name: 'Lakshmi V.', stage: 'UG Year 1', score: 35, lastActive: 'Yesterday', reason: 'Score < 40%', mentor: 'Dr. Meera S.', avatar: 'L', color: '#a78bfa' },
];

export const riskInactiveStudents = [
    { name: 'Rahul Kumar', stage: 'Class 11', score: 67, lastActive: '4 days ago', reason: 'Inactive 4d', mentor: 'Mr. Ravi K.', avatar: 'R', color: '#f59e0b' },
    { name: 'Arun Das', stage: 'Class 10', score: 58, lastActive: '5 days ago', reason: 'Inactive 5d', mentor: 'Ms. Pritha D.', avatar: 'A', color: '#f472b6' },
    { name: 'Teja M.', stage: 'Class 12', score: 71, lastActive: '6 days ago', reason: 'Inactive 6d', mentor: 'Mr. Suresh N.', avatar: 'T', color: '#6ee7b7' },
];

export const mcqsData = [
    { q: 'What is the quadratic formula for ax² + bx + c = 0?', opts: ['x = −b ± √(b²−4ac) / 2a', 'x = b ± √(b²+4ac) / 2a', 'x = −b / 2a', 'x = 2c / b'], correct: 0, subject: 'Math' },
    { q: 'Which organelle is known as the "powerhouse of the cell"?', opts: ['Nucleus', 'Ribosome', 'Mitochondria', 'Golgi apparatus'], correct: 2, subject: 'Biology' },
    { q: 'Who wrote the Indian national anthem "Jana Gana Mana"?', opts: ['Bankim Chandra', 'Rabindranath Tagore', 'Sardar Patel', 'Subhash Bose'], correct: 1, subject: 'GK' },
];

export const careers = [
    { id: 'MPC', icon: '🔢', name: 'MPC', desc: 'Maths, Physics, Chemistry', bestMatch: true, info: 'Mathematics, Physics, Chemistry — ideal for Engineering (JEE), NDA, or B.Sc. Based on your DNA, you score 88% in Maths. This is your best fit!' },
    { id: 'BiPC', icon: '🧬', name: 'BiPC', desc: 'Biology, Physics, Chemistry', bestMatch: false, info: 'Biology, Physics, Chemistry — ideal for NEET/Medicine, Pharmacy, Biotech.' },
    { id: 'Civils', icon: '🏛️', name: 'Civil Services', desc: 'IAS, IPS, IFS', bestMatch: false, info: 'Civil Services (IAS/IPS/IFS) — requires strong GK, current affairs, and essay writing. Start reading newspapers daily.' },
    { id: 'Commerce', icon: '💼', name: 'Commerce', desc: 'CA, MBA, Finance', bestMatch: false, info: 'Finance, CA, MBA, Business — great for analytical minds who prefer commerce over science.' },
    { id: 'Arts', icon: '🎨', name: 'Arts & Humanities', desc: 'Literature, History, Law', bestMatch: false, info: 'Literature, History, Law, Journalism — best for creative and humanities-oriented students.' },
    { id: 'Tech', icon: '💻', name: 'Technology', desc: 'CS, AI, Data Science', bestMatch: false, info: 'Computer Science, AI, Data Science — one of the fastest growing fields. Strong logical reasoning needed.' }
];