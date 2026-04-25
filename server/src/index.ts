import app from "./app.js";

const port = Number(process.env.PORT) || 8080;

app.listen(port, () => {
  // eslint-disable-next-line no-console
  console.log(`[server] listening on http://localhost:${port}`);
});
