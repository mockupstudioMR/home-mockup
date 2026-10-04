# Architecture rules

- Assemble generation moodboard references with the shared moodboard context helper, preserving role labels and all curated references; this prevents silent reference truncation and missing architecture inputs.
- Prefix non-surgical generation prompts with the shared moodboard brief independently of editable prompt templates; this keeps user selections authoritative even when templates omit placeholders.