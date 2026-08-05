function compareStrings(left: string, right: string): number {
  if (left < right) {
    return -1;
  }

  if (left > right) {
    return 1;
  }

  return 0;
}

export function canonicalize(value: unknown): unknown {
  if (Array.isArray(value)) {
    return value.map(item => canonicalize(item));
  }

  if (value !== null && typeof value === 'object') {
    const input = value as Record<string, unknown>;
    const output: Record<string, unknown> = {};

    for (const key of Object.keys(input).sort(compareStrings)) {
      const child = input[key];

      if (child !== undefined) {
        output[key] = canonicalize(child);
      }
    }

    return output;
  }

  if (typeof value === 'number' && !Number.isFinite(value)) {
    return null;
  }

  return value;
}

export function stableStringify(value: unknown): string {
  return `${JSON.stringify(canonicalize(value), null, 2)}\n`;
}
