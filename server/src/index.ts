import cors from "cors";
import express from "express";
import router from "./routes.js";

const app = express();
const allowedOrigins = [
  "http://localhost:5173",
  "https://calendly-scheduler-client.vercel.app"
];

app.use(
  cors({
    origin(origin, callback) {
      if (!origin || allowedOrigins.includes(origin)) {
        return callback(null, true);
      }

      return callback(new Error("Not allowed by CORS"));
    },
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    credentials: true
  })
);
app.use(express.json());
app.get("/", (_req, res) => {
  res.send("API running");
});
app.use("/api", router);

const port = Number(process.env.PORT ?? 4000);

app.listen(port, () => {
  console.log(`Server listening on http://localhost:${port}`);
});
