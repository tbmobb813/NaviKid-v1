declare module 'expo-constants' {
  /**
   * Augment the EmbeddedManifest type to include the `extra` field used at runtime.
   * This keeps typing strict while matching runtime Expo config shapes that include
   * `extra` (EAS/Expo config) values such as SENTRY_DSN.
   */
  interface EmbeddedManifest {
    extra?: { SENTRY_DSN?: string; [key: string]: any } | undefined;
  }

  // Provide a small typed shape for the default export so `Constants.manifest` is
  // recognized by the compiler. Keep it permissive for forwards-compatibility.
  interface ExpoConfig {
    extra?: { [key: string]: any } | undefined;
    version?: string | undefined;
    sdkVersion?: string | undefined;
    ios?: { buildNumber?: string | undefined } | undefined;
    android?: { versionCode?: string | undefined } | undefined;
    [key: string]: any;
  }

  interface _ExpoConstants {
    manifest?: EmbeddedManifest | undefined;
    expoConfig?: ExpoConfig | undefined;
    [key: string]: any;
  }

  const Constants: _ExpoConstants;
  export default Constants;
}
