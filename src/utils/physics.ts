
export interface SimulationParams {
  v0: number;      // Initial velocity of block (m/s)
  vBelt: number;   // Velocity of belt (m/s)
  mu: number;      // Kinetic friction coefficient
  length: number;  // Length of conveyor (m)
  theta: number;   // Angle of inclination (degrees), positive is uphill
  g: number;       // Gravity (m/s^2)
  mass: number;    // Mass of block (kg)
}

export interface MotionSegment {
  startTime: number;
  endTime: number;
  startV: number;
  endV: number;
  startX: number;
  endX: number;
  acceleration: number;
  description: string;
  descriptionZh: string; // Add Chinese description
}

export interface SimulationResult {
  segments: MotionSegment[];
  totalTime: number;
  exitVelocity: number;
  exitPosition: number;
  status: 'exited_right' | 'exited_left' | 'stopped_on_belt';
  relativeDistance: number; // Total relative distance (sliding distance)
  workFriction: number;     // Work done by friction on the block
  heatGenerated: number;    // Heat generated (Q = f * d_rel)
}

export function calculateMotion(params: SimulationParams): SimulationResult {
  const { v0, vBelt, mu, length, theta, g, mass } = params;
  
  const thetaRad = (theta * Math.PI) / 180;
  const cosTheta = Math.cos(thetaRad);
  const sinTheta = Math.sin(thetaRad);
  
  const aFriction = mu * g * cosTheta;
  const aGravity = g * sinTheta;
  
  const segments: MotionSegment[] = [];
  let t = 0;
  let x = 0;
  let v = v0;
  
  let iterations = 0;
  const MAX_ITERATIONS = 10; 
  
  let status: SimulationResult['status'] = 'stopped_on_belt';

  while (iterations < MAX_ITERATIONS) {
    iterations++;
    
    if (x > length) {
      status = 'exited_right';
      break;
    }
    if (x < 0) {
      status = 'exited_left';
      break;
    }

    let a = 0;
    let targetV: number | null = null;
    let description = "";
    let descriptionZh = "";

    if (Math.abs(v - vBelt) > 1e-6) {
      const relV = v - vBelt;
      const frictionDir = relV > 0 ? -1 : 1;
      
      a = -aGravity + (frictionDir * aFriction);
      
      targetV = vBelt;
      if (relV > 0) {
        description = "Decelerating relative to belt";
        descriptionZh = "相对于传送带减速";
      } else {
        description = "Accelerating relative to belt";
        descriptionZh = "相对于传送带加速";
      }
    } else {
      if (Math.abs(aGravity) <= aFriction) {
        a = 0;
        targetV = vBelt;
        description = "Moving with belt (Static)";
        descriptionZh = "随传送带匀速运动 (静摩擦)";
      } else {
        // Gravity overcomes friction
        // If gravity pulls down (positive theta), aGravity > 0.
        // Block wants to slide down (negative v direction relative to belt frame if belt is uphill).
        // Actually, simpler:
        // Force balance: mg sin(theta) vs mu mg cos(theta)
        // If tan(theta) > mu, it slides down.
        // Direction of sliding is DOWN (-x).
        // Friction opposes sliding, so Friction is UP (+x).
        // a = -aGravity + aFriction
        a = -aGravity + aFriction; 
        
        // However, if theta is negative (downhill), aGravity is negative (force is UP/Forward?).
        // Wait, theta positive is UPHILL.
        // Gravity component along x is -mg sin(theta).
        // If theta > 0, gravity force is negative.
        // If tan(theta) > mu, gravity wins. Block accelerates in -x.
        // Friction acts in +x.
        // a = -g sin(theta) + mu g cos(theta).
        // Since tan > mu, sin/cos > mu => sin > mu cos => g sin > mu g cos.
        // So a is negative. Correct.
        
        // What if theta is negative (downhill belt)?
        // theta < 0. sin(theta) < 0. -g sin(theta) is POSITIVE.
        // Gravity pulls block forward (+x).
        // Friction opposes motion.
        // If v > 0 (moving down), friction is -x.
        // a = -g sin(theta) - mu g cos(theta).
        // Wait, if it's just sliding due to gravity exceeding friction?
        // This 'else' block is for when v == vBelt initially.
        // If vBelt is constant, and we can't hold it, it slides.
        // If theta > 0 (uphill), it slides BACKWARDS (-x). Friction is +x.
        // If theta < 0 (downhill), it slides FORWARDS (+x) relative to belt?
        // Actually if v=vBelt, and we can't hold it:
        // If theta > 0: Gravity pulls down (-). Friction max is (+). Net is (-). v decreases. v < vBelt.
        // If theta < 0: Gravity pulls up/forward (+). Friction max is (-). Net is (+). v increases. v > vBelt.
        
        if (theta > 0) {
           a = -Math.abs(aGravity) + Math.abs(aFriction);
           description = "Sliding down (Gravity > Friction)";
           descriptionZh = "下滑 (重力 > 摩擦力)";
        } else {
           a = Math.abs(aGravity) - Math.abs(aFriction);
           description = "Sliding forward (Gravity > Friction)";
           descriptionZh = "加速下滑 (重力 > 摩擦力)";
        }
        
        targetV = theta > 0 ? -Infinity : Infinity;
      }
    }

    let dtV = Infinity;
    if (targetV !== null && Math.abs(a) > 1e-6) {
      dtV = (targetV - v) / a;
      // Ensure dtV is positive (future).
      // If a is driving us away from targetV, this logic might be tricky.
      // But in friction problems, we usually approach vBelt.
      // In the gravity > friction case, targetV is infinity, so dtV is infinity (or large).
      // If dtV < 0, it means we already passed it or moving away?
      // For v approaching vBelt, a opposes (v - vBelt).
      // If v > vBelt, a < 0. targetV = vBelt. dtV = (vBelt - v) / (-k) = (-)/(-) = (+).
      // If v < vBelt, a > 0. targetV = vBelt. dtV = (vBelt - v) / (+k) = (+)/(+) = (+).
      // So dtV should be positive if we are approaching vBelt.
      if (dtV < 0) dtV = Infinity;
    }

    const solveQuad = (acc: number, vel: number, pos: number, target: number): number => {
      if (Math.abs(acc) < 1e-6) {
        if (Math.abs(vel) < 1e-6) return Infinity;
        const t = (target - pos) / vel;
        return t > 0 ? t : Infinity;
      }
      const c = pos - target;
      const b = vel;
      const A = 0.5 * acc;
      const delta = b*b - 4*A*c;
      if (delta < 0) return Infinity;
      const sqrtDelta = Math.sqrt(delta);
      const t1 = (-b - sqrtDelta) / (2*A);
      const t2 = (-b + sqrtDelta) / (2*A);
      
      const candidates = [t1, t2].filter(time => time > 1e-6);
      if (candidates.length === 0) return Infinity;
      return Math.min(...candidates);
    };

    const dtExitRight = solveQuad(a, v, x, length);
    const dtExitLeft = solveQuad(a, v, x, 0);
    const dtExit = Math.min(dtExitRight, dtExitLeft);

    const dt = Math.min(dtV, dtExit);
    
    if (dt === Infinity || dt > 100) { // Safety cap
      if (Math.abs(v) < 1e-6 && Math.abs(a) < 1e-6) {
        status = 'stopped_on_belt';
        break;
      }
      // If moving but no exit found in reasonable time (e.g. oscillating or stuck), break
      if (dt > 100) {
         // Force step
      } else {
         break;
      }
    }
    
    // Cap dt to avoid infinite loops if something is wrong
    const safeDt = Math.min(dt, 20);

    const nextTime = t + safeDt;
    const nextX = x + v*safeDt + 0.5*a*safeDt*safeDt;
    const nextV = v + a*safeDt;

    segments.push({
      startTime: t,
      endTime: nextTime,
      startV: v,
      endV: nextV,
      startX: x,
      endX: nextX,
      acceleration: a,
      description,
      descriptionZh
    });

    t = nextTime;
    x = nextX;
    v = nextV;

    if (Math.abs(x - length) < 1e-4 || x > length) {
      status = 'exited_right';
      x = length;
      break;
    }
    if (Math.abs(x) < 1e-4 || x < 0) {
      status = 'exited_left';
      x = 0;
      break;
    }
  }

  // Calculate Energy Metrics
  let relativeDistance = 0;
  let workFriction = 0;
  
  // Normal force
  const N = mass * g * cosTheta;
  const f_k = mu * N;

  segments.forEach(seg => {
    const dt = seg.endTime - seg.startTime;
    // Relative velocity v_rel(t) = v(t) - vBelt
    // v(t) = v0_seg + a*t
    // v_rel(t) = (v0_seg - vBelt) + a*t
    // We want integral of |v_rel(t)| dt
    // If v_rel doesn't change sign (which it shouldn't in a single segment as we split at v=vBelt),
    // then distance_rel = | integral (v_rel) dt |
    // integral (v_rel) = integral (v) - integral (vBelt)
    // = (x_end - x_start) - vBelt * dt
    
    const dx = seg.endX - seg.startX;
    const d_belt = vBelt * dt;
    const d_rel = Math.abs(dx - d_belt);
    
    relativeDistance += d_rel;
    
    // Work done by friction on the block
    // W = integral ( f * v ) dt
    // Friction force f opposes relative motion.
    // If sliding (v != vBelt), f is constant f_k (kinetic).
    // Direction of f is opposite to (v - vBelt).
    // W_f = f_vector * displacement_vector
    // If v > vBelt, f is negative (-f_k). Displacement is dx. Work = -f_k * dx.
    // If v < vBelt, f is positive (+f_k). Displacement is dx. Work = +f_k * dx.
    // Note: This is work done ON the block.
    
    // Check relative velocity direction in this segment
    // Use midpoint or start
    const midV = (seg.startV + seg.endV) / 2;
    if (Math.abs(midV - vBelt) > 1e-5) {
        const sign = midV > vBelt ? -1 : 1;
        workFriction += sign * f_k * dx;
    } else {
        // Static friction. Work is done by static friction.
        // f_s = m * (a + g sin theta).
        // W = f_s * dx.
        // a is acceleration of block (which is 0 relative to belt, but could be moving in lab frame).
        // In static phase, a = 0 (if belt constant).
        // f_s balances gravity: f_s = m * g * sin(theta).
        // Wait, f_s = m * a_net_required.
        // a_block = 0 (if belt constant).
        // Forces: f_s - mg sin theta = 0 => f_s = mg sin theta.
        // Work = f_s * dx.
        const f_s = mass * g * sinTheta;
        workFriction += f_s * dx;
    }
  });

  // Heat Q = f_k * d_rel
  // Only generated during sliding
  const heatGenerated = f_k * relativeDistance;

  return {
    segments,
    totalTime: t,
    exitVelocity: v,
    exitPosition: x,
    status,
    relativeDistance,
    workFriction,
    heatGenerated
  };
}
