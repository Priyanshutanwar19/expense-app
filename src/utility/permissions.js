const { ADMIN_ROLE, VIEWER_ROLE, MANAGER_ROLE } = require("./userRoles");
const permissions = {

    [ADMIN_ROLE]: [
        'user:create',
        'user:update',
        'user:delete',
        'user:view',
        'group:create',
        'group:update',
        'group:delete',
        'group:view',
        'expense:create',
        'expense:view',
        'expense:delete',
        'payment:create'
    ],

    [VIEWER_ROLE]: [
        'user:view',
        'group:view',
        'expense:view'
    ],

    [MANAGER_ROLE]: [
        'user:view',
        'group:create',
        'group:update',
        'group:view',
        'expense:create',
        'expense:view',
        'expense:delete'
    ]

};

module.exports = permissions;
