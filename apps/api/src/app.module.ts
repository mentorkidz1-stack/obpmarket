import { Module } from '@nestjs/common';
import { AppController } from './app.controller.js';
import { AppService } from './app.service.js';
import { ConfigModule } from './config/config.module.js';
import { PrismaModule } from './prisma/prisma.module.js';
import { AuthModule } from './auth/auth.module.js';
import { UsersModule } from './users/users.module.js';
import { MarketsModule } from './markets/markets.module.js';
import { ProductsModule } from './products/products.module.js';
import { PriceReadingsModule } from './price-readings/price-readings.module.js';
import { ReferencePricesModule } from './reference-prices/reference-prices.module.js';
import { OrdersModule } from './orders/orders.module.js';
import { StockModule } from './stock/stock.module.js';
import { WalletModule } from './wallet/wallet.module.js';
import { LiquidityModule } from './liquidity/liquidity.module.js';
import { ResaleModule } from './resale/resale.module.js';
import { VendorModule } from './vendor/vendor.module.js';
import { BannersModule } from './banners/banners.module.js';
import { PaymentInfoModule } from './payment-info/payment-info.module.js';
import { ExchangeRatesModule } from './exchange-rates/exchange-rates.module.js';
import { ContactModule } from './contact/contact.module.js';
import { PropertiesModule } from './properties/properties.module.js';
import { NotificationsModule } from './notifications/notifications.module.js';
import { PriceAlertsModule } from './price-alerts/price-alerts.module.js';
import { AuditModule } from './audit/audit.module.js';
import { AdminModule } from './admin/admin.module.js';

@Module({
  imports: [
    ConfigModule,
    PrismaModule,
    AuthModule,
    UsersModule,
    MarketsModule,
    ProductsModule,
    ReferencePricesModule,
    PriceReadingsModule,
    OrdersModule,
    StockModule,
    WalletModule,
    LiquidityModule,
    ResaleModule,
    VendorModule,
    BannersModule,
    PaymentInfoModule,
    ExchangeRatesModule,
    ContactModule,
    PropertiesModule,
    NotificationsModule,
    PriceAlertsModule,
    AuditModule,
    AdminModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
