const express    = require('express');
const router     = express.Router();
const controller = require('../controllers/solicitacoesController');
const auth       = require('../middlewares/authMiddleware');

router.get('/',           auth, controller.listar);
router.post('/',          auth, controller.criar);
router.patch('/:id/status', auth, controller.atualizarStatus);

module.exports = router;