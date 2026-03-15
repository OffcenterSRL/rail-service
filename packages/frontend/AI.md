# AI Collaboration Guidelines

1. **Version discipline:** Whenever you or Claude touch the footer version, confirm both `package.json` and `src/app/app-version.ts` share the same semantic version (major.minor.patch). Ask the user if a version bump is expected; when updating the footer, also update `APP_VERSION` accordingly and write its value back into `package.json`.
2. **Footer text:** The footer should always read `Versione {appVersion}` and pull from `APP_VERSION`. Never hard-code a duplicate literal elsewhere—share the constant.
3. **User cues:** If the user asks about the current version or points to the footer, double-check `package.json` version and `app-version.ts` before answering or changing anything. Mention both files in your explanation if they diverge.
4. **Claude hand-off:** If Claude is involved (e.g., via the `claudeComplete` helper in mockup), copy these same instructions and remind Claude that any UI touches must honor the shared version source and footer wording.
5. **Incrementing:** After meaningful UI/content work, bump the version by the smallest number that reflects scope (major for breaking UX change, minor for new UI sections, patch for tweaks). Sync `APP_VERSION` and `package.json` before committing.
