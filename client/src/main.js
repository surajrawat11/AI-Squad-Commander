import Phaser from 'phaser';
import './style.css';
import profiles from './data/mockPlayerProfiles.json';
import { buildSkillSync } from '../../server/services/skillSync.js';
import { requestBriefing, requestCallout } from './systems/CalloutClient.js';
import { createPlayer } from './entities/Player.js';
import { createAITeammate } from './entities/AITeammate.js';
import { createEnemy } from './entities/Enemy.js';
import { distance, fireAt, moveToward } from './systems/CombatSystem.js';
import { createHUD } from './ui/HUD.js';

const font = { fontFamily: 'monospace' };
class MenuScene extends Phaser.Scene {
  constructor() {
    super('MenuScene');
  }

  create() {
    this.cameras.main.setBackgroundColor('#09121e');
    this.add.text(48, 54, 'AI SQUAD', { ...font, fontSize: '56px', color: '#eaf4ff' });
    this.add.text(52, 116, 'COMMANDER', { ...font, fontSize: '56px', color: '#70e6c1' });
    this.add.text(54, 194, 'Your teammate learns how you play.', { ...font, fontSize: '16px', color: '#9ab3c7' });
    const button = this.add.rectangle(52, 260, 300, 58, 0x1c8c73).setOrigin(0, 0).setInteractive({ useHandCursor: true });
    this.add.text(76, 279, 'START RAID  >', { ...font, fontSize: '17px', color: '#fff' });
    button.on('pointerdown', () => this.scene.start('SkillSelectScene'));
  }
}

class SkillSelectScene extends Phaser.Scene {
  constructor() {
    super('SkillSelectScene');
  }

  create() {
    this.cameras.main.setBackgroundColor('#09121e');
    this.add.text(48, 38, 'PREVIOUS RAID ANALYSIS', { ...font, fontSize: '24px', color: '#eaf4ff' });
    this.add.text(48, 74, 'Choose the profile that matches your field history.', { ...font, fontSize: '13px', color: '#6f8ca8' });
    profiles.forEach((profile, index) => {
      const x = 48 + index * 274;
      const card = this.add.rectangle(x, 132, 242, 320, 0x122336).setOrigin(0, 0).setInteractive({ useHandCursor: true });
      this.add.text(x + 22, 158, profile.name.toUpperCase(), { ...font, fontSize: '20px', color: '#70e6c1' });
      this.add.text(x + 22, 198, `K/D       ${profile.kd_ratio}\nAVG DMG   ${profile.avg_damage}\nACCURACY  ${profile.accuracy}%\nSURVIVAL  ${Math.round(profile.survival_time / 60)}m\nREVIVES   ${profile.revive_count}`, { ...font, fontSize: '14px', color: '#eaf4ff', lineSpacing: 12 });
      this.add.text(x + 22, 354, profile.description, { ...font, fontSize: '11px', color: '#8ba7bc', wordWrap: { width: 190 } });
      card.on('pointerdown', () => this.scene.start('BriefingScene', { profile }));
    });
  }
}

class BriefingScene extends Phaser.Scene {
  constructor() { super('BriefingScene'); }
  create(data) {
    this.profile = data.profile; this.sync = buildSkillSync(this.profile);
    this.cameras.main.setBackgroundColor('#0e1b2a');
    this.add.text(54, 54, 'AI COMMANDER // INTEL BRIEFING', { ...font, fontSize: '24px', color: '#eaf4ff' });
    this.add.text(54, 105, `${this.profile.name.toUpperCase()} SYNC | SCORE ${this.sync.score} | ${this.sync.aggressionLevel.toUpperCase()} POSTURE`, { ...font, fontSize: '13px', color: '#70e6c1' });
    this.add.rectangle(54, 160, 790, 230, 0x122336).setOrigin(0, 0);
    this.add.text(84, 192, 'COMMANDER', { ...font, fontSize: '14px', color: '#70e6c1' });
    this.brief = this.add.text(84, 240, 'COMMANDER is consulting field intel...', { ...font, fontSize: '20px', color: '#eaf4ff', wordWrap: { width: 690 } });
    requestBriefing(this.sync.tier).then((text) => { this.brief.text = `"${text}"`; });
    const button = this.add.rectangle(54, 438, 280, 56, 0x1c8c73).setOrigin(0, 0).setInteractive({ useHandCursor: true });
    this.add.text(78, 456, 'DEPLOY TO SECTOR  >', { ...font, fontSize: '15px', color: '#fff' });
    button.on('pointerdown', () => this.scene.start('GameScene', { profile: this.profile, sync: this.sync }));
  }
}

class GameScene extends Phaser.Scene {
  constructor() {
    super('GameScene');
  }

  create(data) {
    this.cameras.main.setBackgroundColor('#0e1b2a');
    this.profile = data.profile; this.sync = data.sync; this.elapsed = 0; this.downed = false; this.revived = false;
    this.matchOver = false;
    this.cameras.main.setBackgroundColor('#0e1b2a');
    this.add.rectangle(40, 94, 820, 466, 0x14283a).setOrigin(0, 0);
    [[170, 170, 230, 24], [475, 235, 24, 190], [240, 420, 250, 24], [650, 150, 130, 24]].forEach(([x, y, w, h]) => this.add.rectangle(x, y, w, h, 0x29495c).setOrigin(0, 0));
    this.player = createPlayer(this, 105, 135); this.teammate = createAITeammate(this, 145, 135, this.sync);
    this.enemies = [createEnemy(this, 720, 180, 1), createEnemy(this, 740, 410, 2), createEnemy(this, 560, 510, 3)];
    this.hud = createHUD(this, this.sync.tier, this.sync); this.keys = this.input.keyboard.addKeys('W,A,S,D,SPACE,UP,LEFT,DOWN,RIGHT');
    this.callout('enemy_spotted');
  }

  update(_time, delta) {
    if (this.matchOver) return;
    const speed = 3.2;
    this.elapsed += delta;
    if (!this.downed) {
    if (this.keys.A.isDown || this.keys.LEFT.isDown) this.player.x -= speed;
    if (this.keys.D.isDown || this.keys.RIGHT.isDown) this.player.x += speed;
    if (this.keys.W.isDown || this.keys.UP.isDown) this.player.y -= speed;
    if (this.keys.S.isDown || this.keys.DOWN.isDown) this.player.y += speed;
    this.player.x = Phaser.Math.Clamp(this.player.x, 55, 845); this.player.y = Phaser.Math.Clamp(this.player.y, 108, 548);
    }
    if (this.elapsed > 10000 && !this.downed && !this.revived) this.downPlayer();
    if (this.downed && !this.revived && this.elapsed > 13500) this.revivePlayer();
    this.updateTeammate(delta); this.updateEnemies(delta); this.hud.updateBars(this.player, this.teammate);
    if ((this.keys.SPACE.isDown || this.input.activePointer.isDown) && !this.downed && this.elapsed - (this.player.lastShot || 0) > 300) this.playerShoot();
  }
  callout(eventType, state = {}) { this.hud.thinking(); this.hud.addFeed('> AI thinking...'); requestCallout(eventType, this.sync.tier, state).then((line) => { this.hud.say(line); this.hud.addFeed(`> ${line}`); }); }
  playerShoot() { const target = this.enemies.find((enemy) => enemy.active); if (!target) return; this.player.lastShot = this.elapsed; fireAt(this, this.player, target, 18, 0x8bc8ff); this.finishEnemy(target); }
  updateTeammate(delta) { if (this.downed) moveToward(this.teammate, this.player, 2.3, delta); else moveToward(this.teammate, { x: this.player.x - this.sync.followDistance, y: this.player.y }, this.sync.aggressionLevel === 'aggressive' ? 3.4 : 2.2, delta); const target = this.enemies.find((enemy) => enemy.active); if (target && this.elapsed - this.teammate.lastShot > this.sync.reactionDelayMs) { this.teammate.lastShot = this.elapsed; if (Math.random() < this.sync.aimAccuracy) { fireAt(this, this.teammate, target, 22, 0x70e6c1); this.finishEnemy(target); } } }
  updateEnemies(delta) { this.enemies.forEach((enemy) => { if (!enemy.active) return; const target = this.downed ? this.teammate : this.player; if (distance(enemy, target) < 390) { moveToward(enemy, target, 0.55, delta); if (this.elapsed - enemy.lastShot > 1400) { enemy.lastShot = this.elapsed; if (!this.downed) { this.player.hp -= 9; if (this.player.hp <= 0) this.downPlayer(); } else { this.teammate.hp -= 5; if (this.teammate.hp <= 0) this.endMatch(false); } } } }); }
  finishEnemy(enemy) { if (enemy.hp <= 0) { enemy.setActive(false).setVisible(false); this.callout('enemy_killed'); if (this.revived && this.enemies.every((item) => !item.active)) this.endMatch(true); } }
  downPlayer() { if (this.downed || this.revived) return; this.downed = true; this.player.hp = 1; this.player.setFillStyle(0x6f8ca8); this.callout('player_downed'); }
  revivePlayer() { if (!this.downed || this.revived) return; this.revived = true; this.downed = false; this.player.hp = 70; this.player.setFillStyle(0x55aaff); this.hud.addFeed('> REVIVE COMPLETE // CLUTCH'); this.callout('enemy_spotted', { direction: 'right', distance: 'close' }); }
  endMatch(won) { if (this.matchOver) return; this.matchOver = true; this.physics?.pause(); const title = won ? 'SECTOR CLEARED' : 'SQUAD LOST'; const color = won ? '#70e6c1' : '#ed7777'; this.add.rectangle(170, 190, 560, 220, 0x09121e, 0.96).setDepth(20); this.add.text(250, 230, title, { ...font, fontSize: '30px', color }).setDepth(21); this.add.text(254, 280, won ? 'Revive confirmed. All raiders eliminated.' : 'Commander went down. Try another profile.', { ...font, fontSize: '13px', color: '#eaf4ff' }).setDepth(21); const button = this.add.rectangle(320, 330, 260, 48, 0x1c8c73).setInteractive({ useHandCursor: true }).setDepth(21); this.add.text(370, 346, 'RESTART RAID', { ...font, fontSize: '14px', color: '#fff' }).setDepth(22); button.on('pointerdown', () => this.scene.start('SkillSelectScene')); }
}

new Phaser.Game({
  type: Phaser.AUTO,
  parent: 'game',
  width: 900,
  height: 620,
  backgroundColor: '#09121e',
  scene: [MenuScene, SkillSelectScene, BriefingScene, GameScene],
});