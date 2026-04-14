<p align="center">
  <h1 align="center">OpenCode Sentinel</h1>
</p>

<p align="center">
  <a href="https://opencode.ai">
    <picture>
      <source srcset="packages/console/app/src/asset/logo-ornate-dark.svg" media="(prefers-color-scheme: dark)">
      <source srcset="packages/console/app/src/asset/logo-ornate-light.svg" media="(prefers-color-scheme: light)">
      <img src="packages/console/app/src/asset/logo-ornate-light.svg" alt="OpenCode logo" width="200">
    </picture>
  </a>
</p>

<p align="center">
  <a href="README.zh-CN.md">简体中文</a> | English
</p>

---

## Introduction

**OpenCode Sentinel** is a security-enhanced version of OpenCode, specifically designed for corporate intranets and offline networks.

Compared to the original version, it is intended to work with private AI infrastructure only, cut off external network access, and remain usable in air-gapped environments.

- Offline-ready packaging for disconnected deployment
- Network policy controls for allow-all, deny-all, and whitelist modes
- Better behavior on unstable or unavailable external networks
- Support for private model deployments such as Ollama, vLLM, and internal OpenAI-compatible servers

## Offline Deployment

### 1. Prepare a connected build machine

Install `bun`, `node`, and clone this repository.

```bash
git clone https://github.com/Kontinuation/opencode-sentinel.git
cd opencode-sentinel
```

### 2. Build the offline package

By default, the build channel follows the current git branch name. If you build on `dev` without overrides, the generated package will also be in the `dev` channel.

To build a release-channel package, you must set `OPENCODE_CHANNEL=latest`:

```bash
OPENCODE_CHANNEL=latest bun offline-scripts/pack.ts
```

If you just need another preview build, the default command still works:

```bash
bun offline-scripts/pack.ts
```

This generates `offline-scripts/opencode-offline.tar.gz`.

### 3. Install in the target environment

Transfer the package to the destination host, extract it, and run the platform installer.

| OS | Command |
| :--- | :--- |
| Linux / macOS | `./install.sh` |
| Windows | `install.bat` or `install.ps1` |

## Configuration

Before the first run, configure security policies and model access in `~/.config/opencode/opencode.json`.

```json
{
  "$schema": "https://opencode.ai/config.json",
  "network": {
    "policy": "whitelist",
    "whitelist": ["my-private-llm.com"]
  },
  "provider": {
    "my_provider": {
      "options": {
        "baseURL": "https://my-private-llm.com/v1",
        "apiKey": "sk-private-key"
      },
      "models": {
        "qwen3-32b": {
          "name": "Qwen3-32B"
        }
      }
    }
  }
}
```

### Network Policy

- `allow-all`: allow outbound network access
- `deny-all`: deny outbound network access
- `whitelist`: allow only whitelisted domains

## Run

```bash
opencode
```

<p align="center">
  <img src="OpenCode-Sentinel.png" alt="OpenCode Sentinel Screenshot" width="800">
</p>

## Documentation

- [opencode.ai/docs](https://opencode.ai/docs)
