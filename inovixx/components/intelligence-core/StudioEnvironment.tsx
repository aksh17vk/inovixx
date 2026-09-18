"use client";

import { memo } from "react";
import { Environment, Lightformer } from "@react-three/drei";
import { COLORS } from "@/lib/constants";

// Procedural studio lighting for the glass orb: a soft top box plus narrow
// strip lights, which are what give glass those long, crisp specular streaks.
// Baked once into a cube map (frames={1}); nothing is downloaded — never use
// Environment's `preset` / `files`, they fetch from a CDN.
//
// Memoised on purpose: drei re-bakes the cube map whenever this element's
// children change identity, i.e. on every re-render of an un-memoised parent.
// Each Lightformer faces the origin by default — note that dashed
// `rotation-x` props are silently ignored by Lightformer; only a full
// `rotation` array would be honoured.
export const StudioEnvironment = memo(function StudioEnvironment({ resolution }: { resolution: number }) {
  return (
    <Environment resolution={resolution} frames={1} background={false}>
      <color attach="background" args={["#020204"]} />
      <Lightformer form="rect" intensity={3} color="#ede8ff" position={[0, 5, -2]} scale={[10, 3, 1]} />
      <Lightformer form="rect" intensity={6} color={COLORS.violet} position={[-5, 0, 1]} scale={[0.5, 8, 1]} />
      <Lightformer form="rect" intensity={4} color={COLORS.cyan} position={[5, 0, 0]} scale={[0.5, 8, 1]} />
      <Lightformer form="ring" intensity={4} color={COLORS.blue} position={[0, 0, -6]} scale={4} />
      <Lightformer form="circle" intensity={8} color="#ffffff" position={[2, 3, 4]} scale={1.2} />
    </Environment>
  );
});
