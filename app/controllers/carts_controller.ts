// import type { HttpContext } from '@adonisjs/core/http'
import Cart from '#models/cart'
import Product from '#models/product';
import type { HttpContext } from '@adonisjs/core/http'
import { ApiResponse } from '../utilities/responses.js'
const res = new ApiResponse()

export default class CartsController {
    async handle_cart({ request, response }: HttpContext){
        try {
            const {id, products, user_id} = request.body()
            
            if (!id) {
                return response.status(500).send(res.inform('Es necesario el id del carrito')) 
            }

            if(products.length < 1) return response.status(500).send(res.inform('Es necesario al menos un producto')) 
                                            
            var is_cart

            if (user_id) {
                is_cart = await Cart.findBy('user_id', user_id)
            } else{
                is_cart = await Cart.find(id)
            }

            var err
            for (const product of products) {
                const product_id = product.id
                const quantity = product.quantity

                const is_product = await Product.find(product_id)
                
                if (!is_product) {
                    err = `Este producto ${product_id} no existe`   
                    break                 
                }

                if (is_product.available_quantity < quantity) {
                    err =`La cantidad pedida del producto ${product_id} excede los productos disponibles`
                    break
                }
            };            
            if (err) return response.status(500).send(res.inform(err)) 
            
            var saved
            if (is_cart) {
                is_cart.products = products
                saved = await is_cart.save()
            }else{
                saved = await Cart.create({
                    id: id,
                    products: products,
                    user_id: user_id
                })    
            }
    

            return response.status(200).send(res.provide(saved, `El carrito fue operado correctamente`))    
                    
        } catch (error) {
            console.log(error);
            if (error.code == 'E_ROW_NOT_FOUND') return response.status(404).send(res.inform('No existe este producto'))
            return response.status(500).send(res.unexpected())
        }
    }

    async add_product({ request, response }: HttpContext){
        try {
            const {products, user_id} = request.body()

            if(Object.keys(products).length != 1) return response.status(500).send(res.inform('Es necesario un producto y solo un producto')) 
            
            const product = Object.keys(products)[0]
            const quantity = products[product]
            const is_cart = await Cart.findByOrFail('user_id', user_id)
            
            const is_product = await Product.findByOrFail('name', product)

            if (is_product.available_quantity < quantity) return response.status(200).send(res.inform('La cantidad pedida excede los productos disponibles'))

            is_cart.products[product]  ? is_cart.products[product] += quantity : is_cart.products[product] = quantity

            is_cart.save()

            return response.status(200).send(res.provide(is_cart, 'El producto fue añadido correctamente'))
                    
        } catch (error) {
            console.log(error);
            if (error.code == 'E_ROW_NOT_FOUND') return response.status(404).send(res.inform('No existe este producto o el carro no fue encontrado'))
            return response.status(500).send(res.unexpected())
        }
    }

    async delete_product({ request, response }: HttpContext){
        try {
            const {product, user_id} = request.body()
            
            const is_cart = await Cart.findByOrFail('user_id', user_id)
            
            await Product.findByOrFail('name', product)

            delete is_cart.products[product] 

            is_cart.save()

            return response.status(200).send(res.provide(is_cart, 'El producto fue borrado correctamente'))
                    
        } catch (error) {
            console.log(error);
            if (error.code == 'E_ROW_NOT_FOUND') return response.status(404).send(res.inform('No existe este producto o el carro no fue encontrado'))
            return response.status(500).send(res.unexpected())
        }
    }

    async update_product({ request, response }: HttpContext){
        try {
            const {products, user_id} = request.body()

            if(Object.keys(products).length != 1) return response.status(500).send(res.inform('Es necesario un producto y solo un producto')) 
            
            const product = Object.keys(products)[0]
            const quantity = products[product]
            const is_cart = await Cart.findByOrFail('user_id', user_id)
            
            const is_product = await Product.findByOrFail('name', product)

            if (is_product.available_quantity < quantity) return response.status(200).send(res.inform('La cantidad pedida excede los productos disponibles'))

            is_cart.products[product] = quantity

            is_cart.save()

            return response.status(200).send(res.provide(is_cart, 'El producto fue actualizado correctamente'))
                    
        } catch (error) {
            console.log(error);
            if (error.code == 'E_ROW_NOT_FOUND') return response.status(404).send(res.inform('No existe este producto o el carro no fue encontrado'))
            return response.status(500).send(res.unexpected())
        }
    }
}