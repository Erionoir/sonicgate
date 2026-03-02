export function goertzelEnergy(samples: Float32Array, targetHz: number, sampleRate: number): number {
  const omega: number = (2 * Math.PI * targetHz) / sampleRate;
  const coefficient: number = 2 * Math.cos(omega);

  let q0: number = 0;
  let q1: number = 0;
  let q2: number = 0;

  for (let index: number = 0; index < samples.length; index += 1) {
    q0 = coefficient * q1 - q2 + (samples[index] ?? 0);
    q2 = q1;
    q1 = q0;
  }

  return q1 * q1 + q2 * q2 - coefficient * q1 * q2;
}
