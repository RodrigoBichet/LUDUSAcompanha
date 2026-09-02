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
router.get(
    "/:collectionId/submissions",
    autenticar,
    controller.listarSubmissoesColeta,
);
router.post(
    "/:collectionId/participants/:participantRef/resolve",
    autenticar,
    controller.resolverParticipanteColeta,
);
router.patch(
    "/:collectionId/participants/:participantRef/import",
    autenticar,
    controller.importarSessoesColeta,
);
router.patch(
    "/:collectionId/revoke",
    autenticar,
    controller.revogarColeta,
);

module.exports = router;
