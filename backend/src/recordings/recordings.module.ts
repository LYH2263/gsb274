import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { RecordingsService } from './recordings.service';
import { RecordingsController } from './recordings.controller';
import { Recording, RecordingSchema } from './schemas/recording.schema';
import { RecordingValidator } from './recording.validator';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Recording.name, schema: RecordingSchema }]),
  ],
  controllers: [RecordingsController],
  providers: [RecordingsService, RecordingValidator],
  exports: [RecordingsService],
})
export class RecordingsModule {}
