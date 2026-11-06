/* ── NETWORK (Firebase Realtime Database) ──
 * Every database read/write goes through this file. UI code calls Net.* only.
 *
 * Data layout:
 * rooms/{roomCode}                 roomCode = 4-digit string
 *   status       'waiting' | 'playing'
 *   maxPlayers   number (2..30)
 *   currentLevel number (1..4)
 *   createdAt    server timestamp
 *   players/{playerName}
 *     status        'joined' | 'finished'
 *     totalScore    number (sum of all levels)
 *     level{N}Score number (N = 1..4)
 *     level{N}Time  number, seconds
 */
const Net=(()=>{
    let room=null,player=null;
    const subs=[];                       // active listeners, for cleanup

    const roomPath=code=>'rooms/'+code;
    function listen(ref,cb){ref.on('value',cb);subs.push([ref,cb]);}

    // Create a room with a code not already in use. Resolves to the code.
    async function createRoom(maxPlayers){
        for(let i=0;i<10;i++){
            const code=Math.floor(1000+Math.random()*9000).toString();
            const ref=db.ref(roomPath(code));
            const res=await ref.transaction(cur=>cur===null?{
                status:'waiting',maxPlayers,currentLevel:1,
                createdAt:firebase.database.ServerValue.TIMESTAMP
            }:undefined);
            if(res.committed){room=ref;return code;}
        }
        throw new Error('room-code-exhausted');
    }

    // Resolves to the room data, or null if it does not exist.
    async function getRoom(code){
        const snap=await db.ref(roomPath(code)).once('value');
        if(!snap.exists()) return null;
        room=db.ref(roomPath(code));
        return snap.val();
    }

    // Adds the player to the current room. Resolves false if the name is taken.
    async function joinRoom(name){
        const ref=room.child('players/'+name);
        const res=await ref.transaction(cur=>cur===null?{status:'joined',totalScore:0}:undefined);
        if(!res.committed) return false;
        player=ref;
        player.onDisconnect().remove();
        return true;
    }

    function onPlayers(cb){listen(room.child('players'),snap=>cb(snap.val()||{}));}
    function onStatus(cb){listen(room.child('status'),snap=>cb(snap.val()));}
    function startGame(){return room.update({status:'playing',currentLevel:1});}

    function saveLevel(levelId,score,time,totalScore){
        return player.update({[`level${levelId}Score`]:score,[`level${levelId}Time`]:time,totalScore});
    }
    function finish(){return player.update({status:'finished'});}

    function unsubscribeAll(){subs.splice(0).forEach(([r,cb])=>r.off('value',cb));}

    return {createRoom,getRoom,joinRoom,onPlayers,onStatus,startGame,saveLevel,finish,unsubscribeAll};
})();
