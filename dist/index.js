#!/usr/bin/env node
import { Integration } from "./app/integration.js";
import { logger } from "./app/utils.js";
const run = () => Integration.all().map((i) => i.up());
Promise.all(run()).then((_) => logger.info("Bootstrap done."));
