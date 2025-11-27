#!/usr/bin/env node
/* Run Jest programmatically and print why-is-node-running output afterwards to locate lingering handles */
(async () => {
  try {
    // Import runCLI correctly for both jest CJS and ESM entry points
    let runCLI;
    try {
      const jestPkg = await import('jest');
      runCLI = jestPkg.runCLI || jestPkg.default?.runCLI || jestPkg.default || jestPkg;
    } catch (e) {
      runCLI = require('jest').runCLI;
    }

    const wirModule = await import('why-is-node-running');
    const wir = wirModule.default || wirModule;

    // Build arguments


    const projectRoot = process.cwd();

    const { results } = await runCLI(
      {
        // pass CLI args through the object form
        runInBand: true,
        detectOpenHandles: true,
        silent: false,
      },
      [projectRoot],
    );

    // Wait a tick to let any async teardown settle
    setTimeout(() => {
      console.log('\n--- why-is-node-running report ---');
      try {
        wir();
      } catch (err) {
        console.error('Failed to run why-is-node-running:', err);
      }
      // exit with the same status
      process.exit(results.success ? 0 : 1);
    }, 1000);
  } catch (error) {
    console.error('Error running Jest programmatically:', error);
    process.exit(2);
  }
})();
