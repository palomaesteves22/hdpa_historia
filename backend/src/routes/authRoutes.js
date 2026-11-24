const express = require('express');
const jwt = require('jsonwebtoken');

const router = express.Router();

router.post('/login', (req, res) => {
  const { usuario, senha } = req.body;

  if (
    usuario === (process.env.AUTH_USER || 'admin') &&
    senha === (process.env.AUTH_PASSWORD || '123456')
  ) {
    const jwtSecret = process.env.JWT_SECRET || 'admin';

    const token = jwt.sign(
      { usuario },
      jwtSecret,
      { expiresIn: '2h' }
    );

    return res.json({
      token
    });
  }

  return res.status(401).json({
    error: 'Usuário ou senha inválidos.'
  });

});

module.exports = router;