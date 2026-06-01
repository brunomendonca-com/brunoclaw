# DaVinci Remote Source Provenance

DaVinci analyzed a temporary local checkout created from a remote Git URL. Source bytes were still fetched locally; this is not API-only remote code analysis.

| Field | Value |
|---|---|
| Source kind | `remote_git_https` |
| Remote URL | `[redacted-remote-url]` |
| Remote URL redacted | `true` |
| Remote URL fingerprint | `1270e32ee12b13267055a9b08b49526a1939ee04c187ef7bfaa3d49ddddd4516` (blake3) |
| Remote host | `github.com` |
| Requested ref | `-` |
| Resolved head | `601fc7c39678462d94098c8915ef320da1dfe466` |
| Clone strategy | `shallow_single_branch_depth_1` |
| Source retention | `delete_after_scan` |
| Temp source path | `[temporary-checkout-deleted]` |
| Cleanup policy | `delete_temp_checkout_on_command_exit` |
