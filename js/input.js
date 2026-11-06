/* ── INPUT ── */
const raycaster=new THREE.Raycaster(),mouse=new THREE.Vector2();
let isDragging=false,pDown={x:0,y:0};
window.addEventListener('pointerdown',e=>{isDragging=false;pDown={x:e.clientX,y:e.clientY};});
window.addEventListener('pointermove',e=>{if(Math.abs(e.clientX-pDown.x)>6||Math.abs(e.clientY-pDown.y)>6) isDragging=true;});
window.addEventListener('pointerup',e=>{
    if(e.target.tagName==='BUTTON'||e.target.tagName==='INPUT'||!isGameActive||isDragging) return;
    mouse.x=(e.clientX/window.innerWidth)*2-1;
    mouse.y=-(e.clientY/window.innerHeight)*2+1;
    raycaster.setFromCamera(mouse,camera);
    const hitT=raycaster.intersectObjects(turbineHitboxes);
    if(hitT.length>0){
        sfx.remove();
        const h=hitT[0].object;
        scene.remove(h.userData.group);
        currentEnergyRate-=h.userData.power;
        turbinesPlaced--;
        turbines.splice(turbines.findIndex(t=>t.group===h.userData.group),1);
        turbineHitboxes.splice(turbineHitboxes.indexOf(h),1);
        document.getElementById('turbines-left').innerText=maxTurbines-turbinesPlaced;
        updateScoreUI(currentEnergyRate);
        if(turbinesPlaced<maxTurbines) document.getElementById('submit-wrap').style.display='none';
        return;
    }
    if(turbinesPlaced>=maxTurbines) return;
    const hitG=raycaster.intersectObjects(terrains,true);
    if(hitG.length>0){
        const hit=hitG[0];
        let obj=hit.object; while(!obj.userData.type&&obj.parent) obj=obj.parent;
        const td=obj.userData; if(!td.type) return;
        if(buildMode==='cluster'){
            const offs=[{x:0,z:0},{x:-10,z:-10},{x:10,z:-10}];
            let placed=false,cp=0;
            for(let off of offs){
                if(turbinesPlaced>=maxTurbines) break;
                const px=hit.point.x+off.x,pz=hit.point.z+off.z;
                const rayD=new THREE.Raycaster(new THREE.Vector3(px,100,pz),new THREE.Vector3(0,-1,0));
                const gh=rayD.intersectObjects(terrains,true);
                if(gh.length>0){
                    const gpt=gh[0].point;
                    if(isTooClose(gpt.x,gpt.y,gpt.z)) continue;
                    let gobj=gh[0].object; while(!gobj.userData.type&&gobj.parent) gobj=gobj.parent;
                    const gd=gobj.userData; if(!gd.type) continue;
                    const pw=calcPower(gpt.x,gpt.y,gpt.z,gd.type);
                    createTurbine(gpt.x,gpt.y,gpt.z,gd,pw);
                    turbinesPlaced++; currentEnergyRate+=pw; cp+=pw; placed=true;
                }
            }
            if(placed){sfx.place();showKpop('กลุ่ม 3 ต้น','วางแบบ Staggered Grid ลด Wake Effect',cp);}
            else showWarning('พื้นที่ไม่เพียงพอหรือกังหันชิดกันเกินไป!');
        } else {
            if(isTooClose(hit.point.x,hit.point.y,hit.point.z)){showWarning('กังหันชิดกันเกินไป! จะเกิด Wake Effect');return;}
            sfx.place();
            const pw=calcPower(hit.point.x,hit.point.y,hit.point.z,td.type);
            createTurbine(hit.point.x,hit.point.y,hit.point.z,td,pw);
            turbinesPlaced++; currentEnergyRate+=pw;
            showKpop(td.type,dynDesc(pw,td.type),pw);
        }
        document.getElementById('turbines-left').innerText=maxTurbines-turbinesPlaced;
        document.getElementById('strip-total').innerText=totalScore+currentEnergyRate;
        updateScoreUI(currentEnergyRate);
        if(turbinesPlaced===maxTurbines) document.getElementById('submit-wrap').style.display='block';
    }
});

window.addEventListener('resize',()=>{
    renderer.setSize(window.innerWidth,window.innerHeight);
    camera.aspect=window.innerWidth/window.innerHeight; camera.updateProjectionMatrix();
});

