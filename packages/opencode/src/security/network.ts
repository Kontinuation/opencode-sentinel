import { Log } from "../util/log"
import { Effect, Context } from "effect"

export namespace NetworkPolicy {
  const log = Log.create({ service: "security" })

  export class AccessDeniedError extends Error {
    readonly _tag = "AccessDeniedError"
    constructor(message: string) {
      super(message)
    }
  }

  export type NetworkConfig = {
    policy?: "allow-all" | "deny-all" | "whitelist"
    whitelist?: string[]
    proxy?: string
  }

  /** The Config Service tag, used to break circular dependencies */
  export class ConfigTag extends Context.Service<ConfigTag, any>()("@opencode/Config") {}

  /**
   * Checks if network access to the given URL is allowed by the current configuration.
   * Returns an Effect that fails with AccessDeniedError if access is denied.
   */
  export const checkAccess = (url: string | URL, network?: NetworkConfig) =>
    Effect.gen(function* () {
      if (network?.policy === "allow-all") {
        return
      }

      if (!network || !network.policy || network.policy === "deny-all") {
        return yield* Effect.fail(new AccessDeniedError("Network access is disabled by 'deny-all' policy (default)."))
      }

      if (network.policy === "whitelist") {
        let targetUrl: URL
        try {
          targetUrl = typeof url === "string" ? new URL(url) : url
        } catch (e) {
          return yield* Effect.die(new Error(`Invalid URL provided for network check: ${url}`))
        }

        const hostname = targetUrl.hostname

        const allowed = (network.whitelist ?? []).some((domain) => {
          return hostname === domain || hostname.endsWith("." + domain)
        })

        if (!allowed) {
          log.warn("Network access blocked by whitelist", {
            hostname,
            whitelist: network.whitelist,
          })
          return yield* Effect.fail(
            new AccessDeniedError(`Network access to '${hostname}' is not allowed by whitelist policy.`),
          )
        }
      }
    })

  /**
   * Pure version of isAccessAllowed for use in non-Effect code.
   * Returns true if access is allowed, false otherwise.
   */
  export const isAccessAllowed = (url: string | URL, network?: NetworkConfig): boolean => {
    if (network?.policy === "allow-all") return true
    if (!network || !network.policy || network.policy === "deny-all") return false

    if (network.policy === "whitelist") {
      try {
        const targetUrl = typeof url === "string" ? new URL(url) : url
        const hostname = targetUrl.hostname
        return (network.whitelist ?? []).some(
          (domain) => hostname === domain || hostname.endsWith("." + domain),
        )
      } catch {
        return false
      }
    }
    return false
  }
}
