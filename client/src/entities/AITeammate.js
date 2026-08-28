export function createAITeammate(scene, x, y, config) {
  const body = scene.add.rectangle(x, y, 22, 22, 0x52d6a4).setDepth(3);
  body.hp = 100; body.maxHp = 100; body.config = config; body.lastShot = 0; body.name = 'COMMANDER';
  return body;
}