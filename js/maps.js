
function clearMap(){
    [...terrains,...turbines.map(t=>t.group)].forEach(o=>scene.remove(o));
    turbineHitboxes.forEach(h=>scene.remove(h.userData.group||h));
    terrains=[]; turbines=[]; turbineHitboxes=[];
    seaMesh=null; seaOrigVerts=[];
    animatedObjects.forEach(o=>scene.remove(o.obj)); animatedObjects=[]; clouds=[];
}

function makeSea(w,d,x,z,mat,ud){
    const geo=new THREE.BoxGeometry(w,4,d,16,1,32);
    const pos=geo.attributes.position; const orig=[];
    for(let i=0;i<pos.count;i++) orig.push({x:pos.getX(i),y:pos.getY(i),z:pos.getZ(i)});
    const mesh=new THREE.Mesh(geo,mat);
    mesh.position.set(x,-1,z); mesh.receiveShadow=true; mesh.userData=ud;
    seaOrigVerts=orig; seaMesh=mesh; return mesh;
}
function makeTerrain(w,h,d,sx,sz,mat,px,py,pz,ud){
    const geo=new THREE.BoxGeometry(w,h,d,sx,1,sz);
    const pos=geo.attributes.position;
    for(let i=0;i<pos.count;i++){
        if(pos.getY(i)>0) pos.setY(i,h/2+Math.sin(pos.getX(i)*0.5)*0.6+Math.cos(pos.getZ(i)*0.4)*0.6+(Math.random()-0.5)*0.4);
    }
    geo.computeVertexNormals();
    const mesh=new THREE.Mesh(geo,mat);
    mesh.position.set(px,py,pz); mesh.receiveShadow=true; mesh.castShadow=true; mesh.userData=ud; return mesh;
}
function makeMtn(r,h,s,mat,px,py,pz,ud){
    const mesh=new THREE.Mesh(new THREE.ConeGeometry(r,h,s),mat);
    mesh.position.set(px,py+h/2,pz); mesh.castShadow=true; mesh.receiveShadow=true; mesh.userData=ud; return mesh;
}
function makeCloud(mat,x,y,z){
    const g=new THREE.Group();
    const geo=new THREE.IcosahedronGeometry(1,0);
    for(let i=0;i<5;i++){
        const m=new THREE.Mesh(geo,mat);
        m.position.set((Math.random()-0.5)*8,(Math.random()-0.5)*2,(Math.random()-0.5)*5);
        const sc=1.8+Math.random()*1.8; m.scale.set(sc,sc*0.7,sc); g.add(m);
    }
    g.position.set(x,y,z); g.userData={speed:0.01+Math.random()*0.02}; return g;
}

/* ── MAP BUILDERS ── */
function buildMap(lvId){
    const lv=LEVELS[lvId];
    scene.background=new THREE.Color(lv.skyColor);
    scene.fog=new THREE.FogExp2(lv.fogColor,lv.fogDensity);
    camera.position.set(...lv.camPos); controls.target.set(...lv.camTarget);
    hemiLight.color.set(lv.skyColor);
    if(lvId===1) buildOcean();
    else if(lvId===2) buildDesert();
    else if(lvId===3) buildArctic();
    else if(lvId===4) buildStorm();
}

function buildOcean(){
    const sea=makeSea(60,120,-20,0,mats.ocean,{type:'ทะเลน้ำลึก',power:12,desc:'ลมเปิดโล่ง ยิ่งไกลฝั่งยิ่งได้พลังงานสูง'});
    scene.add(sea); terrains.push(sea);
    const coast=makeTerrain(22,5,120,8,28,mats.sand,19,-1,0,{type:'ชายฝั่งทะเล',power:7,desc:'ลมทะเลพัดเข้าหาฝั่ง ได้พลังงานดีพอสมควร'});
    scene.add(coast); terrains.push(coast);
    const island=makeTerrain(18,6,20,5,5,mats.rock,10,-1,20,{type:'เกาะหินกลางทะเล',power:9,desc:'บนหน้าผาเกาะรับลมได้รอบทิศ'});
    scene.add(island); terrains.push(island);
    const ltower=new THREE.Mesh(new THREE.CylinderGeometry(1.2,1.8,12,8),new THREE.MeshStandardMaterial({color:0xffffff,flatShading:true}));
    ltower.position.set(28,4,0); ltower.castShadow=true; scene.add(ltower);
    const ltop=new THREE.Mesh(new THREE.ConeGeometry(1.5,3,8),new THREE.MeshStandardMaterial({color:0xe05252,flatShading:true}));
    ltop.position.set(28,12,0); scene.add(ltop);
    const cMat=new THREE.MeshStandardMaterial({color:0xffffff,flatShading:true,roughness:0.9,transparent:true,opacity:0.92});
    for(let i=0;i<8;i++){const c=makeCloud(cMat,-80+Math.random()*160,28+Math.random()*14,-50+Math.random()*100);scene.add(c);clouds.push(c);}
}
function buildDesert(){
    const basin=makeTerrain(80,4,120,12,18,mats.sand,0,-1,0,{type:'ที่ราบทะเลทราย',power:4,desc:'แอ่งทะเลทรายต่ำ ลมเฉื่อย'});
    scene.add(basin); terrains.push(basin);
    const d1=makeTerrain(20,8,50,6,12,mats.dune,-25,-1,0,{type:'สันทรายสูง',power:7,desc:'สันทรายสูงรับลมได้ดีกว่าที่ราบ 60%'});
    scene.add(d1); terrains.push(d1);
    const d2=makeTerrain(20,8,50,6,12,mats.dune,25,-1,0,{type:'สันทรายสูง',power:7,desc:'สันทรายสูงรับลมได้ดีกว่าที่ราบ 60%'});
    scene.add(d2); terrains.push(d2);
    const cL=makeTerrain(10,16,30,3,8,mats.rock,-18,-1,-20,{type:'ช่องเขา Venturi',power:11,desc:'ลมถูกบีบผ่านช่องแคบ เร็วขึ้น 2-3 เท่า'});
    scene.add(cL); terrains.push(cL);
    const cR=makeTerrain(10,16,30,3,8,mats.rock,18,-1,-20,{type:'ช่องเขา Venturi',power:11,desc:'ลมถูกบีบผ่านช่องแคบ เร็วขึ้น 2-3 เท่า'});
    scene.add(cR); terrains.push(cR);
    for(let i=0;i<3;i++){const tornado=new THREE.Mesh(new THREE.ConeGeometry(1,12,8),new THREE.MeshStandardMaterial({color:0xffcc80,transparent:true,opacity:0.3,flatShading:true}));tornado.position.set(-30+i*30,5,-40+Math.random()*20);scene.add(tornado);animatedObjects.push({obj:tornado,update:(t)=>{tornado.rotation.y+=0.05;tornado.position.y=5+Math.sin(t*0.5+i)*1;}});}
    const cMat=new THREE.MeshStandardMaterial({color:0xffe0b2,flatShading:true,transparent:true,opacity:0.7});
    for(let i=0;i<5;i++){const c=makeCloud(cMat,-70+Math.random()*140,35+Math.random()*10,-50+Math.random()*100);scene.add(c);clouds.push(c);}
}
function buildArctic(){
    const sea=makeSea(80,120,-10,0,mats.ice,{type:'ทะเลน้ำแข็ง',power:10,desc:'อากาศขั้วโลกหนาแน่น ลมพัดต่อเนื่อง'});
    scene.add(sea); terrains.push(sea);
    const shelf=makeTerrain(30,6,80,8,20,mats.glacier,22,-1,0,{type:'ไหล่น้ำแข็ง',power:8,desc:'พื้นที่น้ำแข็งแผ่นใหญ่ รับลมขั้วโลกได้ตรง'});
    scene.add(shelf); terrains.push(shelf);
    const mtd={type:'ยอดเขาน้ำแข็ง',power:14,desc:'ยิ่งสูงลมยิ่งแรง อากาศเย็นหนาแน่นกว่า เพิ่มพลังงาน 20%'};
    const m1=makeMtn(14,30,6,mats.darkRock,-10,1,-10,mtd); scene.add(m1); terrains.push(m1);
    const ms1=makeMtn(5,10,6,mats.snow,-10,16,-10,{}); scene.add(ms1);
    const m2=makeMtn(10,22,5,mats.darkRock,12,1,15,mtd); scene.add(m2); terrains.push(m2);
    const ms2=makeMtn(3.5,7,5,mats.snow,12,12,15,{}); scene.add(ms2);
    const m3=makeMtn(8,18,5,mats.darkRock,-18,1,18,mtd); scene.add(m3); terrains.push(m3);
    const ms3=makeMtn(2.8,6,5,mats.snow,-18,10,18,{}); scene.add(ms3);
    for(let i=0;i<20;i++){const floe=new THREE.Mesh(new THREE.BoxGeometry(3+Math.random()*4,0.5,3+Math.random()*4),mats.glacier);floe.position.set(-40+Math.random()*20,-0.5,-50+Math.random()*100);floe.rotation.y=Math.random()*Math.PI;floe.castShadow=true;scene.add(floe);animatedObjects.push({obj:floe,update:(t)=>{floe.position.y=-0.5+Math.sin(t*0.3+i)*0.15;}});}
    const cMat=new THREE.MeshStandardMaterial({color:0xeceff1,flatShading:true,transparent:true,opacity:0.9});
    for(let i=0;i<6;i++){const c=makeCloud(cMat,-80+Math.random()*160,32+Math.random()*10,-60+Math.random()*120);scene.add(c);clouds.push(c);}
}
function buildStorm(){
    const sea=makeSea(55,110,-20,0,mats.stormSea,{type:'ทะเลพายุ',power:15,desc:'พลังงานลมสูงสุด! ยิ่งไกลใจกลางพายุยิ่งได้มาก'});
    scene.add(sea); terrains.push(sea);
    const coast=makeTerrain(20,5,110,7,26,mats.darkRock,17,-1,0,{type:'หน้าผาพายุ',power:10,desc:'หน้าผาสูงรับแรงพายุได้โดยตรง'});
    scene.add(coast); terrains.push(coast);
    for(let i=0;i<3;i++){
        const deck=new THREE.Mesh(new THREE.CylinderGeometry(4,4,1.5,8),new THREE.MeshStandardMaterial({color:0x546e7a,flatShading:true,metalness:0.6}));
        deck.position.set(-35+i*15,3,-20+i*20); deck.castShadow=true;
        deck.userData={type:'แท่นนอกชายฝั่ง',power:13,desc:'แท่นกลางทะเล รับพายุได้เต็มๆ ไม่มีสิ่งกีดขวาง'};
        scene.add(deck); terrains.push(deck);
    }
    const cMat=new THREE.MeshStandardMaterial({color:0x78909c,flatShading:true,transparent:true,opacity:0.8});
    for(let i=0;i<12;i++){const c=makeCloud(cMat,-90+Math.random()*180,20+Math.random()*18,-70+Math.random()*140);c.userData.speed=0.025+Math.random()*0.035;scene.add(c);clouds.push(c);}
    for(let i=0;i<5;i++){const pts=[new THREE.Vector3(0,12,0),new THREE.Vector3(-1,8,0),new THREE.Vector3(1,4,0),new THREE.Vector3(0,0,0)];const curve=new THREE.CatmullRomCurve3(pts);const geo=new THREE.TubeGeometry(curve,8,0.08,4,false);const mesh=new THREE.Mesh(geo,new THREE.MeshBasicMaterial({color:0xfff9c4}));mesh.position.set(-50+Math.random()*100,10+Math.random()*10,-60+Math.random()*120);scene.add(mesh);animatedObjects.push({obj:mesh,update:(t)=>{mesh.visible=Math.sin(t*3+i*2)>0.7;}});}
}

