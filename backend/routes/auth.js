const express = require('express');
require('dotenv').config();
const router = express.Router();
const bcrypt = require('bcryptjs');
const pool = require('../db'); // Conexão exportada na Etapa 2
// ROTA: Login de Usuário Administrativo

router.post('/login', async (req, res) => {
  const { usuario, senha } = req.body;

  if (!usuario || !senha) {
    return res.status(400).json({ erro: 'Informe usuário e senha.' });
  }

  try {
    const resultado = await pool.query(
      'SELECT * FROM admin_user WHERE usuario = $1',
      [usuario]
    );

    if (resultado.rows.length === 0) {
      return res.status(401).json({ erro: 'Credenciais inválidas.' });
    }

    const admin = resultado.rows[0];
    const senhaValida = await bcrypt.compare(senha, admin.senha_hash);

    if (!senhaValida) {
      return res.status(401).json({ erro: 'Credenciais inválidas.' });
    }

    return res.json({
      mensagem: 'Autenticação realizada com sucesso!',
      usuario: {
        id: admin.id,
        usuario: admin.usuario
      }
    });
  } catch (erro) {
    console.error('Erro no login:', erro);
    return res.status(500).json({ erro: 'Erro interno do servidor.' });
  }
});
module.exports = router;