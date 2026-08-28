export function createEnemy(scene, x, y, index) {
  const body = scene.add.rectangle(x, y, 20, 20, 0xed5b5b).setDepth(2);
  body.hp = 60; body.maxHp = 60; body.lastShot = 0; body.name = `RAIDER-${index}`;
  return body;
}