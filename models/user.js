const _ = require('lodash')

const { knex } = require('./index')
const { hashPassword } = require('../utils/auth')
const Role = require('./role')

module.exports = class User {
    static async fetchUserByEmail(email) {
        const user = await knex
            .first('id', 'email', 'name', 'password_hash', 'role_id', 'external')
            .from('user')
            .where('email', email)

        if (!user) {
            throw new Error('user not found')
        }

        const permissions = await Role.getPermissionsByRole(user.role_id)

        user.permissions = permissions.map((p) => _.pick(p, 'resource_code', 'permission_code'))

        return user
    }

    static async getUsers() {
        return knex('user').select()
    }

    static async updateUser(id, atts) {
        delete atts.email
        if (atts.password) {
            atts.password_hash = hashPassword(atts.password)
            delete atts.password
        }

        await knex('user').update(atts)
.where('id', id)

        return 0
    }
}
