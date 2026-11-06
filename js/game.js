/* ── NAVIGATION ── */
function showScreen(name){
    ['login','lobby','pregame','level-intro','level-clear','postgame','leaderboard'].forEach(s=>{
        const el=document.getElementById(s+'-screen');
        if(el) el.style.display=(s===name?'flex':'none');
    });
}

function goToLobby(){
    const n=document.getElementById('player-name').value.trim();
    if(!n){alert('กรุณาใส่ชื่อของคุณ!');return;}
    if(/[.#$\[\]\/]/.test(n)){alert('ชื่อห้ามมีอักขระ . # $ [ ] /');return;}
    playerName=n;
    document.getElementById('in-game-name').innerText=playerName;
    showScreen('lobby');
}

/* ── ROOM LOGIC ── */
async function createRoom(){
    isHost=true;
    let m=parseInt(document.getElementById('host-max-players').value);
    if(isNaN(m)||m<2||m>30) m=30;
    maxPlayers=m;
    try{roomCode=await Net.createRoom(maxPlayers);}
    catch(e){alert('สร้างห้องไม่สำเร็จ ลองใหม่อีกครั้ง');return;}
    joinRoomLogic();
}
async function joinRoom(){
    const c=document.getElementById('join-code').value;
    if(c.length!==4){alert('กรุณากรอกรหัส 4 หลัก!');return;}
    isHost=false; roomCode=c;
    const room=await Net.getRoom(roomCode);
    if(!room){alert('ไม่พบรหัสห้องนี้!');return;}
    maxPlayers=room.maxPlayers||30;
    joinRoomLogic();
}
async function joinRoomLogic(){
    if(!await Net.joinRoom(playerName)){alert('ชื่อนี้มีคนใช้ในห้องแล้ว กรุณาเปลี่ยนชื่อ');showScreen('login');return;}
    setupPregame();
}
function setupPregame(){
    showScreen('pregame');
    document.getElementById('display-room-code').innerText=roomCode;
    document.getElementById('display-max-players').innerText=maxPlayers;
    document.getElementById('display-max-players-post').innerText=maxPlayers;
    if(isHost){
        document.getElementById('role-status').innerText='👑 คุณคือหัวห้อง';
        document.getElementById('start-game-btn').style.display='block';
    } else {
        document.getElementById('role-status').innerText='👤 ผู้เข้าร่วม';
        document.getElementById('waiting-host').style.display='block';
    }
    Net.onPlayers(d=>{
        playersInRoom=Object.keys(d).length;
        document.getElementById('players-joined').innerText=playersInRoom;
        document.getElementById('progress-bar').style.width=(playersInRoom/maxPlayers*100)+'%';
        if(isHost&&playersInRoom>=1){
            const b=document.getElementById('start-game-btn');
            b.disabled=false; b.innerText='เริ่มเกม!';
        }
    });
    Net.onStatus(st=>{if(st==='playing'){Net.unsubscribeAll();showLevelIntro(1);}});
}
function startGame(){Net.startGame();}

/* ── LEVEL INTRO ── */
function showLevelIntro(lvId){
    currentLevelId=lvId;
    const lv=LEVELS[lvId];
    const el=document.getElementById('intro-content');
    el.innerHTML=`
        <div class="intro-head">
            <div class="intro-icon">${lv.icon}</div>
            <div>
                <span class="badge-pill ${lv.badge}">ด่าน ${lv.id}/4 · ${lv.name}</span>
                <h2 class="intro-title">${lv.tagline}</h2>
            </div>
        </div>
        <div class="k-list">
            ${lv.knowledge.map(k=>`
            <div class="k-item">
                <span class="k-item-icon">${k.icon}</span>
                <div class="k-item-text"><strong>${k.title}</strong>${k.desc}</div>
            </div>`).join('')}
        </div>
        <div class="quota-row">
            <div class="quota-item"><div class="q-num">${lv.turbines}</div><div class="q-label">กังหันลม</div></div>
            <div class="quota-item"><div class="q-num">${lv.minDist}m</div><div class="q-label">ระยะห่างขั้นต่ำ</div></div>
            <div class="quota-item"><div class="q-num">${lv.passScore}</div><div class="q-label">คะแนนผ่าน</div></div>
        </div>
        <div class="obj-box">
            <div class="obj-label">🎯 ภารกิจ</div>
            <div class="obj-text">${lv.objective}</div>
        </div>
        ${totalScore>0?`<p class="carry">คะแนนสะสมตอนนี้ <b>${totalScore}</b> หน่วย</p>`:''}
        <button class="btn btn-primary" onclick="handleClick(startGameLocal)">เริ่มด่าน ${lv.id} →</button>
    `;
    showScreen('level-intro');
}

/* ── GAME START ── */
function startGameLocal(){
    const lv=LEVELS[currentLevelId];
    maxTurbines=lv.turbines;
    turbinesPlaced=0; currentEnergyRate=0; peakEnergyRate=0; buildMode='single';
    document.getElementById('turbines-left').innerText=maxTurbines;
    document.getElementById('turbines-max').innerText=maxTurbines;
    document.getElementById('toggle-mode-btn').innerText='วางทีละต้น';
    document.getElementById('toggle-mode-btn').classList.remove('active');
    document.getElementById('strip-level').innerText=currentLevelId;
    document.getElementById('strip-total').innerText=totalScore;
    document.getElementById('submit-wrap').style.display='none';
    document.getElementById('energy-target').innerText=lv.passScore;
    document.getElementById('energy-rate').innerText=0;
    updateScoreUI(0);

    clearMap(); buildMap(currentLevelId);
    showScreen(null);
    document.getElementById('game-ui').style.display='block';
    document.getElementById('canvas-container').style.pointerEvents='auto';
    isGameActive=true;
    startTime=Date.now();
    timerInterval=setInterval(()=>{
        document.getElementById('timer-display').innerText=((Date.now()-startTime)/1000).toFixed(2);
    },50);
}

function toggleBuildMode(){
    const btn=document.getElementById('toggle-mode-btn');
    if(buildMode==='single'){buildMode='cluster';btn.innerText='⚡ วาง 3 ต้น';btn.classList.add('active');}
    else{buildMode='single';btn.innerText='วางทีละต้น';btn.classList.remove('active');}
}

function showWarning(txt){
    sfx.warn();
    const w=document.getElementById('warn-toast');
    w.innerText=txt; w.style.display='block';
    clearTimeout(w._t);
    w._t=setTimeout(()=>w.style.display='none',2200);
}

function updateScoreUI(v){
    const el=document.getElementById('energy-rate');
    el.innerText=v; el.classList.add('pop');
    const goal=LEVELS[currentLevelId].passScore,bar=document.getElementById('energy-bar');
    bar.style.width=Math.min(v/goal*100,100)+'%'; bar.classList.toggle('done',v>=goal);
    if(v>peakEnergyRate&&v>0){peakEnergyRate=v;sfx.fanfare();}
    setTimeout(()=>el.classList.remove('pop'),150);
}

function showKpop(place,desc,power){
    document.getElementById('kp-place').innerText='📍 '+place;
    document.getElementById('kp-desc').innerText=desc;
    document.getElementById('kp-power').innerText='⚡ +'+power+' หน่วย/วิ';
    const el=document.getElementById('kpop');
    el.classList.add('show');
    clearTimeout(el._t);
    el._t=setTimeout(()=>el.classList.remove('show'),4000);
}

/* ── SUBMIT SCORE FOR LEVEL ── */
function submitScore(){
    clearInterval(timerInterval);
    timeTaken=(Date.now()-startTime)/1000;
    isGameActive=false;
    document.getElementById('game-ui').style.display='none';
    document.getElementById('canvas-container').style.pointerEvents='none';

    const lv=LEVELS[currentLevelId];
    const passed=currentEnergyRate>=lv.passScore;
    totalScore+=currentEnergyRate;

    Net.saveLevel(currentLevelId,currentEnergyRate,timeTaken,totalScore);

    showLevelClear(passed);
}

function showLevelClear(passed){
    const lv=LEVELS[currentLevelId];
    const isLast=(currentLevelId===4);
    const el=document.getElementById('clear-content');
    let starsHtml='';
    const pct=currentEnergyRate/lv.passScore;
    if(pct>=1.5) starsHtml='⭐⭐⭐';
    else if(pct>=1.0) starsHtml='⭐⭐';
    else starsHtml='⭐';

    el.innerHTML=`
        <div class="clear-emoji">${passed?'🎉':'💪'}</div>
        <h2>${passed?'ผ่านด่าน '+currentLevelId+'!':'ยังอีกนิดเดียว!'}</h2>
        <div class="clear-stars">${starsHtml}</div>
        <p class="clear-sub">${lv.icon} ${lv.name}</p>
        <div class="score-rows">
            <div class="score-row"><span class="sr-label">พลังงานด่านนี้</span><span class="sr-val ${passed?'pass':'fail'}">${currentEnergyRate}</span></div>
            <div class="score-row"><span class="sr-label">คะแนนผ่าน</span><span class="sr-val">${lv.passScore}</span></div>
            <div class="score-row"><span class="sr-label">เวลา</span><span class="sr-val">${timeTaken.toFixed(2)}s</span></div>
        </div>
        <div class="score-total-box">
            <div class="st-label">คะแนนสะสมรวม</div>
            <div class="st-val">${totalScore}</div>
            <div class="st-unit">หน่วยพลังงาน</div>
        </div>
        <div class="btn-stack">
        ${isLast
            ?`<button class="btn btn-primary" onclick="handleClick(goToPostgame)">ดูผลการแข่งขัน</button>`
            :`<button class="btn btn-primary" onclick="handleClick(()=>goToNextLevel(${currentLevelId+1}))">ด่านถัดไป: ${LEVELS[currentLevelId+1].icon} ${LEVELS[currentLevelId+1].name} →</button>
              <button class="btn btn-ghost" onclick="handleClick(()=>retryLevel(${currentLevelId}))">เล่นด่านนี้ใหม่</button>`}
        </div>
    `;
    sfx.levelClear();
    showScreen('level-clear');
}

function retryLevel(lvId){
    // subtract previous score from this level
    totalScore-=currentEnergyRate;
    currentEnergyRate=0;
    startGameLocal();
}

function goToNextLevel(lvId){
    showLevelIntro(lvId);
}

function goToPostgame(){
    showScreen('postgame');
    Net.finish();

    Net.onPlayers(p=>{
        let fin=0,total=Object.keys(p).length,lb=[];
        for(let k in p){
            if(p[k].status==='finished') fin++;
            lb.push({
                name:k===playerName?k+' (คุณ)':k,
                score:p[k].totalScore||0,
                time:(p[k].level1Time||0)+(p[k].level2Time||0)+(p[k].level3Time||0)+(p[k].level4Time||0),
                isMe:k===playerName
            });
        }
        document.getElementById('players-finished').innerText=fin;
        document.getElementById('display-max-players-post').innerText=total;
        if(fin===total&&total>0) showLeaderboard(lb);
    });
}

function showLeaderboard(data){
    showScreen('leaderboard');
    data.sort((a,b)=>b.score!==a.score?b.score-a.score:a.time-b.time);
    const list=document.getElementById('leaderboard-list'); list.innerHTML='';
    data.forEach((p,i)=>{
        const medals=['🥇','🥈','🥉'];
        const medal=i<3?medals[i]:`${i+1}.`;
        const rnk=i===0?'r1':i===1?'r2':i===2?'r3':'';
        const me=p.isMe?'rme':'';
        list.innerHTML+=`<div class="rank-row ${rnk} ${me}">
            <span class="rank-medal">${medal}</span>
            <span class="rank-name">${p.name.replace(/[&<>"]/g,c=>`&#${c.charCodeAt(0)};`)}</span>
            <div class="rank-score">
                <div class="rs-val">${p.score} <small>หน่วย</small></div>
                <div class="rs-time">${(p.time||0).toFixed(2)}s</div>
            </div>
        </div>`;
    });
}

