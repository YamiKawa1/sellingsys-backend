import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'users'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id')
      table.string('email', 80).unique().notNullable
      table.string('name').notNullable
      table.text('address')
      table.string('phone')
      table.string('password').notNullable
      table.integer('rol_id').unsigned().references('id').inTable('rols')
      
      table.timestamp('created_at')
      table.timestamp('updated_at')
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}