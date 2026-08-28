import Phaser from 'phaser';
import './style.css';

class MenuScene extends Phaser.Scene {
  constructor() {
    super('MenuScene');
  }

  create() {
    this.cameras.main.setBackgroundColor('#09121e');
    this.add.text(48, 46, 'AI SQUAD COMMANDER', { fontFamily: 'monospace', fontSize: '32px', color: '#eaf4ff' });
    this.add.text(50, 94, 'A tactical prototype for adaptive teamwork', { fontFamily: 'monospace', fontSize: '14px', color: '#6f8ca8' });
    const button = this.add.rectangle(50, 166, 300, 58, 0x1c8c73).setOrigin(0, 0).setInteractive({ useHandCursor: true });
    this.add.text(74, 184, 'SELECT RAID PROFILE  >', { fontFamily: 'monospace', fontSize: '16px', color: '#ffffff' });
    button.on('pointerdown', () => this.scene.start('SkillSelectScene'));
  }
}

class SkillSelectScene extends Phaser.Scene {
  constructor() {
    super('SkillSelectScene');
  }

  create() {
    this.cameras.main.setBackgroundColor('#09121e');
    this.add.text(48, 42, 'CHOOSE YOUR RAID PROFILE', { fontFamily: 'monospace', fontSize: '24px', color: '#eaf4ff' });
    ['BEGINNER', 'INTERMEDIATE', 'PRO'].forEach((label, index) => {
      const x = 48 + index * 230;
      const card = this.add.rectangle(x, 110, 200, 150, 0x122336).setOrigin(0, 0).setInteractive({ useHandCursor: true });
      this.add.text(x + 20, 132, label, { fontFamily: 'monospace', fontSize: '18px', color: '#70e6c1' });
      this.add.text(x + 20, 174, 'MOCK RAID STATS', { fontFamily: 'monospace', fontSize: '11px', color: '#6f8ca8' });
      this.add.text(x + 20, 198, ['K/D 0.7', 'K/D 1.8', 'K/D 3.4'][index], { fontFamily: 'monospace', fontSize: '14px', color: '#ffffff' });
      card.on('pointerdown', () => this.scene.start('GameScene', { tier: label.toLowerCase() }));
    });
  }
}

class GameScene extends Phaser.Scene {
  constructor() {
    super('GameScene');
  }

  create() {
    this.cameras.main.setBackgroundColor('#0e1b2a');
    this.add.text(40, 28, 'RAID // TRAINING SECTOR', { fontFamily: 'monospace', fontSize: '18px', color: '#eaf4ff' });
    this.add.text(40, 56, 'Arrow keys / WASD to move', { fontFamily: 'monospace', fontSize: '12px', color: '#6f8ca8' });
    this.add.rectangle(40, 92, 820, 470, 0x14283a).setOrigin(0, 0);
    [
      [180, 190, 220, 22], [480, 250, 22, 180], [250, 420, 230, 22],
    ].forEach(([x, y, width, height]) => this.add.rectangle(x, y, width, height, 0x27465a).setOrigin(0, 0));
    this.player = this.add.rectangle(120, 140, 20, 20, 0x57a8ff).setOrigin(0.5).setDepth(2);
    this.add.text(104, 158, 'YOU', { fontFamily: 'monospace', fontSize: '10px', color: '#8bc8ff' });
    this.keys = this.input.keyboard.addKeys('W,A,S,D,UP,LEFT,DOWN,RIGHT');
  }

  update() {
    const speed = 3;
    if (this.keys.A.isDown || this.keys.LEFT.isDown) this.player.x -= speed;
    if (this.keys.D.isDown || this.keys.RIGHT.isDown) this.player.x += speed;
    if (this.keys.W.isDown || this.keys.UP.isDown) this.player.y -= speed;
    if (this.keys.S.isDown || this.keys.DOWN.isDown) this.player.y += speed;
    this.player.x = Phaser.Math.Clamp(this.player.x, 52, 848);
    this.player.y = Phaser.Math.Clamp(this.player.y, 104, 550);
  }
}

new Phaser.Game({
  type: Phaser.AUTO,
  parent: 'game',
  width: 900,
  height: 620,
  backgroundColor: '#09121e',
  scene: [MenuScene, SkillSelectScene, GameScene],
});