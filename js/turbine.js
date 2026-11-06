/* ── TURBINE POWER ── */
function calcPower(x,y,z,type){
    let p=0;
    if(type==='ทะเลน้ำลึก') p=10+(Math.abs(x)*0.15)+(Math.abs(z)*0.04);
    else if(type==='ชายฝั่งทะเล') p=6+y*1.5;
    else if(type==='เกาะหินกลางทะเล') p=8+y*1.2;
    else if(type==='ที่ราบทะเลทราย') p=3+y*0.5;
    else if(type==='สันทรายสูง') p=6+y*1.0;
    else if(type==='ช่องเขา Venturi') p=9+y*0.8;
    else if(type==='ทะเลน้ำแข็ง') p=9+Math.abs(x)*0.1;
    else if(type==='ไหล่น้ำแข็ง') p=7+y*0.9;
    else if(type==='ยอดเขาน้ำแข็ง') p=12+y*0.4;
    else if(type==='ทะเลพายุ') p=13+Math.abs(x)*0.18;
    else if(type==='หน้าผาพายุ') p=9+y*1.1;
    else if(type==='แท่นนอกชายฝั่ง') p=11+y*0.7;
    else p=3+y*0.3;
    return Math.max(1,Math.round(p));
}
function dynDesc(power,type){
    const t={
        'ทะเลน้ำลึก':[14,'ใจกลางทะเลเปิด ลมไม่มีสิ่งกีดขวาง พลังงานสูงสุด!','บริเวณขอบทะเล ลมยังดีแต่มีผลจากฝั่ง'],
        'เกาะหินกลางทะเล':[10,'ยอดหน้าผา รับลมรอบทิศ 360°!','เชิงเกาะ ลมบางส่วนโดนหน้าผาบัง'],
        'สันทรายสูง':[8,'ยอดสัน Thermal Updraft แรงมาก!','ไหล่สัน ลมไม่แรงเท่ายอด'],
        'ช่องเขา Venturi':[12,'ช่องแคบสุดขีด Venturi Effect เต็มๆ!','ขอบช่องเขา น้อยกว่าแต่ยังได้ประโยชน์'],
        'ยอดเขาน้ำแข็ง':[16,'ยอดสูงสุด! อากาศเย็นหนาแน่น พลังงานสูงมาก','ไหล่เขา ดีกว่าพื้นราบ'],
        'ทะเลพายุ':[16,'ใจกลางพายุ Trade Wind แรงที่สุดในโลก!','ขอบพายุ ยังได้พลังงานสูงมาก'],
        'แท่นนอกชายฝั่ง':[14,'แท่นระดับสูง รับพายุได้เต็มๆ','ฐานแท่น ลมดี แต่ไม่เท่าดาดฟ้า'],
    };
    const td=t[type];
    if(td) return power>=td[0]?td[1]:td[2];
    return 'ตำแหน่งนี้มีลมพัดปานกลาง';
}

function createTurbine(x,y,z,typeData,power){
    const g=new THREE.Group();
    const tMat=new THREE.MeshStandardMaterial({color:0xf0f4f8,roughness:0.2,metalness:0.5});
    const bMat=new THREE.MeshStandardMaterial({color:0x1a6fb5,roughness:0.3,metalness:0.5});
    const tower=new THREE.Mesh(new THREE.CylinderGeometry(0.4,0.7,13,12),tMat);
    tower.position.y=6.5; tower.castShadow=true; g.add(tower);
    const nacelle=new THREE.Mesh(new THREE.BoxGeometry(1.4,1.4,2.8),tMat);
    nacelle.position.set(0,13,0.4); g.add(nacelle);
    const spinner=new THREE.Mesh(new THREE.ConeGeometry(0.5,1.2,8),bMat);
    spinner.rotation.x=Math.PI/2; spinner.position.set(0,13,1.8); g.add(spinner);
    const rotor=new THREE.Group(); rotor.position.set(0,13,1.8);
    for(let i=0;i<3;i++){
        const blade=new THREE.Mesh(new THREE.BoxGeometry(0.22,10,0.4),tMat);
        blade.position.y=5; blade.castShadow=true;
        const pivot=new THREE.Group(); pivot.rotation.z=(i*120)*Math.PI/180; pivot.add(blade); rotor.add(pivot);
    }
    g.add(rotor); g.position.set(x,y,z);
    const hitbox=new THREE.Mesh(new THREE.CylinderGeometry(2.5,2.5,20),new THREE.MeshBasicMaterial({visible:false}));
    hitbox.position.y=10; hitbox.userData={isTurbine:true,group:g,power};
    g.add(hitbox); scene.add(g);
    const spd=Math.max(power*0.012,0.03);
    turbines.push({group:g,rotor,speed:spd}); turbineHitboxes.push(hitbox);
    g.scale.set(0.01,0.01,0.01); let t=0;
    function grow(){t+=0.1;if(t<=1){const s=THREE.MathUtils.lerp(0.01,1,t);g.scale.set(s,s,s);requestAnimationFrame(grow);}else g.scale.set(1,1,1);}
    grow();
}
function isTooClose(x,y,z){
    const d=LEVELS[currentLevelId].minDist;
    for(let t of turbines){
        const p=t.group.position;
        if(Math.sqrt(Math.pow(p.x-x,2)+Math.pow(p.y-y,2)+Math.pow(p.z-z,2))<d) return true;
    }
    return false;
}

