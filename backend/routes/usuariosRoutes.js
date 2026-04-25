const express    = require('express');
const router     = express.Router();
const controller = require('../controllers/usuariosController');
const auth       = require('../middlewares/authMiddleware');

router.get('/',              auth, controller.listar);
router.post('/',             auth, controller.criar);
router.put('/:id',           auth, controller.atualizar);
router.patch('/:id/status',  auth, controller.toggleStatus);

module.exports = router;