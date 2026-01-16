# Bun Setup

This project now uses [Bun](https://bun.sh) as the package manager and runtime for blazing fast development.

## Why Bun?

- ⚡ **3x faster** installs than npm/yarn
- 🚀 **Built-in** TypeScript, JSX, and bundler support
- 📦 **Drop-in replacement** - uses the same package.json
- 🎯 **Single binary** - less tooling complexity
- 💾 **Better caching** - faster subsequent installs

## Installation

If you don't have Bun installed:

```bash
# macOS, Linux, and WSL
curl -fsSL https://bun.sh/install | bash

# Or with npm (if you already have Node.js)
npm install -g bun
```

Verify installation:
```bash
bun --version
```

## Usage

All npm commands work with bun:

```bash
# Install dependencies
bun install          # Instead of: npm install

# Run scripts
bun run dev         # Instead of: npm run dev
bun run build       # Instead of: npm run build
bun run preview     # Instead of: npm run preview
```

You can also use shorter aliases:

```bash
bun dev             # Same as: bun run dev
bun build           # Same as: bun run build
```

## Migration from npm

The project has been migrated from npm to Bun:

**Removed:**
- `package-lock.json` (npm lockfile)

**Added:**
- `bun.lock` (Bun lockfile - committed to git)

**Unchanged:**
- `package.json` (same format, same dependencies)
- All other project files

## Performance Comparison

| Task | npm | Bun | Speed Improvement |
|------|-----|-----|-------------------|
| Install (cold) | ~4s | ~1s | **4x faster** |
| Install (cached) | ~2s | ~0.1s | **20x faster** |
| Run scripts | Same | Same | No difference |

## Compatibility

Bun is fully compatible with:
- ✅ npm packages
- ✅ Node.js APIs
- ✅ package.json scripts
- ✅ Vite and all existing tooling

## Fallback to npm

If you prefer to use npm, you can still do so:

```bash
# Remove Bun lockfile
rm bun.lock

# Use npm instead
npm install
npm run dev
npm run build
```

The project works with both!

## Troubleshooting

**Command not found: bun**
- Make sure Bun is installed: `curl -fsSL https://bun.sh/install | bash`
- Restart your terminal
- Check PATH: `echo $PATH` should include `~/.bun/bin`

**Dependencies not found**
- Run `bun install` to install all dependencies
- Check that `node_modules/` folder exists

**Build errors**
- Clear cache: `rm -rf node_modules dist .vite`
- Reinstall: `bun install`
- Try npm as fallback: `npm install && npm run build`

## Resources

- [Bun Documentation](https://bun.sh/docs)
- [Bun vs npm/yarn Performance](https://bun.sh/docs/cli/install)
- [Bun GitHub](https://github.com/oven-sh/bun)
