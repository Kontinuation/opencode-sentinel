# LLM Rebase Conflict Resolution Guide for OpenCode Sentinel

This repository (`opencode-sentinel`) is a downstream fork of `anomalyco/opencode`. It applies several security and offline-focused patches on top of the upstream codebase. 

We automatically rebase our changes onto the upstream `dev` branch daily. When merge conflicts occur, **your task as an AI agent** is to resolve them by preserving the Sentinel-specific modifications while adapting them to whatever new structure or refactoring the upstream changes have introduced.

## Core Sentinel Modifications to Preserve

When resolving conflicts, you must identify our custom logic and ensure it is carried over to the final file. Our core modifications are primarily in the following areas:

### 1. Network Security Policy (`packages/opencode/src/config/config.ts`)
- **Modification**: We extended the `Config` zod schema to include a `network` property that defines a policy (`allow-all`, `deny-all`, `whitelist`), a `whitelist` array, and an optional `proxy`.
- **Conflict Resolution**: If upstream modifies the `Config` schema, ensure our `network` field is still present in the updated schema definition.

### 2. Offline Dependency Installation (`packages/opencode/src/config/config.ts`)
- **Modification**: Inside the function that installs dependencies in background directories (usually looping over `unique(directories)`), we introduced a `canInstall(cfg)` check. We only run `installDependencies(dir)` if `canInstall` returns true according to the network policy. If it returns false, we log a debug message skipping the install.
- **Conflict Resolution**: If upstream refactors the dependency installation loop, re-apply the `canInstall` function and wrap the installation logic with the `if (canInstall(result)) { ... } else { ... }` block. Ensure variables passed to the logger are updated if upstream changed their names.

### 3. LLM Fallback Model (`packages/opencode/src/session/llm.ts`)
- **Modification**: 
  - Added a `fallback_model` string to the config schema (if applicable in this file or `config.ts`).
  - Added retry logic wrapping the LLM streaming execution. If the primary model fails, we attempt to parse `cfg.fallback_model`, prevent infinite loops if the fallback is the same as the primary model, and then execute the stream with the fallback model.
- **Conflict Resolution**: Upstream may frequently refactor how the LLM stream is created (e.g., using `Effect.catch`, `try/catch`, or moving stream execution into a layered service). Your goal is to encapsulate the *actual generation attempt* with our fallback logic. Do not blindly overwrite upstream's new streaming abstraction; wrap it with our `fallback_model` checks.

### 4. Tool Network Enforcement (`packages/opencode/src/tool/webfetch.ts` and others)
- **Modification**: We inject `NetworkPolicy.ConfigTag` into tools that make outbound network requests (like `WebFetchTool`). Before executing the request or prompting the user for permission, we run `yield* NetworkPolicy.checkAccess(url, cfg.network)`.
- **Conflict Resolution**: If upstream alters how tools are defined or executed (e.g., changing context structures or return types), you must re-inject the `ConfigTag` and execute `NetworkPolicy.checkAccess` before the actual fetch operation occurs.

## General Conflict Resolution Strategy

1. **Understand the Upstream Change**: Look at the conflict markers (`<<<<<<< HEAD`, `=======`, `>>>>>>>`). The `HEAD` block is the upstream code you are rebasing *onto*. The block below `=======` is our Sentinel code.
2. **Merge, Don't Overwrite**: Do not simply delete the upstream changes. Analyze why upstream changed the code (e.g., new types, renamed variables, new imports).
3. **Re-apply Sentinel Logic**: Adapt our Sentinel logic (from the `=======` to `>>>>>>>` block) to fit seamlessly into the new upstream structure.
4. **Fix Imports**: If our code depends on things like `NetworkPolicy` or `Log`, ensure those imports are preserved.
5. **Verify with Typecheck**: After resolving conflicts, you **MUST** run `bun typecheck` to ensure your resolution is syntactically and semantically correct.

## Post-Resolution Verification

Once you have resolved all conflict markers in all files:
1. Run `bun typecheck`. Fix any TypeScript errors you introduced.
2. Run `git add <resolved_files>`.
3. Run `git rebase --continue`.
4. Run `git push origin dev --force` (or whatever branch the workflow is operating on).
5. Close the issue.
