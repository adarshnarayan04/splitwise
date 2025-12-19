import { app } from "./server.js";

const PORT = Number(process.env.PORT) || 3000;

app.listen(PORT, () => {
  console.log(`Expense sharing service listening on port ${PORT}`);
});
