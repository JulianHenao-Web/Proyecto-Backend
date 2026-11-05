const authService = require('../services/auth.service');
 
exports.login = async (req, res) => {
    try {
        const { email, password } = req.body;
 
        if (!email || !password) {
            return res.status(400).json({ message: 'Email y contraseña son obligatorios' });
        }
 
        const token = await authService.loginUser(email, password);
 
        return res.status(200).json({ token });
    } catch (err) {
        return res.status(401).json({ message: err.message });
    }
};