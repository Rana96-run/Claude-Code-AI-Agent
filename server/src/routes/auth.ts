import { Router } from "express";

const router = Router();

router.post("/auth", (req, res) => {
  const { password } = req.body ?? {};
  const teamPassword = process.env.TEAM_PASSWORD;

  if (!teamPassword) {
    res.status(500).json({ error: "Server misconfigured: TEAM_PASSWORD not set" });
    return;
  }

  if (password === teamPassword) {
    res.status(200).json({ success: true });
  } else {
    res.status(401).json({ error: "Incorrect password" });
  }
});

export default router;
