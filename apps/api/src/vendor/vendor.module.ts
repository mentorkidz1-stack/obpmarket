import { Module } from '@nestjs/common';
import { VendorService } from './vendor.service.js';
import { VendorProfileController } from './vendor-profile.controller.js';
import { VendorListingController } from './vendor-listing.controller.js';
import { AuthModule } from '../auth/auth.module.js';
import { ReferencePricesModule } from '../reference-prices/reference-prices.module.js';
import { DepotsModule } from '../depots/depots.module.js';

@Module({
  imports: [AuthModule, ReferencePricesModule, DepotsModule],
  controllers: [VendorProfileController, VendorListingController],
  providers: [VendorService],
})
export class VendorModule {}
