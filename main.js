//初期設定
const scene = new THREE.Scene();

const camera = new THREE.PerspectiveCamera(
  75,
  window.innerWidth / window.innerHeight,
  0.1,
  1000,
);
camera.position.set(0, 5, 10);

const renderer = new THREE.WebGLRenderer({
  canvas: document.querySelector("#myCanvas"),
});
renderer.setSize(window.innerWidth, window.innerHeight);

// 目盛
const gridHelper = new THREE.GridHelper(30, 60, 0x888888, 0x444444);
scene.add(gridHelper);

// プレイヤー（立方体）
const geometry = new THREE.BoxGeometry(0.5, 0.5, 0.5);
const material = new THREE.MeshBasicMaterial({ color: 0x00ff00 });
const cube = new THREE.Mesh(geometry, material);
scene.add(cube);

// 弾の設定
const gunGeometry = new THREE.BoxGeometry(0.2, 0.2, 0.3);
const gunMaterial = new THREE.MeshBasicMaterial({ color: 0xdc143c });
const gunClone = []; // 弾を保管する配列
const gunSpeed = 0.15;
let gunReady = false;
let gunTime = 60;

// 弾危機（変数宣言に let を追加）
const gunDangerGeometry = new THREE.RingGeometry(0, 12, 128);
const gunDangerMaterial = new THREE.MeshBasicMaterial({
  color: 0xdc143c,
  side: THREE.DoubleSide,
  transparent: true,
  opacity: 0.3,
});
let gunDangerClones = [];

// 弾危機2（変数宣言に let を追加）
const gunDanger2Geometry = new THREE.RingGeometry(0, 12, 128);
const gunDanger2Material = new THREE.MeshBasicMaterial({
  color: 0xdc143c,
  side: THREE.DoubleSide,
  transparent: true,
  opacity: 0.6,
});
let gunDanger2Clones = [];

// 修正点1: planeGometry -> PlaneGeometry に修正 & let を追加
const planeDangerGeometry = new THREE.PlaneGeometry(2, 5);
const planeDangerMaterial = new THREE.MeshBasicMaterial({
  color: 0xdc143c,
  side: THREE.DoubleSide,
  transparent: true,
  opacity: 0.3,
});
let planeDangerClones = [];

// 滑らかな円運動のためのパラメーター
let currentAngle = 0;
let angularVelocity = 0;
const acceleration = 0.002;
const friction = 0.92;
const orbitRadius = 10;
const orbitRadiusCamera = orbitRadius + 5;

// キーの状態管理
const keysPressed = {};

document.addEventListener("keydown", (event) => {
  const key = event.key.toLowerCase();
  keysPressed[key] = true;


document.addEventListener("keyup", (event) => {
  keysPressed[event.key.toLowerCase()] = false;
});

// 弾危機 生成
function spawnGunDanger() {
  const gunDanger = new THREE.Mesh(gunDangerGeometry, gunDangerMaterial);
  gunDanger.rotation.x = Math.PI / -2;
  gunDanger.position.y = 0.1;
  gunDanger.scale.setScalar(0);
  scene.add(gunDanger);
  gunDangerClones.push({
    mesh: gunDanger,
    life: 120,
  });
}

function spawnGunDanger2() {
  const gunDanger2 = new THREE.Mesh(gunDanger2Geometry, gunDanger2Material);
  gunDanger2.rotation.x = Math.PI / -2;
  gunDanger2.position.y = 0.11;
  gunDanger2.scale.setScalar(0);
  scene.add(gunDanger2);
  gunDanger2Clones.push({
    mesh: gunDanger2,
    life: 60,
  });
}

function spawnBullet() {
  for (let gunCloneCount = 60; gunCloneCount > 0; gunCloneCount--) {
    const gunCube = new THREE.Mesh(gunGeometry, gunMaterial);
    scene.add(gunCube);

    const gunDirection = new THREE.Vector3(
      Math.random() - 0.5,
      0,
      Math.random() - 0.5,
    ).normalize();

    const gunVelocity = gunDirection.multiplyScalar(gunSpeed);

    gunClone.push({
      mesh: gunCube,
      velocity: gunVelocity,
      life: 180,
    });
  }
}

function spawnPlaneDanger() {
  for (let planeCloneCount = 4; planeCloneCount > 0; planeCloneCount--) {
    const planeDanger = new THREE.Mesh(
      planeDangerGeometry,
      planeDangerMaterial,
    );
    
    planeDanger.rotation.x = Math.PI / 2;
    planeDanger.lookAt(0,0,0);
    planeDanger.position.x = 5 * Math.sin(Math.random() * 10 -5);
    planeDanger.position.z = 5 * Math.cos(Math.random() * 10 -5);
    scene.add(planeDanger);
    

    planeDangerClones.push({
      mesh: planeDanger,
      life: 180,
    });
  }
}

// --- 描画・更新ループ ---
function animate() {
  // 1. 移動操作（A/Dキー）
  if (keysPressed["a"]) angularVelocity -= acceleration;
  if (keysPressed["d"]) angularVelocity += acceleration;

  currentAngle += angularVelocity;
  angularVelocity *= friction;

  // 2. プレイヤー位置の更新
  cube.position.x = orbitRadius * Math.sin(currentAngle);
  cube.position.z = orbitRadius * Math.cos(currentAngle);
  cube.position.y = 0.5;
  cube.lookAt(0, 0, 0);

  // 弾危機（1段階目）の制御
  for (let i = gunDangerClones.length - 1; i >= 0; i--) {
    const gunDangerItem = gunDangerClones[i];

    gunDangerItem.life--;

    if (gunDangerItem.life >= 60) {
      gunDangerItem.mesh.scale.setScalar(gunDangerItem.mesh.scale.x + 1 / 60);
    }
    if (gunDangerItem.life === 60) {
      spawnGunDanger2();
    }

    if (gunDangerItem.life === 0) {
      scene.remove(gunDangerItem.mesh);
      gunDangerItem.mesh.geometry.dispose();
      gunDangerClones.splice(i, 1);
    }
  }

  // 弾危機（2段階目）の制御
  for (let i = gunDanger2Clones.length - 1; i >= 0; i--) {
    const gunDanger2Item = gunDanger2Clones[i];
    gunDanger2Item.life--;

    gunDanger2Item.mesh.scale.setScalar(gunDanger2Item.mesh.scale.x + 1 / 60);

    if (gunDanger2Item.life === 0) {
      spawnBullet();
      scene.remove(gunDanger2Item.mesh);
      gunDanger2Item.mesh.geometry.dispose();
      gunDanger2Clones.splice(i, 1);
    }
  }

  // 3. 弾の移動 & 寿命（life）管理
  for (let i = gunClone.length - 1; i >= 0; i--) {
    const item = gunClone[i];

    // 位置を更新
    item.mesh.position.add(item.velocity);

    // 寿命を減らす
    item.life--;

    // 寿命が0以下になったら削除
    if (item.life <= 0) {
      scene.remove(item.mesh); // 画面から消す
      item.mesh.geometry.dispose(); // メモリを解放
      gunClone.splice(i, 1); // 配列から取り除く
    }
  };

  //for (let i = planeDangerClones.length - 1; i >= 0; i--) {
    
    
 // };

  // タイマー管理
  gunTime--;
  if (gunTime === 0) {
    gunReady = true;
    gunTime = 300;
  }

  if (gunReady === true) {
    spawnGunDanger();
    spawnPlaneDanger();
    gunReady = false;
  }

  // 4. カメラの追従
  camera.lookAt(cube.position);
  camera.position.x = orbitRadiusCamera * Math.sin(currentAngle);
  camera.position.z = orbitRadiusCamera * Math.cos(currentAngle);

  renderer.render(scene, camera);
  requestAnimationFrame(animate);
}

animate();
