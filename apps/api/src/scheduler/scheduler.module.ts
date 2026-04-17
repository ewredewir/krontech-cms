import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { SchedulerService } from './scheduler.service';
import { PagesModule } from '../pages/pages.module';
import { BlogModule } from '../blog/blog.module';
import { ProductsModule } from '../products/products.module';
import { SeoModule } from '../seo/seo.module';
import { MediaModule } from '../media/media.module';

@Module({
  imports: [
    ScheduleModule.forRoot(),
    PagesModule,
    BlogModule,
    ProductsModule,
    SeoModule,
    MediaModule,
  ],
  providers: [SchedulerService],
})
export class CmsSchedulerModule {}
