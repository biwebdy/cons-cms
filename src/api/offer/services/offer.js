// @ts-nocheck
'use strict';

/**
 * offer service
 */

const { createCoreService } = require('@strapi/strapi').factories;

module.exports = createCoreService('api::offer.offer', ({ strapi }) => ({
    async handleOfferPeriodity(offers=null) {
        try {
          if (!offers || !offers.length) {
            // Get both pending offers and signed offers without purchase orders
            offers = await strapi.entityService.findMany('api::offer.offer', {
              filters: {
                $or: [
                  { status: 'Pending' },
                  { 
                    status: 'SigningCompletedByClient',
                    purchaseOrder: null
                  }
                ]
              }
            });
          }
      
          const now = new Date();
          
          for (const offer of offers) {
            // Logic A: Client must sign within 14 days of offer creation
            if (offer.status === 'Pending') {
              const createdAt = new Date(offer.createdAt);
              const daysSinceCreation = Math.floor((now.getTime() - createdAt.getTime()) / (1000 * 60 * 60 * 24));
              
              if (daysSinceCreation >= 14) {
                console.log(`Offer ${offer.id} is 14+ days old and still pending. Applying logic A.`);
                await this.applyLogicA(offer);
              }
            }
            
            // Logic B: Client needs to upload purchase order within 7 days of signing
            if (offer.status === 'SigningCompletedByClient' && !offer.purchaseOrder && offer.signingCompletedAt) {
              const signingCompletedAt = new Date(offer.signingCompletedAt);
              const daysSinceSigning = Math.floor((now.getTime() - signingCompletedAt.getTime()) / (1000 * 60 * 60 * 24));
              
              if (daysSinceSigning >= 7) {
                console.log(`Offer ${offer.id} was signed 7+ days ago but still has no purchase order. Applying logic B.`);
                await this.applyLogicB(offer);
              }
            }
          }
          
          return { success: true, message: 'Offer periodity check completed' };
        } catch (error) {
          console.error('Error in handleOfferPeriodity:', error);
          return { success: false, error: error.message };
        }
      },
      
      async applyLogicA(offer) {
        try {
          await strapi.entityService.update('api::offer.offer', offer.id, {
            data: {
              status: 'Expired'
            }
          });
        } catch (error) {
          console.error(`Error applying Logic A to offer ${offer.id}:`, error);
        }
      },
      
      async applyLogicB(offer) {
        try {
          await strapi.entityService.update('api::offer.offer', offer.id, {
            data: {
              status: 'ExpiredPO'
            }
          });
        } catch (error) {
          console.error(`Error applying Logic B to offer ${offer.id}:`, error);
        }
      }

}));