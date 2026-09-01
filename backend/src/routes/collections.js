const express = require("express");
const router = express.Router();
const controller = require("../controllers/collectionsController");
const { autenticar } = require("../middleware/auth");

router.post("/", autenticar, controller.criarColeta);
router.get("/", autenticar, controller.listarColetas);
router.patch(
    "/:collectionId/revoke",
    autenticar,
    controller.revogarColeta,
);

module.exports = router;
