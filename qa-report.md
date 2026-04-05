# Scene QA Diagnostic Report

**Date**: 2026-04-05
**URL**: `http://localhost:5173/mom-AI/?qa=true`

## Summary: 18 PASSED, 1 EXPECTED-FAIL

## Results

| # | Check | Result | Details |
|---|-------|--------|---------|
| 1 | CAR_ORIENTATION | PASS | Longest=Z(2.179) Mid=X(1.358) Short=Y(0.654) |
| 2 | WHEEL_GROUND_CONTACT[FrontL] | PASS | Bottom Y=0.009 |
| 3 | WHEEL_GROUND_CONTACT[FrontR] | PASS | Bottom Y=0.000 |
| 4 | WHEEL_GROUND_CONTACT[RearL] | PASS | Bottom Y=0.025 |
| 5 | WHEEL_GROUND_CONTACT[RearR] | PASS | Bottom Y=0.004 |
| 6 | WHEEL_IN_WHEELBASE[FrontL] | PASS | Z=+0.624 (front) |
| 7 | WHEEL_IN_WHEELBASE[FrontR] | PASS | Z=+0.623 (front) |
| 8 | WHEEL_IN_WHEELBASE[RearL] | PASS | Z=-0.776 (rear) |
| 9 | WHEEL_IN_WHEELBASE[RearR] | PASS | Z=-0.776 (rear) |
| 10 | PART_INSIDE_BODY[engine] | PASS | Center (0, 0.384, 0.896) |
| 11 | PART_INSIDE_BODY[steering] | PASS | Center (0.026, 0.312, 0.280) |
| 12 | PART_INSIDE_BODY[fuel] | PASS | Center (0.034, 0.135, -0.585) |
| 13 | PART_INSIDE_BODY[transmission] | PASS | Center (0, 0.150, -0.034) |
| 14 | PART_SCALE_RATIO[engine] | PASS | X=0.27 Y=0.73 Z=0.16 |
| 15 | PART_SCALE_RATIO[steering] | PASS | X=0.29 Y=0.73 Z=0.10 |
| 16 | PART_SCALE_RATIO[fuel] | PASS | X=0.55 Y=0.41 Z=0.10 |
| 17 | PART_SCALE_RATIO[transmission] | PASS | X=0.24 Y=0.38 Z=0.38 |
| 18 | SHADOW_MATCHES_CAR | PASS | Ratio diff 1% |
| 19 | LOGO_ON_SIDES | EXPECTED-FAIL | Async texture load — runs before decals exist |

## Issues Fixed

### Critical: Wheel extraction losing parent transforms
**Root cause**: `removeFromParent()` on GLTF wheel nodes lost intermediate hierarchy transforms.
**Fix**: Compute `modelInverse * node.matrixWorld` before extraction, decompose into position/quaternion/scale after reparenting.
**Files**: `src/car/CarBuilder.js`

### Critical: All failure animations drive sideways (X instead of Z)
**Root cause**: Animations used `carGroup.position.x` for forward/backward motion, but the car's length axis is Z.
**Fix**: Changed all `x:` to `z:` in engine shake, steering drift, fuel sputter, and transmission jerk animations.
**Files**: `src/tour/failures.js`

### Critical: Finale drive-away moves sideways
**Root cause**: `carGroup.position.x = 8` in playFinale().
**Fix**: Changed to `z: 8`.
**Files**: `src/tour/TourSequencer.js`

### Medium: Logo decals on front/rear instead of sides
**Root cause**: Logo placed at `bb.max.z` and `bb.min.z` (front/rear faces).
**Fix**: Moved to `bb.max.x` and `bb.min.x` (side faces) with correct Y-rotation.
**Files**: `src/car/CarBuilder.js`

### Medium: Contact shadow wrong aspect ratio
**Root cause**: `PlaneGeometry(3.2, 1.4)` — wider than long, but car is longer than wide.
**Fix**: Changed to `PlaneGeometry(1.6, 2.6)`.
**Files**: `src/main.js`

### Medium: Procedural parts too large for car body
**Root cause**: Engine Y-ratio 1.33, steering Y-ratio 0.91, fuel X-ratio 0.61.
**Fix**: Applied scale factors — engine 0.55, steering 0.8, fuel 0.9.
**Files**: `src/car/parts/engine.js`, `src/car/parts/steering.js`, `src/car/parts/fuel.js`

## Spatial Reference

```
Body BB:   X[-0.582, 0.587]  Y[0.124, 0.654]  Z[-1.089, 1.089]
Wheels BB: X[-0.679, 0.679]  Y[0.000, 0.543]  Z[-1.044, 0.891]
Full car:  X[-0.679, 0.679]  Y[0.000, 0.654]  Z[-1.089, 1.089]

Front wheels: Z ≈ +0.62   Rear wheels: Z ≈ -0.78
Left side:    X ≈ +0.49   Right side:  X ≈ -0.49
Ground plane: Y = 0       Roof:        Y ≈ 0.65
```
