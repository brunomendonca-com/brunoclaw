### Searching Conversation History

You have access to the `search_messages` MCP tool. 
Because NanoClaw v2 stores all conversation history directly in your mounted session database (`/workspace/inbound.db` and `/workspace/outbound.db`), you no longer need external tools like `qsearch` or a dedicated `search.db` to search through messages in your current chat.

**How to use it:**
- If a user asks about past conversations, decisions, or shared content, use `search_messages` with relevant keywords.
- The tool searches both incoming and outgoing messages.
- The results will be ordered chronologically (oldest to newest) and capped at 20 by default (up to 100).
- When referencing a past message, mention the date/time or the sender. You do not need to reply to specific IDs unless asked.

Note: This tool searches the current session's history. For `agent-shared` channels like WhatsApp, this includes the entire history of the chat.