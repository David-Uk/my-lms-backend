import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AiService } from './ai.service';
import { AiController } from './ai.controller.js';
import { AiProcessor } from './ai.processor';

@Module({
  imports: [ConfigModule],
  providers: [AiService, AiProcessor],
  controllers: [AiController],
})
export class AiModule { }

