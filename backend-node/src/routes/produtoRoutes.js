const express = require('express');
const router = express.Router();

router.delete('/lote', async (req, res) => {
    const { ids } = req.body;
    
    if (!ids || !Array.isArray(ids) || ids.length === 0) {
        return res.status(400).json({ erro: 'Nenhum ID fornecido.' });
    }

    try {
        const query = 'DELETE FROM produtos WHERE id = ANY($1::int[])';
        // const result = await pool.query(query, [ids]);
        
        res.status(200).json({ mensagem: 'Itens excluídos com sucesso.' });
    } catch (erro) {
        res.status(500).json({ erro: 'Falha ao excluir itens.' });
    }
});

module.exports = router;
