const express = require("express");
const router = express.Router();
const controller = require("../controllers/collectionsController");
const {
    autenticar,
    autenticarEnvioObservacional,
} = require("../middleware/auth");

router.post("/", autenticar, controller.criarColeta);
router.post("/pair", controller.parearParticipante);
router.post(
    "/submissions",
    autenticarEnvioObservacional,
    controller.receberLoteObservacional,
);
router.get("/", autenticar, controller.listarColetas);
router.patch(
    "/:collectionId/revoke",
    autenticar,
    controller.revogarColeta,
);

module.exports = router;
