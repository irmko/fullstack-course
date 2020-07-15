const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')
const User = require('../models/User')
const keys = require('../config/keys')
const errorHandler = require('../utills/errorHandler')


module.exports.login = async (req, res) => {
    console.log('body=',req.body)
    const email = req.body.email
    const password = req.body.password
    const candidate = await User.findOne({
        email: email
    })

    console.log('candidate=', candidate)

    if(candidate) {
        // проверка пароля, пользователь существует
        const passwordResult = bcrypt.compareSync(password, candidate.password)
        if(passwordResult) {
            // Генерация токена, пароли совпали
            const token = jwt.sign({
                email: candidate.email,
                userId: candidate._id
            }, keys.jwt, {
                expiresIn: 60 * 60
            })
            res.status(200).json({
                token: `Bearer ${token}`
            })
        } else {
            // пароли не совпали
            res.status(401).json({
                message: 'Пароли не совпадают. Поаробуйте еще раз'
            })
        }
    } else {
        // пользователя нет, ошибка
        res.status(404).json({
            message: `Пользователь с email ${email} не найден`
        })
    }
}

module.exports.register = async (req, res) => {
    const candidate = await User.findOne({
        email: req.body.email
    })

    if( candidate) {
        // Пользователь существует, нужно отправить ошибку
        res.status(409).json({
            message: 'Такой емайл уже занят. Попробуйте другой.'
        })
    } else {
        // Нужно создать пользователя
        const salt = bcrypt.genSaltSync(10)
        const password = req.body.password
        const user = new User({
            email: req.body.email,
            password: bcrypt.hashSync(password, salt)
        })

        try {
            await user.save()
            res.status(201).json(user)
        } catch (e) {
            errorHandler(res, e)
        }
    }
}
