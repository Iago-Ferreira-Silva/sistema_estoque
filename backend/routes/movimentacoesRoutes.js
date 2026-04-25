const express    = require('express');
const router     = express.Router();
const controller = require('../controllers/movimentacoesController');
const auth       = require('../middlewares/authMiddleware');

router.get('/',  auth, controller.listar);
router.post('/', auth, controller.criar);

module.exports = router;