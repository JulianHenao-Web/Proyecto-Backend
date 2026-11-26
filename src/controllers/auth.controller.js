const authService = require('../services/auth.service');
const handleError = require('../utils/handleError');

exports.login = async (req, res) => {
    try {
        const { email, password } = req.body;

        if (typeof email !== 'string' || typeof password !== 'string' || !email || !password) {
            return res.status(400).json({ message: 'Email y contraseña son obligatorios' });
        }

        const token = await authService.loginUser(email.trim(), password);

        return res.status(200).json({ token });
    } catch (err) {
        return handleError(res, err);
    }
};
