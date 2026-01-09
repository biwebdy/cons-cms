module.exports = {
    routes: [
        {
            method: 'POST',
            path: '/users/change-password',
            handler: 'user.changePassword',
            config: {
                policies: [],
                middlewares: [],
            },
        },
        {
            method: 'POST',
            path: '/users/forgot-password',
            handler: 'user.forgotPassword',
            config: {
                policies: [],
                middlewares: [],
            },
        },
        {
            method: 'POST',
            path: '/users/verify-otp',
            handler: 'user.verifyOTP',
            config: {
                policies: [],
                middlewares: [],
            },
        },
        {
            method: 'POST',
            path: '/users/reset-password',
            handler: 'user.resetPassword',
            config: {
                policies: [],
                middlewares: [],
            },
        },
        {
            method: 'POST',
            path: '/users/l4/:id/toggle-activation',
            handler: 'user.toggleL4Activation',
            config: {
              policies: [
              ],
            },
          },
          {
            method: 'POST',
            path: '/users/l4/create-by-l3',
            handler: 'user.createL4UserByL3',
            config: {
              policies: [
              ],
            },
          },
          {
            method: 'POST',
            path: '/users/l4/create-by-l1',
            handler: 'user.createL4UserByL1',
            config: {
              policies: [
              ],
            },
          },
          {
            method: 'POST',
            path: '/users/l4/:id/reset-password',
            handler: 'user.resetL4Password',
            config: {
              policies: [
              ],
            },
          },
          {
            method: 'GET',
            path: '/users/l4',
            handler: 'user.getL4Users',
            config: {
              policies: [
              ],
            },
          },
    ],
};