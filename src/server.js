import app from "./app.js";
import connectDb from "./config/db.js";
import config from "./config/env.js";


const port = config.port;

connectDb();

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`);
});
