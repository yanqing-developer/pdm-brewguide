import { ENV } from "./config/env.js";
import { createApp } from "./app.js";

const app = createApp();

app.listen(ENV.PORT, () => {
  console.log(`API listening on http://localhost:${ENV.PORT}`);
});
