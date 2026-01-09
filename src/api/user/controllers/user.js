const util = require("../../../utils/util");
module.exports = {
  async forgotPassword(ctx) {
    try {
      console.log('forgotPassword');
      const { email } = ctx.request.body;

      if (!email) {
        return ctx.badRequest('Email is required');
      }

      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        return ctx.badRequest('Invalid email format');
      }

      const user = await strapi.db.query('plugin::users-permissions.user').findOne({
        where: { email },
      });

      if (!user) {
        return ctx.send({
          message: 'If the email exists, you will receive an OTP shortly.',
        });
      }

      const activeOTP = await strapi.service('api::otp.otp').getActiveOTP(ctx, user.id);
      if (activeOTP) {
        return ctx.badRequest('You already have an active OTP. Please check your email or wait for the current OTP to expire.');
      }

      const otpRecord = await strapi.service('api::otp.otp').generateOTP(ctx, user);

      await util.sendOtpForUser(email, otpRecord.code);

      return ctx.send({
        message: 'OTP has been sent to your email.',
      });

    } catch (error) {
      console.log(error);
      if (error.message.includes('maximum password reset requests')) {
        return ctx.badRequest(error.message);
      }
      return ctx.internalServerError('An error occurred');
    }
  },

  async verifyOTP(ctx) {
    try {
      const { email, otp } = ctx.request.body;

      if (!email || !otp) {
        return ctx.badRequest('Email and OTP are required');
      }

      const user = await strapi.db.query('plugin::users-permissions.user').findOne({
        where: { email },
      });

      if (!user) {
        return ctx.badRequest('Invalid OTP');
      }

      const isValid = await strapi.service('api::otp.otp').verifyOTP(ctx, user.id, otp);

      if (isValid) {
        const resetToken = await strapi.plugins['users-permissions'].services.jwt.issue(
          {
            id: user.id,
            email,
            type: 'password-reset'
          },
          { expiresIn: '15m' }  // Using string format for expiresIn
        );

        return ctx.send({
          resetToken,
        });
      }

    } catch (error) {
      console.log(error);
      return ctx.badRequest(error.message);
    }
  },

  async resetPassword(ctx) {
    try {
      const { resetToken, password } = ctx.request.body;

      if (!resetToken || !password) {
        return ctx.badRequest('Reset token and new password are required');
      }

      let tokenData;
      try {
        tokenData = await strapi.service('plugin::users-permissions.jwt').verify(resetToken);
        console.log('tokenData', tokenData);
        if (tokenData.type !== 'password-reset') {
          throw new Error('Invalid token type');
        }
      } catch (error) {
        console.error('Error verifying token:', error);
        return ctx.badRequest('Invalid or expired reset token');
      }

      if (password.length < 8) {
        return ctx.badRequest('Password must be at least 8 characters long');
      }

      const hashedPassword = await strapi.service("admin::auth").hashPassword(password);

      await strapi.db.query('plugin::users-permissions.user').update({
        where: { id: tokenData.id },
        data: { password: hashedPassword },
      });

      return ctx.send({
        message: 'Password has been reset successfully',
      });

    } catch (error) {
      console.log(error);
      return ctx.internalServerError('An error occurred');
    }
  },
  async changePassword(ctx) {
    try {
      const { currentPassword, password, passwordConfirmation } = ctx.request.body;
      console.log('changePassword', { currentPassword, password, passwordConfirmation });
      await this.changeUserPasswordWithVerification(ctx.user.id, currentPassword, password, passwordConfirmation);
      ctx.send({ message: 'Password changed successfully' });
    } catch (error) {
      console.error('Error changing user password:', error);
      ctx.badRequest('Error changing user password');
    }
  },
  async changeUserPasswordWithVerification(userId, oldPassword, newPassword, passwordConfirmation) {
    try {
      const userService = strapi.plugin('users-permissions').service('user');

      const user = await userService.fetch(userId);

      if (!user) {
        throw new Error('User not found');
      }
      const isPasswordValid = await userService.validatePassword(oldPassword, user.password);

      if (!isPasswordValid) {
        throw new Error('Old password is incorrect');
      }

      if (newPassword !== passwordConfirmation) {
        throw new Error('New password and confirmation do not match');
      }

      const updatedUser = await userService.edit(userId, { password: newPassword, passwordChanged: true });
      return updatedUser;
    } catch (error) {
      console.error('Error changing user password:', error);
      throw error;
    }
  },
  // L3 activation/deactivation of L4 users
  async toggleL4Activation(ctx) {
    const user = ctx.state.user;
    const { role } = user;

    if (role.name !== 'L3') {
      return ctx.forbidden('Only L3 users can activate/deactivate L4 users');
    }

    const { id } = ctx.params;
    const { action, comment } = ctx.request.body;

    // Find the L4 user
    const l4User = await strapi.entityService.findOne('plugin::users-permissions.user', id, {
      populate: ['role']
    });

    if (!l4User || l4User.role.name !== 'L4') {
      return ctx.notFound('L4 user not found');
    }

    // Toggle activation status
    const isActive = action === 'activate';

    const updatedUser = await strapi.entityService.update('plugin::users-permissions.user', id, {
      data: {
        isActive,
        blocked: !isActive // Also block/unblock the user
      }
    });



    // TODO: Notify L4 user about the activation/deactivation

    return { status: 200, data: updatedUser };
  },

  // L3 signup of L4 users
  async createL4UserByL3(ctx) {
    const user = ctx.state.user;
    const { role } = user;

    if (role.name !== 'L3') {
      return ctx.forbidden('Only L3 users can create L4 user accounts');
    }

    const { username, email, password, firstName, lastName } = ctx.request.body;

    // Check if user already exists
    const existingUser = await strapi.entityService.findMany('plugin::users-permissions.user', {
      filters: {
        $or: [
          { username },
          { email }
        ]
      }
    });

    if (existingUser.length > 0) {
      return ctx.badRequest('Username or email already exists');
    }

    // Get L4 role
    const l4Role = await strapi.entityService.findMany('plugin::users-permissions.role', {
      filters: {
        type: 'l4'
      }
    });

    if (!l4Role || l4Role.length === 0) {
      return ctx.internalServerError('L4 role not found');
    }

    // Create L4 user
    const newUser = await strapi.entityService.create('plugin::users-permissions.user', {
      data: {
        username,
        email,
        password,
        firstName,
        lastName,
        role: l4Role[0].id,
        confirmed: true,
        isActive: true,
        createdBy: user.id
      }
    });

    // Add to activation history
    await strapi.entityService.create('plugin::users-permissions.activation-history', {
      data: {
        action: 'Activated',
        actedBy: user.id,
        actedAt: new Date(),
        comment: 'Account created by L3',
        user: newUser.id
      }
    });

    // TODO: Send welcome email to L4 user

    return { data: newUser };
  },

  // L1 signup of L4 users
  async createL4UserByL1(ctx) {
    const user = ctx.state.user;
    const { role } = user;

    if (role.name !== 'L1') {
      return ctx.forbidden('Only L1 users can create L4 user accounts');
    }

    const { username, email, password, firstName, lastName } = ctx.request.body;

    // Check if user already exists
    const existingUser = await strapi.entityService.findMany('plugin::users-permissions.user', {
      filters: {
        $or: [
          { username },
          { email }
        ]
      }
    });

    if (existingUser.length > 0) {
      return ctx.badRequest('Username or email already exists');
    }

    // Get L4 role
    const l4Role = await strapi.entityService.findMany('plugin::users-permissions.role', {
      filters: {
        type: 'l4'
      }
    });

    if (!l4Role || l4Role.length === 0) {
      return ctx.internalServerError('L4 role not found');
    }

    // Create L4 user
    const newUser = await strapi.entityService.create('plugin::users-permissions.user', {
      data: {
        username,
        email,
        password,
        firstName,
        lastName,
        role: l4Role[0].id,
        confirmed: true,
        isActive: true,
        createdBy: user.id
      }
    });

    // Add to activation history
    await strapi.entityService.create('plugin::users-permissions.activation-history', {
      data: {
        action: 'Activated',
        actedBy: user.id,
        actedAt: new Date(),
        comment: 'Account created by L1',
        user: newUser.id
      }
    });

    // TODO: Send welcome email to L4 user

    return { data: newUser };
  },

  // Reset password for L4 users
  async resetL4Password(ctx) {
    const user = ctx.state.user;
    const { role } = user;

    if (role.name !== 'L3' && role.name !== 'L1') {
      return ctx.forbidden('Only L3 or L1 users can reset L4 passwords');
    }

    const { id } = ctx.params;
    const { newPassword } = ctx.request.body;

    // Find the L4 user
    const l4User = await strapi.entityService.findOne('plugin::users-permissions.user', id, {
      populate: ['role']
    });

    if (!l4User || l4User.role.name !== 'L4') {
      return ctx.notFound('L4 user not found');
    }

    // Update password
    const updatedUser = await strapi.entityService.update('plugin::users-permissions.user', id, {
      data: {
        password: newPassword,
        passwordChanged: false // Force user to change password on next login
      }
    });

    // TODO: Notify L4 user about the password reset

    return { data: updatedUser };
  },

  // Get L4 users
  async getL4Users(ctx) {
    const user = ctx.state.user;
    const { role } = user;

    if (role.name !== 'L3' && role.name !== 'L1') {
      return ctx.forbidden('Only L3 or L1 users can view L4 users');
    }

    // Get L4 role
    const l4Role = await strapi.entityService.findMany('plugin::users-permissions.role', {
      filters: {
        type: 'l4'
      }
    });

    if (!l4Role || l4Role.length === 0) {
      return ctx.internalServerError('L4 role not found');
    }

    // Get L4 users
    const l4Users = await strapi.entityService.findMany('plugin::users-permissions.user', {
      filters: {
        role: l4Role[0].id
      },
      populate: ['role', 'activationHistory']
    });

    return { data: l4Users };
  }
};