/* ── ANIMATION ── */
const clock=new THREE.Clock();
function animate(){
    requestAnimationFrame(animate);
    controls.update();
    const t=clock.getElapsedTime();
    if(seaMesh&&seaOrigVerts.length){
        const pos=seaMesh.geometry.attributes.position;
        for(let i=0;i<pos.count;i++){
            const o=seaOrigVerts[i];
            if(o.y>0){const w=Math.sin(o.x*0.45+t*1.8)*0.28+Math.cos(o.z*0.35+t*1.4)*0.28;pos.setY(i,o.y+w);}
        }
        seaMesh.geometry.computeVertexNormals(); pos.needsUpdate=true;
    }
    turbines.forEach(t=>t.rotor.rotation.z-=t.speed);
    clouds.forEach(c=>{c.position.x+=c.userData.speed;if(c.position.x>90){c.position.x=-90;c.position.z=-60+Math.random()*120;}});
    animatedObjects.forEach(ao=>ao.update(t));
    renderer.render(scene,camera);
}
animate();
