export function matchesAnyGlob(path: string, globs: string[]): boolean {
  return globs.some((glob) => matchesGlob(path, glob));
}

export function matchesGlob(path: string, glob: string): boolean {
  const normalizedPath = path.replace(/\\/g, "/");
  const normalizedGlob = glob.trim().replace(/\\/g, "/");
  if (!normalizedGlob) {
    return false;
  }

  const regex = new RegExp(`^${escapeGlob(normalizedGlob)}$`);
  return regex.test(normalizedPath);
}

function escapeGlob(glob: string): string {
  let output = "";
  for (let index = 0; index < glob.length; index += 1) {
    const char = glob[index];
    const next = glob[index + 1];
    if (char === "*" && next === "*") {
      output += ".*";
      index += 1;
    } else if (char === "*") {
      output += "[^/]*";
    } else if (char === "?") {
      output += ".";
    } else {
      output += char.replace(/[|\\{}()[\]^$+?.]/g, "\\$&");
    }
  }
  return output;
}
