export function createPlayer(scene, x, y) {
  const body = scene.add.rectangle(x, y, 22, 22, 0x55aaff).setDepth(3);
  body.hp = 100; body.maxHp = 100; body.isDowned = false; body.lastShot = 0;
  return body;
}