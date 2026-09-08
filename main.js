const scene = new THREE.Scene();

const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.set(0, 3, 10);

const renderer = new THREE.WebGLRenderer({
  canvas: document.querySelector('#myCanvas')
});
renderer.setSize(window.innerWidth, window.innerHeight);

// 背景のグリッド
const gridHelper = new THREE.GridHelper(30, 60, 0x888888, 0x444444);
scene.add(gridHelper);

// プレイヤー（立方体）
const geometry = new THREE.BoxGeometry(0.5, 0.5, 0.5);
const material = new THREE.MeshBasicMaterial({ color: 0x00ff00 });
const cube = new THREE.Mesh(geometry, material);
scene.add(cube);

// 弾の設定
const gunGeometry = new THREE.BoxGeometry(0.2, 0.2, 0.3);
const gunMaterial = new THREE.MeshBasicMaterial({ color: 0xDC143C });
const gunClone = []; // 弾を保管する配列
const gunSpeed = 0.2;
let gunReady = false;
let gunTime = 60;

const gunDangerGeometry = new THREE.RingGeometry(3, 15, 128);
const gunDangerMaterial = new THREE.MeshBasicMaterial(
  { color: 0xDC143C,
    side:THREE.DoubleSide,
    transparent: true,
    opacity: 0.3
  });
gunDangerClones = [];

const gunDanger2Geometry = new THREE.RingGeometry(3, 15, 128);
const gunDanger2Material = new THREE.MeshBasicMaterial(
  {color: 0xDC143C,
   side: THREE.DoubleSide,
  transparent: true,
   opacity: 0.6}
);
gunDanger2Clones = [];


// 滑らかな円運動のためのパラメーター
let currentAngle = 0;
let angularVelocity = 0;
const acceleration = 0.002;
const friction = 0.92;
const orbitRadius = 10;
const orbitRadiusCamera = orbitRadius + 5;

// キーの状態管理
const keysPressed = {};

document.addEventListener('keydown', (event) => {
  const key = event.key.toLowerCase();
  keysPressed[key] = true;

  // スペースキーを押した瞬間に弾を1発生成
  if (event.code === 'Space') {
    spawnBullet();
  }
});

document.addEventListener('keyup', (event) => {
  keysPressed[event.key.toLowerCase()] = false;
});

// 弾を生成する関数（1回呼び出すごとに1発作成）
function spawnGunDanger() {
  for (let gunDangerCount = 1; gunDangerCount > 0; gunDangerCount--){
    const gunDanger = new THREE.Mesh(gunDangerGeometry, 
                                     gunDangerMaterial);
    gunDanger.rotation.x = Math.PI / -2;
    gunDanger.position.y = 0.1;
    scene.add(gunDanger);
    gunDangerClones.push({
      mesh: gunDanger,
      life: 120
    });
   
  }
};

function spawnGunDanger2(){
  for(let gunDanger2Count = 1; gunDanger2Count > 0; gunDanger2Count--){
    const gunDanger2 = new THREE.Mesh(gunDanger2Geometry, gunDanger2Material);
    gunDanger2.rotation.x = Math.PI / -2;
    gunDanger2.position.y = 0.1;
    scene.add(gunDanger2);
    gunDanger2Clones.push({
      mesh: gunDanger2,
      life: 60
    });
  }
  
};


function spawnBullet() {
  for (let gunCloneCount = 60;  gunCloneCount > 0; gunCloneCount--){
  const gunCube = new THREE.Mesh(gunGeometry, gunMaterial);
  scene.add(gunCube);

  const gunDirection = new THREE.Vector3(
    Math.random() - 0.5,
    0,
    Math.random() - 0.5
  ).normalize();

  const gunVelocity = gunDirection.multiplyScalar(gunSpeed);

  // 配列に追加（lifeをフレーム数で指定：60 = 約1秒）
  gunClone.push({
    mesh: gunCube,
    velocity: gunVelocity,
    life: 180
  });

  
  }}

// --- 描画・更新ループ ---
function animate() {
  // 1. 移動操作（A/Dキー）
  if (keysPressed['a']) angularVelocity -= acceleration;
  if (keysPressed['d']) angularVelocity += acceleration;

  currentAngle += angularVelocity;
  angularVelocity *= friction;

  // 2. プレイヤー位置の更新
  cube.position.x = orbitRadius * Math.sin(currentAngle);
  cube.position.z = orbitRadius * Math.cos(currentAngle);
  cube.position.y = 0.5;
  cube.lookAt(0, 0, 0);


  //gunDager
  for (let i = gunDangerClones.length - 1; i >= 0; i--){
    const gunDangerItem = gunDangerClones[i];

    gunDangerItem.life--;

    if (gunDangerItem.life === 60){
      spawnGunDanger2();
    
    }
    
      if(gunDangerItem.life === 0){ 
      
      scene.remove(gunDangerItem.mesh);
      gunDangerItem.mesh.geometry.dispose();
      gunDangerClones.splice(i, 1);
      
    }
  }

  for (let i = gunDanger2Clones.length - 1; i >= 0; i--){
    const gunDanger2Item = gunDanger2Clones[i];
    gunDanger2Item.life--;

    if (gunDanger2Item.life === 0){
      spawnBullet();
      scene.remove(gunDanger2Item.mesh);
      gunDanger2Item.mesh.geometry.dispose();
      gunDanger2Clones.splice(i, 1);
      
    }
  }

  // 3. 弾の移動 & 寿命（life）管理
  // 配列を後ろから安全にループ
  for (let i = gunClone.length - 1; i >= 0; i--) {
    const item = gunClone[i];

    // 位置を更新
    item.mesh.position.add(item.velocity);

    // 寿命を減らす
    item.life--;

    // 寿命が0以下になったら削除
    if (item.life === 0) {
      scene.remove(item.mesh);       // 画面から消す
      item.mesh.geometry.dispose();  // メモリを解放
      gunClone.splice(i, 1);         // 配列から取り除く
    }
  }
gunTime--
  if (gunTime === 0){
    gunReady = true;
    gunTime = 300;
  };
  
  if (gunReady === true){
    spawnGunDanger()
    gunReady = false;
  };
  
  

  // 4. カメラの追従
  camera.lookAt(cube.position);
  camera.position.x = orbitRadiusCamera * Math.sin(currentAngle);
  camera.position.z = orbitRadiusCamera * Math.cos(currentAngle);

  renderer.render(scene, camera);
  requestAnimationFrame(animate);
}

animate();

