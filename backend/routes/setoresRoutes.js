const express    = require('express');
const router     = express.Router();
const controller = require('../controllers/setoresController');
const auth       = require('../middlewares/authMiddleware');

router.get('/',       auth, controller.listar);
router.post('/',      auth, controller.criar);
router.put('/:id',    auth, controller.atualizar);
router.delete('/:id', auth, controller.excluir);

module.exports = router;