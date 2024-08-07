// import type { HttpContext } from '@adonisjs/core/http'
import hash from '@adonisjs/core/services/hash'
import User from "#models/user";
import Rol from "#models/rol";
import db from '@adonisjs/lucid/services/db'
import mail from '@adonisjs/mail/services/main'
import { ApiResponse } from '../utilities/responses.js'
const res = new ApiResponse()
import jwt from 'jsonwebtoken'

import type { HttpContext } from '@adonisjs/core/http'

export default class AuthController {
    async login({request, response}: HttpContext) {
        const {email, password} = request.body()

        if(!email || !password) return response.status(400).send(res.inform('Los datos son obligatorios'))

        const is_user = await User.findBy('email', email)
        
        if (!is_user) {
            return response.status(404).send(res.inform('el usuario no fue encontrado'))
        }
        const password_ok = await hash.verify(is_user.password, password)

        if (!password_ok) {
            return response.status(404).send(res.inform('Contrasenha erronea'))
        }
        
        const token = jwt.sign({ name: is_user.name, id: is_user.id, rol_id: is_user.rol_id}, process.env.JWT_SECRET, {expiresIn: '1d'});

        return response.status(200).send(res.provide(token, 'Usuario Verificado'))
    }

    async signup({request, response}: HttpContext) {
        try {
            const { email, name, phone, password } = request.body()
            
            if(!email || !name || !phone || !password) return response.status(400).send(res.inform('Los datos son obligatorios'))
            
            
            if (!password.match(/^(?=.*[A-Za-z])(?=.*\d)(?=.*[@$!%*.^,#?&])[A-Za-z\d@$!%*,.^#?&]{8,}$/)){
                return response.status(400).send(res.inform('La contraseña debe tener mínimo 8 caracteres, 1 letra, 1 número y un carácter especial'))
            }
            
            if (!phone.match(/^\d{11}$/)) {
                return response.status(400).send(res.inform('El número de teléfono debe ser 11 dígitos'))
            }

            if (!email.match(/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/)){
                return response.status(400).send(res.inform('El correo electrónico es incorrecto'))
            }
            
            const hashedPassword = await hash.make(password);

            const is_user = await User.findBy('email', email)
            if (is_user) return response.status(400).send(res.inform('El correo electrónico ya esta en uso'))

            const rol = await Rol.findBy('id', 3)

            if (!rol) {
                return response.status(400).send(res.inform(`El Rol User no fue encontrado`))
            }

            const newUser = await db
            .table('users')
            .returning(['id', 'rol_id', 'name'])
            .insert({
                name: name,
                email: email,
                phone: phone,
                rol_id: rol.id,
                password: hashedPassword
            })
          
            const token = jwt.sign({ name: newUser[0].name, id: newUser[0].id, rol_id: newUser[0].rol_id}, process.env.JWT_SECRET, {expiresIn: '1d'});

            return response.status(200).send(res.provide(token, 'Usuario Creado'))
        } catch (error) {
            response.status(500).send(res.unexpected())
            console.log(error);
        }
    }

    async send_password_recover({request, response}: HttpContext) {
        const {email} = request.body()
        
        const is_user = await User.findBy('email', email)
        
        if (!is_user) {
            return response.status(404).send(res.inform('el usuario no fue encontrado'))
        }

        const token = jwt.sign({ user_id: is_user.id}, process.env.JWT_SECRET, {expiresIn: '1d'})

        const url_token = process.env.FRONT_URL + '/auth/change-password/' + token
        
        await mail.send((message) => {
            message
              .to(email)
              .subject('Verify your email address')
              .text(url_token)
          })

        return response.status(200).send(res.provide(null, 'Link de recuperacion enviado'))
    }

    async change_password({request, response}: HttpContext) {
        try {
            const {verify_token, newPassword} = request.body()

            var decoded = jwt.verify(verify_token, process.env.JWT_SECRET);
    
            const is_user = await User.find(decoded.user_id)
            
            if (!is_user) {
                return response.status(404).send(res.inform('el usuario no fue encontrado'))
            }
    
            if (!newPassword.match(/^(?=.*[A-Za-z])(?=.*\d)(?=.*[@$!%*.^,#?&])[A-Za-z\d@$!%*,.^#?&]{8,}$/)){
                return response.status(403).send(res.inform('La contraseña debe tener mínimo 8 caracteres, 1 letra, 1 número y un carácter especial'))
            }
    
            const hashedPassword = await hash.make(newPassword);
    
            is_user.password = hashedPassword
    
            is_user.save()
    
            const token = jwt.sign({ name: is_user.name, rol_id: is_user.rol_id}, process.env.JWT_SECRET, {expiresIn: '1d'});
    
            return response.status(200).send(res.provide(token, 'Contraseña actualizada exitosamente'))
    
        } catch (error) {
            return response.status(500).send(res.unexpected())
    
        }
    }
}