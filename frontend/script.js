// ─── STATE ───
let currentRole = 'student';
let selectedRole = 'student';
let taraOpen = false;
let taraEmotion = 'idle';
let blinkTimer, talkTimer;

// ─── DATA ───
const mentorStudents = [
  { name:'Arjun Sharma', stage:'Class 10', score:82, streak:7, status:'ok', avatar:'A', color:'#4f8cff' },
  { name:'Priya Mehta', stage:'Class 10', score:32, streak:0, status:'high', avatar:'P', color:'#f472b6' },
  { name:'Rahul Kumar', stage:'Class 11', score:67, streak:0, status:'med', avatar:'R', color:'#f59e0b' },
  { name:'Sneha Patel', stage:'Class 11', score:55, streak:3, status:'med', avatar:'S', color:'#a78bfa' },
  { name:'Dev Rao', stage:'Class 12', score:88, streak:14, status:'ok', avatar:'D', color:'#6ee7b7' },
  { name:'Kavya S.', stage:'Class 12', score:91, streak:10, status:'ok', avatar:'K', color:'#2dd4bf' },
  { name:'Mohan T.', stage:'Class 9', score:44, streak:1, status:'med', avatar:'M', color:'#f59e0b' },
  { name:'Nisha G.', stage:'Class 9', score:79, streak:5, status:'ok', avatar:'N', color:'#4f8cff' },
];

const riskHighStudents = [
  { name:'Priya Mehta', stage:'Class 10', score:32, lastActive:'Today', reason:'Score < 40%', mentor:'Mr. Ravi K.', avatar:'P', color:'#f472b6' },
  { name:'Harish B.', stage:'Class 9', score:28, lastActive:'3 days ago', reason:'Score < 40%', mentor:'Ms. Pritha D.', avatar:'H', color:'#f87171' },
  { name:'Lakshmi V.', stage:'UG Year 1', score:35, lastActive:'Yesterday', reason:'Score < 40%', mentor:'Dr. Meera S.', avatar:'L', color:'#a78bfa' },
];
const riskInactiveStudents = [
  { name:'Rahul Kumar', stage:'Class 11', score:67, lastActive:'4 days ago', reason:'Inactive 4d', mentor:'Mr. Ravi K.', avatar:'R', color:'#f59e0b' },
  { name:'Arun Das', stage:'Class 10', score:58, lastActive:'5 days ago', reason:'Inactive 5d', mentor:'Ms. Pritha D.', avatar:'A', color:'#f472b6' },
  { name:'Teja M.', stage:'Class 12', score:71, lastActive:'6 days ago', reason:'Inactive 6d', mentor:'Mr. Suresh N.', avatar:'T', color:'#6ee7b7' },
];

const mcqs = [
  { q:'What is the quadratic formula for ax² + bx + c = 0?', opts:['x = −b ± √(b²−4ac) / 2a','x = b ± √(b²+4ac) / 2a','x = −b / 2a','x = 2c / b'], correct:0, subject:'Math' },
  { q:'Which organelle is known as the "powerhouse of the cell"?', opts:['Nucleus','Ribosome','Mitochondria','Golgi apparatus'], correct:2, subject:'Biology' },
  { q:'Who wrote the Indian national anthem "Jana Gana Mana"?', opts:['Bankim Chandra','Rabindranath Tagore','Sardar Patel','Subhash Bose'], correct:1, subject:'GK' },
];

let mcqState = mcqs.map(()=>({selected:null, submitted:false}));

// ─── INIT ───
function init() {
  renderMCQs();
  renderMentorStudents();
  renderProgressTable();
  renderRiskLists();
  renderBarChart();
  startBlink();
}

// ─── AUTH ───
function showScreen(name) {
  document.querySelectorAll('.screen').forEach(s=>s.classList.remove('active'));
  document.getElementById('screen-'+name).classList.add('active');
}

function selectRole(role, el) {
  selectedRole = role;
  document.querySelectorAll('.role-card').forEach(c=>c.classList.remove('active'));
  el.classList.add('active');
}

function doLogin() {
  const role = document.getElementById('login-role').value;
  loginAs(role);
}

function doRegister() {
  const name = document.getElementById('reg-name').value||'User';
  loginAs(selectedRole, name);
}

function loginAs(role, name) {
  currentRole = role;
  const names = { student:'Arjun', mentor:'Ravi', ngo:'Admin' };
  const uname = name || names[role] || 'User';
  document.getElementById('user-name').textContent = uname;
  document.getElementById('s-username').textContent = uname;
  const initials = uname[0].toUpperCase();
  document.getElementById('user-avatar').textContent = initials;
  const badge = document.getElementById('role-badge-top');
  badge.textContent = role.charAt(0).toUpperCase()+role.slice(1);
  badge.className = 'role-badge role-'+role;
  buildNav(role);
  showScreen('app');
  if (role==='student') showPanel('student-home');
  else if (role==='mentor') showPanel('mentor-home');
  else showPanel('ngo-home');
  setTaraEmotion('happy');
  setTimeout(()=>setTaraEmotion('idle'),3000);
}

function logout() {
  showScreen('login');
  document.getElementById('tara-chat').style.display='none';
  taraOpen=false;
}

// ─── NAV ───
const navs = {
  student: [
    { label:'Dashboard', panel:'student-home' },
    { label:'Learning DNA', panel:'student-dna' },
    { label:'Career', panel:'student-career' },
  ],
  mentor: [
    { label:'Dashboard', panel:'mentor-home' },
    { label:'Student Progress', panel:'mentor-progress' },
  ],
  ngo: [
    { label:'Overview', panel:'ngo-home' },
    { label:'At-Risk Students', panel:'ngo-risk' },
    { label:'Mentors', panel:'ngo-mentors' },
  ],
};

function buildNav(role) {
  const nav = document.getElementById('topbar-nav');
  nav.innerHTML = '';
  (navs[role]||[]).forEach(item=>{
    const btn = document.createElement('button');
    btn.className = 'nav-btn';
    btn.textContent = item.label;
    btn.onclick = ()=>showPanel(item.panel);
    nav.appendChild(btn);
  });
}

function showPanel(id) {
  document.querySelectorAll('.panel').forEach(p=>p.classList.remove('active'));
  document.getElementById('panel-'+id).classList.add('active');
  document.querySelectorAll('.nav-btn').forEach(b=>{
    b.classList.toggle('active', b.textContent === (navs[currentRole]||[]).find(n=>n.panel===id)?.label);
  });
}

// ─── MCQ ───
function renderMCQs() {
  const c = document.getElementById('mcq-container');
  c.innerHTML = mcqs.map((q,i)=>`
    <div class="mcq-card">
      <div class="mcq-header">
        <div class="mcq-num">${i+1}</div>
        <div class="mcq-q">${q.q}</div>
      </div>
      <div class="mcq-options">
        ${q.opts.map((o,j)=>`<div class="mcq-opt" id="opt-${i}-${j}" onclick="selectOpt(${i},${j})">${o}</div>`).join('')}
      </div>
      <div class="mcq-submit">
        <button class="btn btn-primary" style="padding:8px 18px;font-size:13px;" onclick="submitMCQ(${i})">Submit Answer</button>
        <span id="mcq-result-${i}" style="margin-left:12px;font-size:13px;"></span>
      </div>
    </div>
  `).join('');
}

function selectOpt(qi, oi) {
  if (mcqState[qi].submitted) return;
  mcqState[qi].selected = oi;
  for(let j=0;j<4;j++){
    const el = document.getElementById(`opt-${qi}-${j}`);
    if(el) el.classList.toggle('selected', j===oi);
  }
}

function submitMCQ(qi) {
  if (mcqState[qi].submitted || mcqState[qi].selected===null) return;
  mcqState[qi].submitted = true;
  const correct = mcqs[qi].correct;
  const sel = mcqState[qi].selected;
  for(let j=0;j<4;j++){
    const el = document.getElementById(`opt-${qi}-${j}`);
    if(!el) continue;
    el.classList.remove('selected');
    if(j===correct) el.classList.add('correct');
    else if(j===sel) el.classList.add('wrong');
  }
  const res = document.getElementById(`mcq-result-${qi}`);
  if(sel===correct){
    res.textContent='✅ Correct! +10 pts';
    res.style.color='var(--accent2)';
    setTaraEmotion('happy');
    speak('Great job! That answer is correct!');
    showToast('Correct! +10 points added 🎉');
  } else {
    res.textContent='❌ Incorrect';
    res.style.color='var(--danger)';
    setTaraEmotion('sad');
    speak('Not quite right. The correct answer is highlighted. Keep trying!');
    setTimeout(()=>setTaraEmotion('idle'),4000);
  }
}

// ─── MENTOR ───
function renderMentorStudents() {
  const c = document.getElementById('mentor-student-list');
  if(!c) return;
  c.innerHTML = mentorStudents.slice(0,5).map(s=>`
    <div class="student-item">
      <div class="student-av" style="background:${s.color}22;color:${s.color};">${s.avatar}</div>
      <div class="student-info">
        <div class="student-name">${s.name}</div>
        <div class="student-meta">${s.stage} · Score: ${s.score}% · 🔥${s.streak}d</div>
      </div>
      <span class="risk-tag risk-${s.status}">${s.status==='high'?'At Risk':s.status==='med'?'Watch':'Good'}</span>
    </div>
  `).join('');
}

function renderProgressTable() {
  const b = document.getElementById('progress-table-body');
  if(!b) return;
  b.innerHTML = mentorStudents.map(s=>`
    <tr>
      <td><div style="display:flex;align-items:center;gap:8px;">
        <div class="student-av" style="width:28px;height:28px;background:${s.color}22;color:${s.color};font-size:11px;">${s.avatar}</div>${s.name}
      </div></td>
      <td>${s.stage}</td>
      <td><span style="color:${s.score>=70?'var(--accent2)':s.score>=40?'var(--accent3)':'var(--danger)'}">${s.score}%</span></td>
      <td>${Math.max(20,s.score-5)}%</td>
      <td>${Math.min(99,s.score+8)}%</td>
      <td>🔥 ${s.streak}d</td>
      <td><span class="risk-tag risk-${s.status}">${s.status==='high'?'At Risk':s.status==='med'?'Watch':'Good'}</span></td>
    </tr>
  `).join('');
}

function suggestTask() {
  const v = document.getElementById('suggest-task-input').value;
  if(!v) return;
  const conf = document.getElementById('suggest-confirm');
  conf.style.display='block';
  document.getElementById('suggest-task-input').value='';
  showToast('Task suggestion sent! ✅');
  setTimeout(()=>conf.style.display='none',3000);
}

// ─── NGO ───
function renderRiskLists() {
  const hl = document.getElementById('risk-high-list');
  if(hl) hl.innerHTML = riskHighStudents.map(s=>`
    <div class="student-item">
      <div class="student-av" style="background:${s.color}22;color:${s.color};">${s.avatar}</div>
      <div class="student-info"><div class="student-name">${s.name}</div><div class="student-meta">${s.stage} · Score: <span style="color:var(--danger)">${s.score}%</span></div></div>
      <span class="risk-tag risk-high">High Risk</span>
    </div>
  `).join('');

  const il = document.getElementById('risk-inactive-list');
  if(il) il.innerHTML = riskInactiveStudents.map(s=>`
    <div class="student-item">
      <div class="student-av" style="background:${s.color}22;color:${s.color};">${s.avatar}</div>
      <div class="student-info"><div class="student-name">${s.name}</div><div class="student-meta">${s.stage} · Last: ${s.lastActive}</div></div>
      <span class="risk-tag risk-med">Inactive</span>
    </div>
  `).join('');

  const rb = document.getElementById('risk-table-body');
  if(rb) rb.innerHTML = [...riskHighStudents,...riskInactiveStudents].map(s=>`
    <tr>
      <td>${s.name}</td><td>${s.stage}</td>
      <td><span style="color:${s.score<40?'var(--danger)':'var(--accent3)'}">${s.score}%</span></td>
      <td>${s.lastActive}</td>
      <td><span class="risk-tag ${s.score<40?'risk-high':'risk-med'}">${s.reason}</span></td>
      <td>${s.mentor}</td>
    </tr>
  `).join('');
}

function renderBarChart() {
  const c = document.getElementById('bar-chart');
  if(!c) return;
  const vals = [62,78,55,90,84,72,95,88];
  c.innerHTML = vals.map(v=>`<div class="chart-bar" style="height:${v}%;"></div>`).join('');
}

// ─── CAREER ───
const careerInfo = {
  MPC: 'Mathematics, Physics, Chemistry — ideal for Engineering (JEE), NDA, or B.Sc. Based on your DNA, you score 88% in Maths. This is your best fit!',
  BiPC: 'Biology, Physics, Chemistry — ideal for NEET/Medicine, Pharmacy, Biotech.',
  Civils: 'Civil Services (IAS/IPS/IFS) — requires strong GK, current affairs, and essay writing. Start reading newspapers daily.',
  Commerce: 'Finance, CA, MBA, Business — great for analytical minds who prefer commerce over science.',
  Arts: 'Literature, History, Law, Journalism — best for creative and humanities-oriented students.',
  Tech: 'Computer Science, AI, Data Science — one of the fastest growing fields. Strong logical reasoning needed.',
};

function showCareerDetail(career) {
  addTaraMsg(`🚀 **${career}**: ${careerInfo[career]}`);
  if(!taraOpen) toggleTara();
  setTaraEmotion('happy');
  speak('Great choice exploring this career path!');
}

// ─── TARA BOT ───
function toggleTara() {
  taraOpen = !taraOpen;
  const chat = document.getElementById('tara-chat');
  chat.style.display = taraOpen ? 'flex' : 'none';
  if(taraOpen) {
    setTaraEmotion('happy');
    setTimeout(()=>setTaraEmotion('idle'),2000);
  }
}

function addTaraMsg(text, isUser=false) {
  const c = document.getElementById('tara-msgs');
  const div = document.createElement('div');
  div.className = 'msg ' + (isUser?'user-msg':'bot');
  div.textContent = text;
  c.appendChild(div);
  c.scrollTop = c.scrollHeight;
}

const taraReplies = {
  hello: "Hi there! 😊 I'm TARA, your AI learning assistant. How can I help you today?",
  help: "I can help you with:\n• Your progress & scores\n• Weak topics to practice\n• Career path guidance\n• Study tips & motivation",
  score: "Your current average score is 82% 📊 You're doing great in Maths (88%) but Chemistry needs some work (55%).",
  weak: "Based on your Learning DNA, Chemistry — especially Organic Chemistry — is your weak area. I've scheduled extra MCQs for you!",
  career: "Based on your strengths in Maths and Physics, MPC is your best fit! Engineering (JEE) or Data Science would be great paths for you.",
  streak: "🔥 You're on a 7-day streak! Keep going — 3 more days to unlock the 'Consistent Learner' badge!",
  sad: "Don't worry! Every expert was once a beginner. Focus on understanding concepts, not just marks. You've got this! 💪",
  motivation: "You're capable of amazing things! Remember why you started. Small daily progress adds up to huge results. 🌟",
};

function sendTara() {
  const input = document.getElementById('tara-input');
  const text = input.value.trim();
  if(!text) return;
  addTaraMsg(text, true);
  input.value = '';
  setTaraEmotion('happy');

  setTimeout(()=>{
    const lower = text.toLowerCase();
    let reply = "I'm here to help! Try asking about your score, weak topics, career options, or your streak. 😊";
    for(const [key, val] of Object.entries(taraReplies)) {
      if(lower.includes(key)) { reply = val; break; }
    }
    addTaraMsg(reply);
    speak(reply.replace(/[🔥📊😊💪🌟•\n]/g,''));
    setTimeout(()=>setTaraEmotion('idle'),3000);
  }, 600);
}

// ─── TARA EMOTIONS ───
function setTaraEmotion(emotion) {
  taraEmotion = emotion;
  const mouth = document.getElementById('tara-mouth');
  const el = document.getElementById('eye-l');
  const er = document.getElementById('eye-r');
  if(!mouth||!el||!er) return;
  mouth.className = 'tara-mouth ' + emotion;
  clearTimeout(talkTimer);
  if(emotion==='talking') {
    mouth.classList.add('talking');
    talkTimer = setTimeout(()=>{
      mouth.className='tara-mouth idle';
      taraEmotion='idle';
    },2500);
  }
}

function startBlink() {
  function doBlink() {
    const el=document.getElementById('eye-l');
    const er=document.getElementById('eye-r');
    if(el&&er){
      el.classList.add('blink');
      er.classList.add('blink');
      setTimeout(()=>{
        el.classList.remove('blink');
        er.classList.remove('blink');
      },150);
    }
    blinkTimer = setTimeout(doBlink, 2500+Math.random()*2000);
  }
  blinkTimer = setTimeout(doBlink, 1500);
}

// ─── SPEECH ───
function speak(text) {
  if(!window.speechSynthesis) return;
  window.speechSynthesis.cancel();
  const utt = new SpeechSynthesisUtterance(text);
  utt.rate = 1.05;
  utt.pitch = 1.1;
  utt.volume = 0.8;
  setTaraEmotion('talking');
  utt.onend = ()=>setTaraEmotion('idle');
  window.speechSynthesis.speak(utt);
}

// ─── TOAST ───
function showToast(msg) {
  const t = document.getElementById('toast');
  document.getElementById('toast-msg').textContent = msg;
  t.style.display='flex';
  setTimeout(()=>t.style.display='none',2800);
}

// ─── START ───
init();
