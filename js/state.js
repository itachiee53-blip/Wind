/* ── STATE ── */
let playerName='',roomCode='',isHost=false;
let playersInRoom=1,maxPlayers=30;
let isGameActive=false;
let currentLevelId=1; // 1..4
let maxTurbines=3,turbinesPlaced=0;
let currentEnergyRate=0,peakEnergyRate=0;
let totalScore=0; // accumulated across levels
let buildMode='single',startTime,timeTaken=0,timerInterval;
let roomRef=null,playerRef=null;
const MIN_DISTANCE=11;

