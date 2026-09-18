// What the visitor is doing to the 3D scene with their hands: dragging it
// around anywhere on the page, and the controls in the Playground section.
// Same pattern as scroll-store — plain mutable objects read every frame by the
// scene, because pointer input arrives far faster than React should re-render.

import type { FormationKey } from "./scroll-store";

const PITCH_LIMIT = 1.15; // radians — never flip the scene upside down

export const orbit = {
  /** Rotation the visitor has added on top of the scene's own, in radians. */
  yaw: 0,
  pitch: 0,
  /** Angular velocity in rad/s — carries the scene on after release. */
  vYaw: 0,
  vPitch: 0,
  dragging: false,
  /** Seconds since the last input. Lets the tilt settle back once they let go. */
  idle: 0,
  /** Set by "Reset view": ease the tilt home even inside the playground. */
  homing: false,
};

export const play = {
  /** The formation picked in the playground, and the morph into it. */
  from: "core" as FormationKey,
  to: "core" as FormationKey,
  /** 0..1 progress of that morph. Driven by time, not by scroll. */
  t: 1,
  /** A pick made while a morph is still in flight; it runs next. */
  pending: null as FormationKey | null,
  /** 0..1 — glow, bloom and how restless the particles are. */
  energy: 0.5,
  /** -1..1 — camera distance. Positive is closer. */
  zoom: 0,
  spin: true,
  /** Raised by the UI; the scene stamps it with its own clock and clears it. */
  pulseRequested: false,
};

export function rotateBy(dYaw: number, dPitch: number, dt: number) {
  orbit.yaw += dYaw;
  orbit.pitch = Math.min(PITCH_LIMIT, Math.max(-PITCH_LIMIT, orbit.pitch + dPitch));
  orbit.idle = 0;
  orbit.homing = false;
  if (dt > 0) {
    // Smoothed, so one jittery sample at release can't fling the scene.
    orbit.vYaw += (dYaw / dt - orbit.vYaw) * 0.5;
    orbit.vPitch += (dPitch / dt - orbit.vPitch) * 0.5;
  }
}

export function stepOrbit(dt: number, holdTilt: boolean, reducedMotion: boolean) {
  orbit.idle += dt;
  if (!orbit.dragging) {
    if (reducedMotion) {
      // No coasting: the scene moves only while the visitor is moving it.
      orbit.vYaw = 0;
      orbit.vPitch = 0;
    } else {
      orbit.yaw += orbit.vYaw * dt;
      orbit.pitch = Math.min(PITCH_LIMIT, Math.max(-PITCH_LIMIT, orbit.pitch + orbit.vPitch * dt));
      const friction = Math.exp(-2.6 * dt);
      orbit.vYaw *= friction;
      orbit.vPitch *= friction;
    }
    // Yaw can stay wherever it was left — the scene turns on that axis anyway.
    // Tilt can't: the scroll story is composed for the default lean, so outside
    // the playground it eases home shortly after the visitor lets go.
    if (orbit.homing || (!holdTilt && orbit.idle > 1.4)) {
      orbit.pitch *= Math.exp(-(orbit.homing ? 4 : 1.1) * dt);
      if (Math.abs(orbit.pitch) < 0.002) {
        orbit.pitch = 0;
        orbit.homing = false;
      }
    }
  }
}

export function selectFormation(key: FormationKey) {
  if (play.t < 1) {
    // A morph is in flight. Restarting from `play.to` would teleport the field
    // to a shape it hasn't reached yet, and the morph can't simply be reversed
    // (each particle runs on its own staggered schedule). So queue the pick:
    // the scene finishes this morph quickly, then flies on to the new one.
    play.pending = key === play.to ? null : key;
    return;
  }
  play.pending = null;
  if (key === play.to) return;
  play.from = play.to;
  play.to = key;
  play.t = 0;
}

export function resetPlay() {
  selectFormation("core");
  play.energy = 0.5;
  play.zoom = 0;
  play.spin = true;
  orbit.vYaw = 0;
  orbit.vPitch = 0;
  orbit.homing = true;
}
