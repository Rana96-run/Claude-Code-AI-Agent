import { Router, type IRouter } from "express";
import health from "./health.js";
import auth from "./auth.js";
import generate from "./generate.js";
import generateDesign from "./generate-design.js";
import canva from "./canva.js";
import miro from "./miro.js";
import hubspot from "./hubspot.js";
import wordpress from "./wordpress.js";
import nanoBanana from "./nanobanana.js";
import drive from "./drive.js";
import convert from "./convert.js";
import agent from "./agent.js";
import refs from "./refs.js";

const router: IRouter = Router();

router.use(health);
router.use(auth);
router.use(generate);
router.use(generateDesign);
router.use(hubspot);
router.use(wordpress);
router.use(convert);
router.use(refs);
router.use("/canva", canva);
router.use("/miro", miro);
router.use("/drive", drive);
router.use("/nb", nanoBanana);
router.use("/agent", agent);

export default router;
