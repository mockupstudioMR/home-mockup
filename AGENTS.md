# Architecture rules

- Assemble generation moodboard references with the shared moodboard context helper, preserving role labels; attach images in priority order up to a memory-safe cap and name any remaining references in prompt text, because too many inline images exceed edge worker memory.
- Prefix non-surgical generation prompts with the shared moodboard brief independently of editable prompt templates; this keeps user selections authoritative even when templates omit placeholders.