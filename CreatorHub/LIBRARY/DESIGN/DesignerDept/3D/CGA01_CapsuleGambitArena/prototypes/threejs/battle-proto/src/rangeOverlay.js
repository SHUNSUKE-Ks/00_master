// rangeOverlay.js — 移動範囲(青)/攻撃範囲(橙)のタイルハイライト。
// 流用元 GAME/BattleEngine/.../src/ui/rangeOverlay.js の薄板方式・配色を踏襲（コードは新規）。
import * as THREE from "three";

const COLORS = { move: 0x9ccdff, attack: 0xffb86c };

export class RangeOverlay {
  /** @param {THREE.Scene} scene @param {(x,y,h)=>THREE.Vector3} worldPos */
  constructor(scene, worldPos) {
    this.worldPos = worldPos;
    this.group = new THREE.Group();
    this.group.name = "RangeOverlay";
    scene.add(this.group);
    this.geom = new THREE.PlaneGeometry(0.95, 0.95);
    this.matMove = new THREE.MeshBasicMaterial({ color: COLORS.move, transparent: true, opacity: 0.35, depthWrite: false });
    this.matAttack = new THREE.MeshBasicMaterial({ color: COLORS.attack, transparent: true, opacity: 0.30, depthWrite: false });
  }

  clear() {
    while (this.group.children.length) this.group.remove(this.group.children[0]);
  }

  _plane(x, y, mat) {
    const m = new THREE.Mesh(this.geom, mat);
    m.rotation.x = -Math.PI / 2;
    const p = this.worldPos(x, y, 0.07);
    m.position.copy(p);
    this.group.add(m);
  }

  /** moveKeys/attackKeys は "x,y" 文字列のSet。攻撃だけのマスは橙、移動マスは青（移動優先） */
  show(moveKeys, attackKeys) {
    this.clear();
    for (const k of attackKeys) {
      if (moveKeys.has(k)) continue;
      const [x, y] = k.split(",").map(Number);
      this._plane(x, y, this.matAttack);
    }
    for (const k of moveKeys) {
      const [x, y] = k.split(",").map(Number);
      this._plane(x, y, this.matMove);
    }
  }
}
