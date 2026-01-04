import "dotenv/config";
import makeApp from "./configs/app";
import { db } from "./api/v1/db";

const PORT: number = Number(process.env.PORT) || 5000;
const app = makeApp(db, PORT);

app.listen(PORT, () => {
  console.log(`Server is running on ${PORT}`);
});
