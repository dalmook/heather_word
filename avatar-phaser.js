/* Heather Word Phaser dress room renderer - CDN friendly, no bundler required. */
(function () {
  "use strict";

  const GAME_WIDTH = 360;
  const GAME_HEIGHT = 460;
  const LAYERS = ["background", "effect", "body", "face", "hair", "top", "bottom", "outfit", "shoes", "accessory"];

  class AvatarDressScene extends Phaser.Scene {
    constructor() {
      super("AvatarDressScene");
      this.currentAvatar = {};
      this.parts = [];
      this.lastSignature = "";
      this.palette = {};
    }

    init(data) {
      this.currentAvatar = data.avatar || {};
      this.parts = data.parts || [];
      this.palette = data.palette || {};
    }

    create() {
      this.stage = this.add.container(0, 0);
      this.sparkles = this.add.container(0, 0);
      this.drawAvatar(false);
      this.scale.on("resize", () => this.drawAvatar(false));
    }

    updateAvatar(avatar, parts, options) {
      const nextSignature = JSON.stringify({ avatar, parts: (parts || []).map((part) => part.id) });
      const changed = nextSignature !== this.lastSignature;
      this.currentAvatar = avatar || {};
      this.parts = parts || this.parts || [];
      this.drawAvatar(Boolean(changed && options?.sparkle !== false));
      this.lastSignature = nextSignature;
    }

    celebrateSave() {
      this.burst(180, 250, 20, 0xfff176);
      this.burst(180, 340, 14, 0xf9a8d4);
    }

    drawAvatar(withSparkle) {
      if (!this.stage) return;
      this.stage.removeAll(true);

      const selected = this.resolveSelectedParts();
      this.drawBackground(selected.background);
      this.drawEffect(selected.effect);
      this.drawBody(selected.body);
      this.drawShoes(selected.shoes);
      this.drawBottom(selected.bottom);
      this.drawTop(selected.top, selected.outfit);
      this.drawHair(selected.hair);
      this.drawFace(selected.face);
      this.drawAccessory(selected.accessory);

      if (withSparkle) this.burst(180, 210, 12, 0xffffff);
    }

    resolveSelectedParts() {
      const selected = {};
      for (const slot of LAYERS) {
        selected[slot] = this.findPart(this.currentAvatar?.[slot]);
      }
      if (selected.outfit) {
        selected.top = null;
        selected.bottom = null;
      }
      return selected;
    }

    findPart(id) {
      if (!id) return null;
      return this.parts.find((part) => part.id === id) || null;
    }

    color(part, fallback, key = "color") {
      const raw = part?.[key] || fallback;
      return Number.parseInt(String(raw).replace("#", ""), 16);
    }

    graphics() {
      return this.add.graphics({ x: 0, y: 0 });
    }

    drawBackground(part) {
      const g = this.graphics();
      const top = this.color(part, "#ffe4f2", "color");
      const bottom = this.color(part, "#dbeafe", "accent");
      g.fillGradientStyle(top, top, bottom, bottom, 1);
      g.fillRoundedRect(0, 0, GAME_WIDTH, GAME_HEIGHT, 26);
      g.fillStyle(0xffffff, 0.48);
      for (let x = 28; x < GAME_WIDTH; x += 56) {
        for (let y = 26; y < GAME_HEIGHT; y += 56) g.fillCircle(x, y, 3);
      }
      g.fillStyle(0xffffff, 0.56);
      g.fillRoundedRect(28, 44, 74, 92, 20);
      g.fillRoundedRect(252, 58, 78, 52, 18);
      g.fillStyle(0xfff3c7, 0.85);
      g.fillEllipse(180, 410, 292, 76);
      this.stage.add(g);
    }

    drawBody(part) {
      const skin = this.color(part, "#ffd7b5");
      const blush = this.color(part, "#fb7185", "accent");
      const g = this.graphics();
      g.fillStyle(skin, 1);
      g.fillEllipse(180, 126, 100, 112);
      g.fillRoundedRect(158, 176, 44, 38, 16);
      g.fillRoundedRect(132, 205, 96, 126, 36);
      g.fillRoundedRect(98, 218, 38, 112, 19);
      g.fillRoundedRect(224, 218, 38, 112, 19);
      g.fillRoundedRect(142, 318, 34, 78, 17);
      g.fillRoundedRect(184, 318, 34, 78, 17);
      g.fillStyle(blush, 0.32);
      g.fillCircle(144, 142, 9);
      g.fillCircle(216, 142, 9);
      this.stage.add(g);
    }

    drawFace(part) {
      const g = this.graphics();
      const eye = this.color(part, "#1f2937");
      g.fillStyle(eye, 1);
      if (part?.variant === "wink") {
        g.fillCircle(158, 126, 6);
        g.lineStyle(4, eye, 1).beginPath().moveTo(202, 126).lineTo(218, 122).strokePath();
      } else if (part?.variant === "sparkle") {
        this.star(g, 158, 126, 9, 0x6366f1);
        this.star(g, 208, 126, 9, 0x6366f1);
      } else {
        g.fillCircle(158, 126, 6);
        g.fillCircle(208, 126, 6);
      }
      g.lineStyle(4, 0xd94673, 1).beginPath().arc(183, 150, 17, 0.12, Math.PI - 0.12).strokePath();
      this.stage.add(g);
    }

    drawHair(part) {
      const hair = this.color(part, "#6b3f22");
      const accent = this.color(part, "#f9a8d4", "accent");
      const g = this.graphics();
      g.fillStyle(hair, 1);
      g.fillEllipse(180, 84, 116, 54);
      g.fillRoundedRect(122, 92, 30, 104, 18);
      g.fillRoundedRect(210, 92, 30, 104, 18);
      g.fillTriangle(136, 98, 182, 72, 224, 98);
      if (part?.variant === "twintail" || part?.variant === "ponytail") {
        g.fillCircle(108, 150, 28);
        g.fillCircle(252, 150, 28);
        g.fillStyle(accent, 1);
        g.fillCircle(116, 108, 8);
        g.fillCircle(244, 108, 8);
      }
      if (part?.variant === "long") {
        g.fillStyle(hair, 0.96);
        g.fillRoundedRect(122, 170, 116, 74, 26);
      }
      this.stage.add(g);
    }

    drawTop(top, outfit) {
      const part = outfit || top;
      const fill = this.color(part, "#60a5fa");
      const accent = this.color(part, "#fef08a", "accent");
      const g = this.graphics();
      g.fillStyle(fill, 1);
      g.fillRoundedRect(124, 196, 112, outfit ? 130 : 92, 26);
      g.fillRoundedRect(96, 210, 48, 68, 22);
      g.fillRoundedRect(216, 210, 48, 68, 22);
      g.fillStyle(0xffffff, 0.62);
      g.fillTriangle(158, 198, 202, 198, 180, 230);
      g.fillStyle(accent, 0.86);
      if (outfit) {
        g.fillTriangle(126, 312, 234, 312, 258, 382);
        g.fillTriangle(126, 312, 180, 372, 102, 382);
      } else {
        g.fillCircle(180, 248, 11);
      }
      this.stage.add(g);
    }

    drawBottom(part) {
      if (!part) return;
      const g = this.graphics();
      g.fillStyle(this.color(part, "#8b5cf6"), 1);
      g.fillRoundedRect(134, 292, 42, 70, 12);
      g.fillRoundedRect(184, 292, 42, 70, 12);
      this.stage.add(g);
    }

    drawShoes(part) {
      const g = this.graphics();
      g.fillStyle(this.color(part, "#7c2d12"), 1);
      g.fillRoundedRect(126, 386, 56, 22, 11);
      g.fillRoundedRect(178, 386, 56, 22, 11);
      this.stage.add(g);
    }

    drawAccessory(part) {
      if (!part) return;
      const g = this.graphics();
      const fill = this.color(part, "#f472b6");
      g.fillStyle(fill, 1);
      if (part.variant === "glasses") {
        g.lineStyle(5, fill, 1);
        g.strokeCircle(156, 150, 16);
        g.strokeCircle(208, 150, 16);
        g.lineBetween(172, 150, 192, 150);
      } else if (part.variant === "wings") {
        g.fillStyle(0xffffff, 0.8);
        g.fillEllipse(96, 246, 76, 116);
        g.fillEllipse(264, 246, 76, 116);
      } else if (part.variant === "magic") {
        g.lineStyle(7, fill, 1).lineBetween(254, 270, 302, 202);
        this.star(g, 306, 196, 16, 0xfef08a);
      } else {
        this.star(g, 180, 84, 24, fill);
      }
      this.stage.add(g);
    }

    drawEffect(part) {
      if (!part) return;
      const g = this.graphics();
      const fill = this.color(part, "#fde047");
      for (let i = 0; i < 8; i += 1) {
        const angle = (Math.PI * 2 * i) / 8;
        this.star(g, 180 + Math.cos(angle) * 118, 206 + Math.sin(angle) * 132, 8, fill, 0.72);
      }
      this.stage.add(g);
    }

    star(g, x, y, radius, color, alpha = 1) {
      const points = [];
      for (let i = 0; i < 10; i += 1) {
        const angle = -Math.PI / 2 + (i * Math.PI) / 5;
        const r = i % 2 === 0 ? radius : radius * 0.45;
        points.push(new Phaser.Geom.Point(x + Math.cos(angle) * r, y + Math.sin(angle) * r));
      }
      g.fillStyle(color, alpha).fillPoints(points, true);
    }

    burst(x, y, count, color) {
      if (!this.sparkles) return;
      for (let i = 0; i < count; i += 1) {
        const star = this.add.star(x, y, 5, 4, 10, color, 0.9);
        this.sparkles.add(star);
        const angle = (Math.PI * 2 * i) / count;
        this.tweens.add({
          targets: star,
          x: x + Math.cos(angle) * Phaser.Math.Between(50, 155),
          y: y + Math.sin(angle) * Phaser.Math.Between(35, 140),
          alpha: 0,
          scale: 0.25,
          duration: 760,
          ease: "Cubic.easeOut",
          onComplete: () => star.destroy()
        });
      }
    }
  }

  function mountAvatarGame(options) {
    const mount = options?.mount;
    if (!mount || !window.Phaser) return null;
    mount.innerHTML = "";
    const config = {
      type: Phaser.CANVAS,
      parent: mount,
      width: GAME_WIDTH,
      height: GAME_HEIGHT,
      backgroundColor: "#fff7fb",
      transparent: false,
      scale: { mode: Phaser.Scale.FIT, autoCenter: Phaser.Scale.CENTER_BOTH, width: GAME_WIDTH, height: GAME_HEIGHT },
      render: { preserveDrawingBuffer: true, antialias: true },
      scene: AvatarDressScene,
      callbacks: {
        postBoot(game) {
          game.scene.start("AvatarDressScene", {
            avatar: options.avatar || {},
            parts: options.parts || [],
            palette: options.palette || {}
          });
        }
      }
    };
    const game = new Phaser.Game(config);
    return {
      game,
      update(avatar, parts, updateOptions) {
        const scene = game.scene.getScene("AvatarDressScene");
        if (scene?.updateAvatar) scene.updateAvatar(avatar, parts, updateOptions || {});
      },
      celebrateSave() {
        const scene = game.scene.getScene("AvatarDressScene");
        if (scene?.celebrateSave) scene.celebrateSave();
      },
      download(filename) {
        const canvas = game.canvas;
        if (!canvas) return false;
        const link = document.createElement("a");
        link.download = filename || "heather-avatar.png";
        link.href = canvas.toDataURL("image/png");
        link.click();
        return true;
      },
      destroy() { game.destroy(true); }
    };
  }

  window.HeatherAvatarPhaser = { mount: mountAvatarGame };
}());
