#!/usr/bin/env node

import { Integration } from "./app/integration.js";
import { logger } from "./app/utils.js";

// function run() {
//   return Integration.all().then(x => {
//     logger.info(x);
//     return Promise.all(x.map(async (i) => await i.up()))
//   });
// }

// await run();

// logger.info(await Integration.find("4ec9df4b-d777-4f3b-8688-c704b4050b68"))
logger.info("done");

export { Integration };
