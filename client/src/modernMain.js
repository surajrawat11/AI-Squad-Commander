import Phaser from 'phaser';
import './style.css';
import profiles from './data/mockPlayerProfiles.json';
import { buildSkillSync } from '../../server/services/skillSync.js';
import { requestBriefing, requestCallout } from './systems/CalloutClient.js';

const W = 1280;
const H = 720;
const WORLD = 2200;
const TEXT = { fontFamily: 'monospace' };

function label(scene, x, y, text, size = 14, color = '#eaf4ff') {
  return scene.add.text(x, y, text, { ...TEXT, fontSize: `${size}px`, color });
}

class LobbyScene extends Phaser.Scene {
  constructor() { super('LobbyScene'); }
  create() {
    this.cameras.main.setBackgroundColor('#081018');
    this.add.rectangle(0, 0, W, H, 0x081018).setOrigin(0);
    this.add.rectangle(760, 0, 520, H, 0x102c35).setOrigin(0).setAlpha(0.8);
    label(this, 74, 62, 'AI SQUAD', 64); label(this, 78, 132, 'COMMANDER', 64, '#63e6b5');
    label(this, 82, 230, 'DROP INTO THE LAST CIRCLE', 18, '#91afba');
    label(this, 82, 270, 'Your squadmate adapts to your raid history.', 15, '#66818d');
    const start = this.add.rectangle(82, 350, 310, 62, 0x20a47e).setOrigin(0).setInteractive({ useHandCursor: true });
    label(this, 110, 370, 'ANALYZE RAID PROFILE  >', 16);
    start.on('pointerdown', () => this.scene.start('ProfileScene'));
    label(this, 82, 650, 'PROTOTYPE // SQUAD INTELLIGENCE SYSTEM', 12, '#496b78');
  }
}

class ProfileScene extends Phaser.Scene {
  constructor() { super('ProfileScene'); }
  create() {
    this.cameras.main.setBackgroundColor('#0a151d');
    label(this, 66, 42, 'PREVIOUS RAID ANALYSIS', 27);
    label(this, 68, 84, 'Your stats determine how COMMANDER plays.', 14, '#75929e');
    profiles.forEach((profile, index) => {
      const x = 66 + index * 390;
      const card = this.add.rectangle(x, 145, 350, 410, 0x10232d).setOrigin(0).setInteractive({ useHandCursor: true });
      this.add.rectangle(x, 145, 350, 7, [0x55aaff, 0xf4c95d, 0x63e6b5][index]).setOrigin(0);
      label(this, x + 28, 180, profile.name.toUpperCase(), 24, ['#8bc8ff', '#f4c95d', '#63e6b5'][index]);
      label(this, x + 28, 228, `K/D       ${profile.kd_ratio}\nAVG DAMAGE ${profile.avg_damage}\nACCURACY   ${profile.accuracy}%\nSURVIVAL   ${Math.round(profile.survival_time / 60)}m\nREVIVES    ${profile.revive_count}`, 15, '#eaf4ff').setLineSpacing(12);
      label(this, x + 28, 420, profile.description, 12, '#75929e');
      card.on('pointerover', () => card.setFillStyle(0x193746));
      card.on('pointerout', () => card.setFillStyle(0x10232d));
      card.on('pointerdown', () => this.scene.start('BriefingScene', { profile }));
    });
  }
}

class BriefingScene extends Phaser.Scene {
  constructor() { super('BriefingScene'); }
  create(data) {
    this.profile = data.profile; this.sync = buildSkillSync(this.profile);
    this.cameras.main.setBackgroundColor('#09141c');
    label(this, 80, 52, 'COMMANDER // INTEL BRIEFING', 28);
    label(this, 82, 100, `${this.profile.name.toUpperCase()} SYNC  •  SCORE ${this.sync.score}  •  ${this.sync.aggressionLevel.toUpperCase()}`, 14, '#63e6b5');
    this.add.rectangle(80, 160, 850, 260, 0x102731).setOrigin(0);
    label(this, 118, 198, 'FIELD INTEL // TAVILY GROUNDING', 13, '#f4c95d');
    this.message = label(this, 118, 250, 'COMMANDER is checking the field...', 22, '#eaf4ff').setWordWrapWidth(750);
    requestBriefing(this.sync.tier).then((briefing) => { this.message.setText(`"${briefing}"`); });
    const deploy = this.add.rectangle(80, 475, 300, 58, 0x20a47e).setOrigin(0).setInteractive({ useHandCursor: true });
    label(this, 112, 494, 'DEPLOY TO VIKENDI  >', 15);
    deploy.on('pointerdown', () => this.scene.start('GameScene', { profile: this.profile, sync: this.sync }));
  }
}

class GameScene extends Phaser.Scene {
  constructor() { super('GameScene'); }
  create(data) {
    this.sync = data.sync; this.clock = 0; this.downed = false; this.revived = false; this.over = false; this.kills = 0; this.nextCallout = 0;
    this.walls = [];
    this.cameras.main.setBackgroundColor('#182b2c');
    this.buildWorld();
    this.player = this.makeUnit(1030, 1160, 0x54a8ff, 'YOU'); this.player.hp = 100; this.player.maxHp = 100; this.player.lastShot = 0;
    this.ai = this.makeUnit(980, 1210, 0x63e6b5, 'COMMANDER'); this.ai.hp = 100; this.ai.maxHp = 100; this.ai.lastShot = 0;
    this.enemies = [[1420, 920], [1570, 1370], [780, 1460]].map((pos, i) => { const enemy = this.makeUnit(pos[0], pos[1], 0xe45d5d, `RAIDER ${i + 1}`); enemy.hp = 55; enemy.maxHp = 55; enemy.lastShot = 0; enemy.hpBar = this.add.rectangle(pos[0] - 25, pos[1] - 23, 50, 5, 0xe45d5d).setOrigin(0, 0.5).setDepth(5); return enemy; });
    this.keys = this.input.keyboard.addKeys('W,A,S,D,UP,DOWN,LEFT,RIGHT,SPACE'); this.input.on('pointerdown', () => this.shootPlayer());
    this.crosshair = this.add.circle(0, 0, 10, 0xf4c95d, 0).setStrokeStyle(2, 0xf4c95d).setScrollFactor(0).setDepth(25);
    this.zone = this.add.circle(1100, 1100, 920, 0x3e9e94, 0.08).setStrokeStyle(5, 0x63e6b5, 0.8).setDepth(1);
    this.setupCamera(); this.setupHUD(); this.say('enemy_spotted');
  }
  buildWorld() {
    this.add.rectangle(0, 0, WORLD, WORLD, 0x213a35).setOrigin(0).setDepth(-5);
    for (let x = 80; x < WORLD; x += 180) for (let y = 80; y < WORLD; y += 180) this.add.circle(x, y, 3, 0x5a8871, 0.25).setDepth(-4);
    [[360, 370, 450, 70], [990, 500, 70, 360], [1450, 420, 450, 70], [350, 1100, 350, 70], [1240, 1530, 70, 370], [1580, 1680, 340, 70]].forEach(([x, y, w, h]) => { const wall = this.add.rectangle(x, y, w, h, 0x293f43).setOrigin(0).setStrokeStyle(2, 0x3f6261).setDepth(0); this.walls.push({ x, y, width: w, height: h, display: wall }); });
    [[640, 740], [820, 720], [1480, 1100], [1750, 560], [530, 1590]].forEach(([x, y]) => { this.add.circle(x, y, 34, 0x8a9b62).setDepth(0); this.add.circle(x, y, 24, 0x58744e).setDepth(0); });
    [[510, 510], [1690, 760], [410, 1350], [1740, 1530]].forEach(([x, y]) => { this.add.rectangle(x, y, 40, 40, 0xb48352).setStrokeStyle(2, 0xd2aa67).setDepth(0); label(this, x - 19, y - 6, '▣', 18, '#e9c17b').setDepth(0); });
  }
  makeUnit(x, y, color, name) { const unit = this.add.rectangle(x, y, 26, 26, color).setStrokeStyle(2, 0xffffff, 0.7).setDepth(4); unit.unitName = name; unit.nameTag = label(this, x - 34, y + 21, name, 10, color).setDepth(5); return unit; }
  setupCamera() { this.cameras.main.setBounds(0, 0, WORLD, WORLD); this.cameras.main.startFollow(this.player, true, 0.08, 0.08); this.cameras.main.setZoom(1.05); }
  setupHUD() {
    this.hud = this.add.container(0, 0).setScrollFactor(0).setDepth(20); this.hud.add(this.add.rectangle(0, 0, W, 88, 0x071016, 0.94).setOrigin(0));
    this.hud.add(label(this, 30, 19, 'VIKENDI  //  SQUAD RAID', 19)); this.hud.add(label(this, 30, 51, `SYNC: ${this.sync.tier.toUpperCase()}  |  ${this.sync.aggressionLevel.toUpperCase()}  |  AIM ${Math.round(this.sync.aimAccuracy * 100)}%`, 12, '#63e6b5'));
    this.hud.add(label(this, 870, 20, 'ALIVE  4', 14, '#eaf4ff')); this.killText = label(this, 870, 49, 'KILLS  0', 13, '#f4c95d'); this.hud.add(this.killText);
    this.feed = label(this, 910, 106, '', 12, '#f4c95d').setWordWrapWidth(320); this.hud.add(this.feed);
    this.bubble = label(this, 450, 630, '', 14, '#071016').setBackgroundColor('#63e6b5').setPadding(12, 8).setWordWrapWidth(500); this.hud.add(this.bubble);
    this.hud.add(label(this, 30, 674, 'WASD / ARROWS MOVE     AIM + CLICK / SPACE FIRE', 12, '#91afba'));
    this.playerBar = this.add.rectangle(210, 658, 190, 12, 0x54a8ff).setOrigin(0).setScrollFactor(0).setDepth(21); this.aiBar = this.add.rectangle(570, 658, 190, 12, 0x63e6b5).setOrigin(0).setScrollFactor(0).setDepth(21); this.hud.add(label(this, 120, 657, 'YOU', 12, '#8bc8ff')); this.hud.add(label(this, 485, 657, 'AI', 12, '#63e6b5'));
  }
  say(eventType) { this.bubble.setText('COMMANDER ...'); this.feed.setText(`> AI thinking...\n${this.feed.text}`.split('\n').slice(0, 6).join('\n')); requestCallout(eventType, this.sync.tier).then((line) => { if (!this.over) { this.bubble.setText(line); this.feed.setText(`> ${line}\n${this.feed.text}`.split('\n').slice(0, 6).join('\n')); } }); }
  update(_time, delta) {
    if (this.over) return; this.clock += delta;
    this.crosshair.setPosition(this.input.activePointer.x, this.input.activePointer.y);
    this.movePlayer(delta); this.updateAI(delta); this.updateEnemies(delta); this.updateHUD();
    if (this.clock > 9000 && !this.downed && !this.revived) this.downPlayer();
    if (this.downed && !this.revived && this.clock > 12500) this.revivePlayer();
    if (this.clock > 26000 && this.enemies.some((enemy) => enemy.active)) this.say('zone_warning');
    if (this.keys.SPACE.isDown) this.shootPlayer();
  }
  canOccupy(unit, x, y) { const half = 14; return !this.walls.some((wall) => x + half > wall.x && x - half < wall.x + wall.width && y + half > wall.y && y - half < wall.y + wall.height); }
  movePlayer(delta) { if (this.downed) return; const speed = 220 * delta / 1000; let dx = 0; let dy = 0; if (this.keys.A.isDown || this.keys.LEFT.isDown) dx--; if (this.keys.D.isDown || this.keys.RIGHT.isDown) dx++; if (this.keys.W.isDown || this.keys.UP.isDown) dy--; if (this.keys.S.isDown || this.keys.DOWN.isDown) dy++; if (dx || dy) { const length = Math.hypot(dx, dy); const nextX = this.player.x + dx / length * speed; const nextY = this.player.y + dy / length * speed; if (this.canOccupy(this.player, nextX, this.player.y)) this.player.x = nextX; if (this.canOccupy(this.player, this.player.x, nextY)) this.player.y = nextY; } this.player.x = Phaser.Math.Clamp(this.player.x, 35, WORLD - 35); this.player.y = Phaser.Math.Clamp(this.player.y, 110, WORLD - 35); this.player.nameTag.setPosition(this.player.x - 34, this.player.y + 21); }
  updateAI(delta) { const target = this.downed ? this.player : (this.enemies.find((enemy) => enemy.active) || this.player); const followX = this.downed ? target.x : this.player.x - this.sync.followDistance; const followY = this.downed ? target.y : this.player.y + 48; this.moveUnit(this.ai, { x: followX, y: followY }, this.downed ? 290 : (this.sync.aggressionLevel === 'aggressive' ? 250 : 155), delta); const enemy = this.enemies.find((item) => item.active); if (enemy && this.clock - this.ai.lastShot > this.sync.reactionDelayMs && Phaser.Math.Distance.Between(this.ai.x, this.ai.y, enemy.x, enemy.y) < 620) { this.ai.lastShot = this.clock; if (Math.random() < this.sync.aimAccuracy) this.hitEnemy(enemy, 18, this.ai); } this.ai.nameTag.setPosition(this.ai.x - 45, this.ai.y + 21); }
  updateEnemies(delta) { this.enemies.forEach((enemy) => { if (!enemy.active) return; const target = this.downed ? this.ai : this.player; if (Phaser.Math.Distance.Between(enemy.x, enemy.y, target.x, target.y) < 700) { this.moveUnit(enemy, target, 42, delta); if (this.clock - enemy.lastShot > 1500) { enemy.lastShot = this.clock; if (!this.downed) { this.player.hp -= 8; if (this.player.hp <= 0) this.downPlayer(); } else { this.ai.hp -= 3; } } enemy.nameTag.setPosition(enemy.x - 35, enemy.y + 20); enemy.hpBar.setPosition(enemy.x - 25, enemy.y - 23); enemy.hpBar.width = 50 * Math.max(enemy.hp, 0) / enemy.maxHp; } }); }
  moveUnit(unit, target, speed, delta) { const angle = Phaser.Math.Angle.Between(unit.x, unit.y, target.x, target.y); const nextX = unit.x + Math.cos(angle) * speed * delta / 1000; const nextY = unit.y + Math.sin(angle) * speed * delta / 1000; if (this.canOccupy(unit, nextX, unit.y)) unit.x = nextX; if (this.canOccupy(unit, unit.x, nextY)) unit.y = nextY; }
  shootPlayer() { if (this.downed || this.clock - this.player.lastShot < 260) return; const pointer = this.input.activePointer; const worldPoint = this.cameras.main.getWorldPoint(pointer.x, pointer.y); const nearby = this.enemies.filter((enemy) => enemy.active && Phaser.Math.Distance.Between(this.player.x, this.player.y, enemy.x, enemy.y) < 900); const aimed = nearby.sort((a, b) => this.aimDistance(a, worldPoint.x, worldPoint.y) - this.aimDistance(b, worldPoint.x, worldPoint.y))[0]; const target = aimed && this.aimDistance(aimed, worldPoint.x, worldPoint.y) < 110 ? aimed : nearby.sort((a, b) => Phaser.Math.Distance.Between(this.player.x, this.player.y, a.x, a.y) - Phaser.Math.Distance.Between(this.player.x, this.player.y, b.x, b.y))[0]; if (!target) return; this.player.lastShot = this.clock; this.hitEnemy(target, 22, this.player); }
  aimDistance(enemy, x, y) { const dx = enemy.x - this.player.x; const dy = enemy.y - this.player.y; const length = Math.hypot(dx, dy) || 1; const projection = Phaser.Math.Clamp(((x - this.player.x) * dx + (y - this.player.y) * dy) / (length * length), 0, 1); return Phaser.Math.Distance.Between(enemy.x, enemy.y, this.player.x + dx * projection, this.player.y + dy * projection); }
  hitEnemy(enemy, damage, source) { const tracer = this.add.line(0, 0, source.x, source.y, enemy.x, enemy.y, source === this.player ? 0xf4c95d : 0x63e6b5).setLineWidth(3).setDepth(3); this.tweens.add({ targets: tracer, alpha: 0, duration: 180, onComplete: () => tracer.destroy() }); enemy.hp -= damage; if (enemy.hp <= 0) { enemy.setActive(false).setVisible(false); enemy.nameTag.setVisible(false); enemy.hpBar.setVisible(false); this.kills++; this.killText.setText(`KILLS  ${this.kills}`); this.say('enemy_killed'); if (!this.enemies.some((item) => item.active) && this.revived) this.finish(true); } }
  downPlayer() { this.downed = true; this.player.hp = 1; this.player.setFillStyle(0x8799a3); this.say('player_downed'); }
  revivePlayer() { this.revived = true; this.downed = false; this.player.hp = 70; this.player.setFillStyle(0x54a8ff); this.feed.setText('> REVIVE COMPLETE // CLUTCH\n' + this.feed.text); this.say('enemy_spotted'); }
  updateHUD() { this.playerBar.width = 190 * Math.max(this.player.hp, 0) / 100; this.aiBar.width = 190 * Math.max(this.ai.hp, 0) / 100; }
  finish(won) { this.over = true; this.add.rectangle(300, 220, 680, 250, 0x071016, 0.97).setScrollFactor(0).setDepth(30); label(this, 485, 270, won ? 'SQUAD WIN' : 'SQUAD LOST', 38, won ? '#63e6b5' : '#e45d5d').setScrollFactor(0).setDepth(31); label(this, 440, 330, won ? 'All hostiles cleared after the clutch revive.' : 'The squad was eliminated.', 14).setScrollFactor(0).setDepth(31); const button = this.add.rectangle(500, 380, 260, 48, 0x20a47e).setScrollFactor(0).setDepth(31).setInteractive({ useHandCursor: true }); label(this, 548, 396, 'RUN IT BACK', 14).setScrollFactor(0).setDepth(32); button.on('pointerdown', () => this.scene.start('ProfileScene')); }
}

new Phaser.Game({ type: Phaser.AUTO, parent: 'game', backgroundColor: '#081018', scale: { mode: Phaser.Scale.FIT, autoCenter: Phaser.Scale.CENTER_BOTH, width: W, height: H }, scene: [LobbyScene, ProfileScene, BriefingScene, GameScene] });