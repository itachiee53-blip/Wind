/* ── 3D SCENE ── */
const scene=new THREE.Scene();
const camera=new THREE.PerspectiveCamera(45,window.innerWidth/window.innerHeight,0.1,1000);
camera.position.set(0,85,120);
const renderer=new THREE.WebGLRenderer({antialias:true,powerPreference:'high-performance'});
renderer.setSize(window.innerWidth,window.innerHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio,2));
renderer.shadowMap.enabled=true; renderer.shadowMap.type=THREE.PCFSoftShadowMap;
renderer.toneMapping=THREE.ACESFilmicToneMapping; renderer.toneMappingExposure=1.5;
document.getElementById('canvas-container').appendChild(renderer.domElement);

const controls=new THREE.OrbitControls(camera,renderer.domElement);
controls.enableDamping=true; controls.dampingFactor=0.07;
controls.maxPolarAngle=Math.PI/2-0.05; controls.minDistance=30; controls.maxDistance=240;
controls.target.set(0,2,0);

const hemiLight=new THREE.HemisphereLight(0xffffff,0xd0e8f0,0.9); scene.add(hemiLight);
const dirLight=new THREE.DirectionalLight(0xfffaed,1.4);
dirLight.position.set(80,130,60); dirLight.castShadow=true;
dirLight.shadow.camera.top=100; dirLight.shadow.camera.bottom=-100;
dirLight.shadow.camera.left=-100; dirLight.shadow.camera.right=100;
dirLight.shadow.mapSize.width=2048; dirLight.shadow.mapSize.height=2048;
dirLight.shadow.bias=-0.0003; scene.add(dirLight);

let terrains=[],turbines=[],turbineHitboxes=[];
let seaMesh=null,seaOrigVerts=[],animatedObjects=[],clouds=[];

const mats={
    wood:new THREE.MeshStandardMaterial({color:0x5d4037,roughness:0.85,metalness:0.1,flatShading:true}),
    snow:new THREE.MeshStandardMaterial({color:0xfafafa,roughness:0.4,flatShading:true}),
    rock:new THREE.MeshStandardMaterial({color:0x78909c,roughness:0.6,metalness:0.25,flatShading:true}),
    darkRock:new THREE.MeshStandardMaterial({color:0x546e7a,roughness:0.7,flatShading:true}),
    sand:new THREE.MeshStandardMaterial({color:0xffcc80,roughness:0.9,flatShading:true}),
    dune:new THREE.MeshStandardMaterial({color:0xffa726,roughness:0.9,flatShading:true}),
    ice:new THREE.MeshStandardMaterial({color:0xb3e5fc,roughness:0.1,metalness:0.3,flatShading:true}),
    glacier:new THREE.MeshStandardMaterial({color:0xe1f5fe,roughness:0.2,flatShading:true}),
    stormSea:new THREE.MeshPhysicalMaterial({color:0x3a6080,metalness:0.2,roughness:0.15,transmission:0.3,transparent:true,opacity:0.92,flatShading:true}),
    ocean:new THREE.MeshPhysicalMaterial({color:0x2189c8,metalness:0.15,roughness:0.1,transmission:0.45,transparent:true,opacity:0.9,flatShading:true}),
};
