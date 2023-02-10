#!/usr/bin/env node

import { Integration } from "./app/integration.js";

const run = () => Integration.all().map((i) => i.up());

run();
