import * as THREE from 'three';
import { FLARE_RADIUS, LANTERN_SAFE_RADIUS } from '../core/constants';
import { GameState } from '../core/types';

interface LanternVisual {
  group: THREE.Group;
  coreMat: THREE.MeshStandardMaterial;
  light: THREE.PointLight;
  beam: THREE.Mesh;
  safeRing: THREE.Mesh;
}

interface ShadowVisual {
  group: THREE.Group;
  bodyMat: THREE.MeshStandardMaterial;
  ring: THREE.Mesh;
  ringMat: THREE.MeshBasicMaterial;
}

export class IslandScene3D {
  private readonly renderer: THREE.WebGLRenderer;
  private readonly scene: THREE.Scene;
  private readonly camera: THREE.PerspectiveCamera;
  private readonly worldGroup = new THREE.Group();

  private playerGroup = new THREE.Group();
  private playerLight!: THREE.PointLight;
  private playerCloakMat!: THREE.MeshStandardMaterial;
  private flareWaveMesh!: THREE.Mesh;
  private flareWaveMat!: THREE.MeshBasicMaterial;
  private fireflyMeshes = new Map<string, THREE.Mesh>();
  private lanternVisuals = new Map<string, LanternVisual>();
  private shadowVisuals = new Map<string, ShadowVisual>();
  private waterMesh!: THREE.Mesh;

  private builtLevelKey = '';
  private camPos = new THREE.Vector3(0, 14, 15);
  private camTarget = new THREE.Vector3(0, 0.8, 0);

  constructor(private readonly container: HTMLElement) {
    this.renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    this.renderer.setSize(container.clientWidth || window.innerWidth, container.clientHeight || window.innerHeight);
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.15;
    container.appendChild(this.renderer.domElement);

    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x070b14);
    this.scene.fog = new THREE.FogExp2(0x070b14, 0.022);

    const aspect = (container.clientWidth || window.innerWidth) / (container.clientHeight || window.innerHeight);
    this.camera = new THREE.PerspectiveCamera(52, aspect, 0.1, 180);
    this.camera.position.copy(this.camPos);

    const hemi = new THREE.HemisphereLight(0x5b7bb2, 0x131b2b, 0.8);
    this.scene.add(hemi);

    const moon = new THREE.DirectionalLight(0x9bb8e8, 0.65);
    moon.position.set(18, 28, 12);
    moon.castShadow = true;
    moon.shadow.mapSize.set(1024, 1024);
    moon.shadow.camera.near = 2;
    moon.shadow.camera.far = 85;
    const d = 32;
    moon.shadow.camera.left = -d;
    moon.shadow.camera.right = d;
    moon.shadow.camera.top = d;
    moon.shadow.camera.bottom = -d;
    this.scene.add(moon);

    this.scene.add(this.worldGroup);
    window.addEventListener('resize', this.handleResize);
  }

  private handleResize = (): void => {
    const w = this.container.clientWidth || window.innerWidth;
    const h = this.container.clientHeight || window.innerHeight;
    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(w, h);
  };

  private clearWorld(): void {
    this.fireflyMeshes.clear();
    this.lanternVisuals.clear();
    this.shadowVisuals.clear();
    while (this.worldGroup.children.length > 0) {
      const child = this.worldGroup.children[0];
      this.worldGroup.remove(child);
    }
  }

  private buildLevel(state: GameState): void {
    this.clearWorld();
    this.builtLevelKey = `${state.levelId}:${state.islandRadius}`;

    // Surrounding dark sea
    const waterGeo = new THREE.CircleGeometry(150, 64);
    const waterMat = new THREE.MeshStandardMaterial({
      color: 0x06101f,
      roughness: 0.25,
      metalness: 0.65,
    });
    this.waterMesh = new THREE.Mesh(waterGeo, waterMat);
    this.waterMesh.rotation.x = -Math.PI / 2;
    this.waterMesh.position.y = -0.8;
    this.worldGroup.add(this.waterMesh);

    // Island platform
    const islandGeo = new THREE.CylinderGeometry(state.islandRadius, state.islandRadius + 1.2, 1.4, 64);
    const islandMat = new THREE.MeshStandardMaterial({
      color: 0x1b2638,
      roughness: 0.9,
      metalness: 0.08,
    });
    const island = new THREE.Mesh(islandGeo, islandMat);
    island.position.y = -0.7;
    island.receiveShadow = true;
    this.worldGroup.add(island);

    // Stone shoreline ring
    const rimGeo = new THREE.TorusGeometry(state.islandRadius, 0.35, 10, 72);
    const rimMat = new THREE.MeshStandardMaterial({ color: 0x35445c, roughness: 0.85 });
    const rim = new THREE.Mesh(rimGeo, rimMat);
    rim.rotation.x = Math.PI / 2;
    rim.position.y = 0.02;
    this.worldGroup.add(rim);

    // Subtle stone plaza & axial paths
    const plazaGeo = new THREE.CircleGeometry(3.2, 32);
    const plazaMat = new THREE.MeshStandardMaterial({ color: 0x26344a, roughness: 0.95 });
    const plaza = new THREE.Mesh(plazaGeo, plazaMat);
    plaza.rotation.x = -Math.PI / 2;
    plaza.position.y = 0.01;
    plaza.receiveShadow = true;
    this.worldGroup.add(plaza);

    // Rock obstacles
    const rockMat = new THREE.MeshStandardMaterial({ color: 0x3e4b5e, roughness: 0.92, flatShading: true });
    for (const obs of state.obstacles) {
      const rockGeo = new THREE.DodecahedronGeometry(obs.radius, 1);
      const rock = new THREE.Mesh(rockGeo, rockMat);
      rock.position.set(obs.x, obs.radius * 0.45, obs.z);
      rock.scale.set(1, 0.72, 1);
      rock.castShadow = true;
      rock.receiveShadow = true;
      this.worldGroup.add(rock);
    }

    // Fireflies
    const fireflyGeo = new THREE.SphereGeometry(0.24, 14, 14);
    for (const f of state.fireflies) {
      const mat = new THREE.MeshBasicMaterial({ color: 0xffe066 });
      const mesh = new THREE.Mesh(fireflyGeo, mat);
      mesh.position.set(f.x, 0.85, f.z);
      this.worldGroup.add(mesh);
      this.fireflyMeshes.set(f.id, mesh);
    }

    // Great Lanterns
    const pillarMat = new THREE.MeshStandardMaterial({ color: 0x4b586e, roughness: 0.85 });
    const roofMat = new THREE.MeshStandardMaterial({ color: 0x293344, roughness: 0.7 });
    for (const l of state.lanterns) {
      const group = new THREE.Group();
      group.position.set(l.x, 0, l.z);

      const base = new THREE.Mesh(new THREE.CylinderGeometry(0.7, 0.95, 0.5, 8), pillarMat);
      base.position.y = 0.25;
      base.castShadow = true;
      group.add(base);

      const post = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.28, 1.9, 8), pillarMat);
      post.position.y = 1.45;
      post.castShadow = true;
      group.add(post);

      const coreMat = new THREE.MeshStandardMaterial({
        color: 0x2c3648,
        emissive: 0xffaa33,
        emissiveIntensity: 0,
        roughness: 0.3,
      });
      const core = new THREE.Mesh(new THREE.OctahedronGeometry(0.45, 0), coreMat);
      core.position.y = 2.65;
      group.add(core);

      const roof = new THREE.Mesh(new THREE.ConeGeometry(0.85, 0.55, 8), roofMat);
      roof.position.y = 3.25;
      roof.castShadow = true;
      group.add(roof);

      const light = new THREE.PointLight(0xffb84d, 0, 15, 1.6);
      light.position.set(0, 2.8, 0);
      group.add(light);

      const beam = new THREE.Mesh(
        new THREE.CylinderGeometry(0.45, 1.1, 11, 16, 1, true),
        new THREE.MeshBasicMaterial({
          color: 0xffcf70,
          transparent: true,
          opacity: 0.14,
          side: THREE.DoubleSide,
          depthWrite: false,
        })
      );
      beam.position.y = 6.2;
      beam.visible = false;
      group.add(beam);

      const safeRing = new THREE.Mesh(
        new THREE.RingGeometry(LANTERN_SAFE_RADIUS - 0.12, LANTERN_SAFE_RADIUS, 48),
        new THREE.MeshBasicMaterial({
          color: 0xffd166,
          transparent: true,
          opacity: 0.32,
          side: THREE.DoubleSide,
        })
      );
      safeRing.rotation.x = -Math.PI / 2;
      safeRing.position.y = 0.03;
      safeRing.visible = false;
      group.add(safeRing);

      this.worldGroup.add(group);
      this.lanternVisuals.set(l.id, { group, coreMat, light, beam, safeRing });
    }

    // Ink Shadows
    for (const s of state.shadows) {
      const group = new THREE.Group();
      group.position.set(s.x, 0.85, s.z);

      const bodyMat = new THREE.MeshStandardMaterial({
        color: 0x120c1d,
        emissive: 0x45126e,
        emissiveIntensity: 0.65,
        roughness: 0.4,
      });
      const body = new THREE.Mesh(new THREE.IcosahedronGeometry(0.62, 1), bodyMat);
      body.castShadow = true;
      group.add(body);

      const eyeMat = new THREE.MeshBasicMaterial({ color: 0xff4d6d });
      const leftEye = new THREE.Mesh(new THREE.SphereGeometry(0.09, 8, 8), eyeMat);
      leftEye.position.set(-0.2, 0.15, 0.52);
      const rightEye = new THREE.Mesh(new THREE.SphereGeometry(0.09, 8, 8), eyeMat);
      rightEye.position.set(0.2, 0.15, 0.52);
      group.add(leftEye, rightEye);

      const ringMat = new THREE.MeshBasicMaterial({
        color: 0x7b2cbf,
        transparent: true,
        opacity: 0.45,
        side: THREE.DoubleSide,
      });
      const ring = new THREE.Mesh(new THREE.RingGeometry(0.82, 1.05, 24), ringMat);
      ring.rotation.x = -Math.PI / 2;
      ring.position.y = -0.78;
      group.add(ring);

      this.worldGroup.add(group);
      this.shadowVisuals.set(s.id, { group, bodyMat, ring, ringMat });
    }

    // Light Flare expanding wave ring
    this.flareWaveMat = new THREE.MeshBasicMaterial({
      color: 0xffe066,
      transparent: true,
      opacity: 0,
      side: THREE.DoubleSide,
    });
    this.flareWaveMesh = new THREE.Mesh(new THREE.RingGeometry(0.85, 1.0, 48), this.flareWaveMat);
    this.flareWaveMesh.rotation.x = -Math.PI / 2;
    this.flareWaveMesh.position.y = 0.08;
    this.flareWaveMesh.visible = false;
    this.worldGroup.add(this.flareWaveMesh);

    // Mây (Player)
    this.playerGroup = new THREE.Group();
    this.playerCloakMat = new THREE.MeshStandardMaterial({ color: 0x2d6a8e, roughness: 0.7 });
    const cloak = new THREE.Mesh(new THREE.ConeGeometry(0.48, 1.15, 14), this.playerCloakMat);
    cloak.position.y = 0.58;
    cloak.castShadow = true;
    this.playerGroup.add(cloak);

    const head = new THREE.Mesh(
      new THREE.SphereGeometry(0.26, 14, 14),
      new THREE.MeshStandardMaterial({ color: 0xf4d8be, roughness: 0.6 })
    );
    head.position.y = 1.32;
    head.castShadow = true;
    this.playerGroup.add(head);

    const hat = new THREE.Mesh(
      new THREE.ConeGeometry(0.46, 0.34, 16),
      new THREE.MeshStandardMaterial({ color: 0xd9a05b, roughness: 0.75 })
    );
    hat.position.y = 1.56;
    hat.castShadow = true;
    this.playerGroup.add(hat);

    const staff = new THREE.Mesh(
      new THREE.CylinderGeometry(0.03, 0.04, 1.5, 8),
      new THREE.MeshStandardMaterial({ color: 0x6f4e37 })
    );
    staff.position.set(0.42, 0.85, 0.25);
    this.playerGroup.add(staff);

    const staffBulb = new THREE.Mesh(
      new THREE.SphereGeometry(0.13, 10, 10),
      new THREE.MeshBasicMaterial({ color: 0xffd166 })
    );
    staffBulb.position.set(0.42, 1.62, 0.25);
    this.playerGroup.add(staffBulb);

    this.playerLight = new THREE.PointLight(0xffcb6b, 2.2, 9.5, 1.5);
    this.playerLight.position.set(0.42, 1.65, 0.25);
    this.playerGroup.add(this.playerLight);

    this.worldGroup.add(this.playerGroup);
  }

  public syncAndRender(state: GameState, elapsedSec: number): void {
    const levelKey = `${state.levelId}:${state.islandRadius}`;
    if (this.builtLevelKey !== levelKey) {
      this.buildLevel(state);
    }

    // Sync Mây
    this.playerGroup.position.set(state.player.x, 0, state.player.z);
    const yaw = Math.atan2(state.player.facingX, state.player.facingZ);
    this.playerGroup.rotation.y = yaw;
    if (state.player.invulnTicks > 0) {
      const blink = Math.floor(elapsedSec * 16) % 2 === 0;
      this.playerCloakMat.emissive.setHex(blink ? 0x9e2a2b : 0x000000);
      this.playerCloakMat.emissiveIntensity = blink ? 0.6 : 0;
    } else {
      this.playerCloakMat.emissive.setHex(0x000000);
      this.playerCloakMat.emissiveIntensity = 0;
    }

    // Sync Fireflies
    for (let i = 0; i < state.fireflies.length; i += 1) {
      const f = state.fireflies[i];
      const mesh = this.fireflyMeshes.get(f.id);
      if (!mesh) continue;
      mesh.visible = !f.collected;
      if (!f.collected) {
        mesh.position.set(f.x, 0.85 + Math.sin(elapsedSec * 3.5 + i) * 0.22, f.z);
      }
    }

    // Sync Great Lanterns
    for (const l of state.lanterns) {
      const vis = this.lanternVisuals.get(l.id);
      if (!vis) continue;
      if (l.lit) {
        vis.coreMat.color.setHex(0xffe082);
        vis.coreMat.emissiveIntensity = 2.4 + Math.sin(elapsedSec * 4) * 0.25;
        vis.light.intensity = 4.6;
        vis.beam.visible = true;
        vis.safeRing.visible = true;
      } else {
        vis.coreMat.color.setHex(0x2c3648);
        vis.coreMat.emissiveIntensity = 0;
        vis.light.intensity = 0;
        vis.beam.visible = false;
        vis.safeRing.visible = false;
      }
    }

    // Sync Ink Shadows & AI states
    for (let i = 0; i < state.shadows.length; i += 1) {
      const s = state.shadows[i];
      const vis = this.shadowVisuals.get(s.id);
      if (!vis) continue;
      vis.group.position.set(s.x, 0.85 + Math.sin(elapsedSec * 2.8 + i) * 0.14, s.z);
      vis.group.rotation.y = elapsedSec * 1.4 + i;
      vis.ring.rotation.z = elapsedSec * 1.8;

      if (s.aiState === 'chase') {
        vis.bodyMat.emissive.setHex(0xdc2626);
        vis.bodyMat.emissiveIntensity = 1.1;
        vis.ringMat.color.setHex(0xef4444);
        vis.group.scale.setScalar(1.08);
      } else if (s.aiState === 'alert') {
        vis.bodyMat.emissive.setHex(0xd97706);
        vis.bodyMat.emissiveIntensity = 0.9;
        vis.ringMat.color.setHex(0xf59e0b);
        vis.group.scale.setScalar(1.02);
      } else if (s.aiState === 'repelled') {
        vis.bodyMat.emissive.setHex(0x0ea5e9);
        vis.bodyMat.emissiveIntensity = 0.45;
        vis.ringMat.color.setHex(0x38bdf8);
        vis.group.scale.setScalar(0.78);
      } else {
        vis.bodyMat.emissive.setHex(0x45126e);
        vis.bodyMat.emissiveIntensity = 0.65;
        vis.ringMat.color.setHex(0x7b2cbf);
        vis.group.scale.setScalar(1.0);
      }
    }

    // Sync Light Flare shockwave
    const ticksSinceFlare = state.tick - state.lastFlareTick;
    if (ticksSinceFlare >= 0 && ticksSinceFlare < 14) {
      const progress = ticksSinceFlare / 14;
      const radius = 0.5 + progress * FLARE_RADIUS;
      this.flareWaveMesh.visible = true;
      this.flareWaveMesh.position.set(state.player.x, 0.12, state.player.z);
      this.flareWaveMesh.scale.setScalar(radius);
      this.flareWaveMat.opacity = (1 - progress) * 0.85;
    } else {
      this.flareWaveMesh.visible = false;
    }

    // Smooth third-person camera
    const desiredCamPos = new THREE.Vector3(state.player.x, 13.5, state.player.z + 14.5);
    const desiredTarget = new THREE.Vector3(state.player.x, 0.9, state.player.z);
    this.camPos.lerp(desiredCamPos, 0.12);
    this.camTarget.lerp(desiredTarget, 0.16);
    this.camera.position.copy(this.camPos);
    this.camera.lookAt(this.camTarget);

    this.renderer.render(this.scene, this.camera);
  }

  public dispose(): void {
    window.removeEventListener('resize', this.handleResize);
    this.renderer.dispose();
  }
}
