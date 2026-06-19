import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { RecordingsService } from './recordings.service';
import { RecordingsController } from './recordings.controller';
import { RecordingsGuard } from './recordings.guard';
import { Recording, RecordingSchema } from './schemas/recording.schema';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Recording.name, schema: RecordingSchema }]),
  ],
  controllers: [RecordingsController],
  providers: [RecordingsService, RecordingsGuard],
  exports: [RecordingsService],
})
export class RecordingsModule {}
