export function createHUD(scene, tier, config) {
  scene.add.rectangle(20, 18, 860, 66, 0x09121e, 0.94).setOrigin(0, 0).setDepth(10);
  scene.add.text(36, 28, `RAID // ${tier.toUpperCase()} SYNC`, { fontFamily: 'monospace', fontSize: '17px', color: '#eaf4ff' }).setDepth(11);
  scene.add.text(36, 55, `AI: ${config.aggression.toUpperCase()} | ACCURACY ${Math.round(config.aimAccuracy * 100)}% | [WASD] MOVE [SPACE] FIRE`, { fontFamily: 'monospace', fontSize: '11px', color: '#70e6c1' }).setDepth(11);
  scene.add.text(40, 578, 'YOU', { fontFamily: 'monospace', fontSize: '12px', color: '#8bc8ff' }).setDepth(11);
  const playerBar = scene.add.rectangle(78, 582, 180, 12, 0x55aaff).setOrigin(0, 0.5).setDepth(11);
  scene.add.text(294, 578, 'AI', { fontFamily: 'monospace', fontSize: '12px', color: '#70e6c1' }).setDepth(11);
  const aiBar = scene.add.rectangle(322, 582, 180, 12, 0x52d6a4).setOrigin(0, 0.5).setDepth(11);
  const feed = scene.add.text(620, 100, '', { fontFamily: 'monospace', fontSize: '12px', color: '#f6df9b', wordWrap: { width: 240 } }).setDepth(11);
  const bubble = scene.add.text(530, 505, '', { fontFamily: 'monospace', fontSize: '13px', color: '#0b1723', backgroundColor: '#70e6c1', padding: { x: 10, y: 8 }, wordWrap: { width: 310 } }).setDepth(11);
  return {
    updateBars: (player, teammate) => { playerBar.width = 180 * Math.max(0, player.hp) / player.maxHp; aiBar.width = 180 * Math.max(0, teammate.hp) / teammate.maxHp; },
    addFeed: (line) => { feed.text = `${line}\n${feed.text}`.split('\n').slice(0, 6).join('\n'); },
    thinking: () => { bubble.text = 'COMMANDER is thinking...'; },
    say: (line) => { bubble.text = line; scene.time.delayedCall(4600, () => { if (bubble.text === line) bubble.text = ''; }); },
  };
}